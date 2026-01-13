import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    const categoryIdParam = searchParams.get('categoryId');
    const categoryId = categoryIdParam ? parseInt(categoryIdParam) : undefined;

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        // Base filter for sessions
        const whereSession: any = {
            userId: userId,
        };

        // If category is selected, filter by it. 
        if (categoryId) {
            whereSession.categoryId = categoryId;
        }

        // 1. Fetch User (for global streak/lastStudyDate which are strictly user-level)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                studyStreak: true,
                lastStudyDate: true,
                questionsAnswered: true, // Fallback for global
                averageScore: true       // Fallback for global
            }
        });

        // 2. Statistics Calculation (Dynamic)
        let totalQuestions = 0;
        let averageScore = 0;

        // Helper to calculate 10-point scale average
        const calculateAverage10Scale = async (filter: any) => {
            const sessions = await prisma.examSession.findMany({
                where: {
                    ...filter,
                    mode: { in: ['mock', 'exam'] },
                    questionCount: { gt: 0 } // exclude invalid sessions
                },
                select: { totalScore: true, questionCount: true }
            });

            if (sessions.length === 0) return 0;

            const sumScale10 = sessions.reduce((acc, s) => {
                const score = Number(s.totalScore || 0);
                const total = s.questionCount || 1;
                const scale10 = total > 0 ? (score / total) * 10 : 0;
                return acc + scale10;
            }, 0);
            return sumScale10 / sessions.length;
        };

        if (categoryId) {
            // Recalculate for specific category
            const [avgScore, countStats] = await Promise.all([
                calculateAverage10Scale({ userId, categoryId }),
                prisma.examDetail.count({
                    where: {
                        session: { userId, categoryId },
                        userChoice: { not: null }
                    }
                })
            ]);
            averageScore = avgScore;
            totalQuestions = countStats;
        } else {
            // Global stats - Recalculate everything on 10-point scale for consistency
            // Ignoring stored user.averageScore as it might be raw score
            const [avgScore, countStats] = await Promise.all([
                calculateAverage10Scale({ userId }),
                prisma.examDetail.count({ // Accurate global answered count
                    where: {
                        session: { userId },
                        userChoice: { not: null }
                    }
                })
            ]);

            averageScore = avgScore;
            totalQuestions = countStats; // Use recalculated count for accuracy
        }

        const [performanceSessions, recentSessions] = await Promise.all([
            // 3. Performance Data (Last 7 days)
            prisma.examSession.findMany({
                where: {
                    ...whereSession,
                    mode: { in: ['mock', 'exam'] },
                    startTime: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
                },
                select: { startTime: true, totalScore: true, questionCount: true },
                orderBy: { startTime: 'asc' }
            }),
            // 4. Recent Sessions
            prisma.examSession.findMany({
                where: whereSession,
                orderBy: { startTime: 'desc' },
                take: 10,
                select: {
                    id: true,
                    mode: true,
                    startTime: true,
                    totalScore: true,
                    questionCount: true,
                }
            })
        ]);

        // Process Performance Data
        const performanceMap = new Map<string, { total: number, count: number }>();
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = days[d.getDay()];
            performanceMap.set(key, { total: 0, count: 0 });
        }

        performanceSessions.forEach(session => {
            if (session.totalScore !== null) {
                const day = days[new Date(session.startTime).getDay()];
                const entry = performanceMap.get(day);
                if (entry) {
                    const score = Number(session.totalScore || 0);
                    const total = session.questionCount || 1;
                    const scale10 = total > 0 ? (score / total) * 10 : 0;

                    entry.total += scale10;
                    entry.count += 1;
                }
            }
        });

        const performanceData = Array.from(performanceMap.entries()).map(([day, stats]) => ({
            day,
            value: stats.count > 0 ? Math.round(stats.total / stats.count) : 0
        }));

        return NextResponse.json({
            stats: {
                totalQuestions: totalQuestions,
                averageScore: Math.round(averageScore),
                studyStreak: user?.studyStreak || 0 // Streak is global
            },
            history: recentSessions,
            performance: performanceData
        });
    } catch (error) {
        console.error("Error fetching progress:", error);
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}
