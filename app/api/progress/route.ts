import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

        // 1. Fetch User (for global streak/lastStudyDate/stats)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                studyStreak: true,
                lastStudyDate: true,
                averageScore: true,
                questionsAnswered: true
            }
        });

        // 2. Statistics Calculation (Dynamic or Pre-calculated)
        let totalQuestions = 0;
        let averageScore = 0;
        let totalExams = 0;

        // Helper to calculate 10-point scale average (for filtered category)
        const calculateStats = async (filter: any) => {
            const sessions = await prisma.examSession.findMany({
                where: {
                    ...filter,
                    mode: { in: ['mock', 'exam', 'practice'] },
                    questionCount: { gt: 0 } // exclude invalid sessions
                },
                select: { totalScore: true, questionCount: true }
            });

            if (sessions.length === 0) return { avg: 0, count: 0 };

            const sumScale10 = sessions.reduce((acc, s) => {
                const score = Number(s.totalScore || 0);
                const total = s.questionCount || 1;
                const scale10 = total > 0 ? (score / total) * 10 : 0;
                return acc + scale10;
            }, 0);

            return {
                avg: sumScale10 / sessions.length,
                count: sessions.length
            };
        };

        const filterObj = { userId, ...(categoryId ? { categoryId } : {}) };

        // Calculate Total Exams (always needed dynamically as we don't store it)
        // And if filtering by category, we must recalculate Avg Score & Question count.
        if (categoryId) {
            const [examStats, countStats] = await Promise.all([
                calculateStats(filterObj),
                prisma.examDetail.count({
                    where: {
                        session: filterObj,
                        userChoice: { not: null }
                    }
                })
            ]);
            averageScore = examStats.avg;
            totalExams = examStats.count;
            totalQuestions = countStats;
        } else {
            // Global View: Use pre-calculated User stats where possible
            totalQuestions = user?.questionsAnswered || 0;
            averageScore = user?.averageScore || 0;

            // Still need to count total exams dynamically
            totalExams = await prisma.examSession.count({
                where: {
                    userId,
                    mode: { in: ['mock', 'exam', 'practice'] },
                    questionCount: { gt: 0 }
                }
            });
        }

        const [performanceSessions, recentSessions] = await Promise.all([
            // 3. Performance Data (Last 7 days - unaffected by global filter usually? 
            // Actually, keep performance as last 7 days relative to NOW, generic dashboard widget)
            prisma.examSession.findMany({
                where: {
                    userId,
                    categoryId: categoryId ? categoryId : undefined, // Still filter by category if selected
                    mode: { in: ['mock', 'exam', 'practice'] },
                    startTime: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
                },
                select: { startTime: true, totalScore: true, questionCount: true },
                orderBy: { startTime: 'asc' }
            }),
            // 4. Recent Sessions (History - Revert to take 10)
            prisma.examSession.findMany({
                where: whereSession,
                orderBy: { startTime: 'desc' },
                take: 10, // Reverted to 10
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
        const performanceMap = new Map<string, { total: number, count: number, label: string }>();
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        // Helper to get local YYYY-MM-DD key
        const getDateKey = (date: Date) => {
            return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        };

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const key = getDateKey(d);
            const dayName = days[d.getDay()];
            const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

            performanceMap.set(key, {
                total: 0,
                count: 0,
                label: `${dayName} ${dateStr}`
            });
        }

        performanceSessions.forEach(session => {
            if (session.totalScore !== null) {
                const d = new Date(session.startTime);
                const key = getDateKey(d);
                const entry = performanceMap.get(key);

                if (entry) {
                    const score = Number(session.totalScore || 0);
                    const total = session.questionCount || 1;
                    const scale10 = total > 0 ? (score / total) * 10 : 0;

                    entry.total += scale10;
                    entry.count += 1;
                }
            }
        });

        const performanceData = Array.from(performanceMap.values()).map(stats => ({
            day: stats.label,
            value: stats.count > 0 ? Math.round(stats.total / stats.count) : 0
        }));

        // Calculate Best Score (Exam Mode Only)
        const examSessionsForBest = await prisma.examSession.findMany({
            where: {
                userId,
                categoryId: categoryId ? categoryId : undefined,
                mode: 'exam', // Only consider Mock Exam mode
                totalScore: { not: null },
                questionCount: { gt: 0 }
            },
            select: { totalScore: true, questionCount: true }
        });

        const bestScore = examSessionsForBest.length > 0
            ? Math.max(...examSessionsForBest.map(s => (Number(s.totalScore) / (s.questionCount || 1)) * 10))
            : 0;

        return NextResponse.json({
            stats: {
                totalQuestions: totalQuestions,
                averageScore: averageScore.toFixed(1), // Return 1 decimal
                totalExams: totalExams,
                studyStreak: user?.studyStreak || 0,
                bestScore: bestScore // Added bestScore
            },
            history: recentSessions,
            performance: performanceData
        });
    } catch (error) {
        console.error("Error fetching progress:", error);
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}
