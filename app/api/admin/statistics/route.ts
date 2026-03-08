import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { role: true } })
        if (!dbUser || dbUser.role.toLowerCase() !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const [
            // 1. Exam performance by category
            categoryStats,
            // 2. Top wrong questions
            wrongQuestions,
            // 3. User level distribution
            levelDist,
            // 4. Country distribution
            countryDist,
            // 5. Mode distribution (practice vs exam)
            modeDist,
            // 6. Sessions with timing info
            timingStats,
            // 7. Funnel: total users vs users who did exam
            totalUsers,
            usersWithExam,
            usersWithFiveExams,
            // 8. Top active users
            topUsers,
            // 9. Score distribution buckets
            allScores,
            // 10. Daily activity heatmap (last 30 days by hour)
            hourlyActivity,
        ] = await Promise.all([
            // 1. Performance per category
            prisma.examSession.groupBy({
                by: ['categoryId'],
                where: { endTime: { not: null }, totalScore: { not: null } },
                _avg: { totalScore: true },
                _count: { id: true },
                _sum: { totalScore: true },
            }),

            // 2. Most wrong questions
            prisma.examDetail.groupBy({
                by: ['questionId'],
                where: { isCorrect: false, questionId: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),

            // 3. Level distribution
            prisma.user.groupBy({
                by: ['level'],
                _count: { id: true },
            }),

            // 4. Country distribution
            prisma.user.groupBy({
                by: ['country'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),

            // 5. Mode distribution
            prisma.examSession.groupBy({
                by: ['mode'],
                where: { endTime: { not: null } },
                _count: { id: true },
                _avg: { totalScore: true },
            }),

            // 6. Avg duration per session
            prisma.$queryRaw<Array<{ avg_seconds: number }>>`
                SELECT AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime"))) as avg_seconds
                FROM "ExamSession"
                WHERE "endTime" IS NOT NULL
            `,

            // 7. Funnel data
            prisma.user.count(),
            prisma.user.count({ where: { examSessions: { some: {} } } }),
            prisma.user.count({ where: { examSessions: { some: {} } }, }),

            // 8. Top 10 active users
            prisma.user.findMany({
                take: 10,
                orderBy: { questionsAnswered: 'desc' },
                select: {
                    fullName: true, email: true, level: true,
                    questionsAnswered: true, averageScore: true, studyStreak: true,
                    _count: { select: { examSessions: true } }
                },
            }),

            // 9. All completed scores for distribution
            prisma.examSession.findMany({
                where: { endTime: { not: null }, totalScore: { not: null }, questionCount: { gt: 0 } },
                select: { totalScore: true, questionCount: true },
            }),

            // 10. Hourly activity
            prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
                SELECT EXTRACT(HOUR FROM "startTime") as hour, COUNT(*) as count
                FROM "ExamSession"
                WHERE "startTime" >= NOW() - INTERVAL '30 days'
                GROUP BY EXTRACT(HOUR FROM "startTime")
                ORDER BY hour
            `,
        ])

        // Fetch category names for categoryStats
        const categoryIds = categoryStats.map(c => c.categoryId).filter(Boolean) as number[]
        const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
        })
        const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

        // Fetch question content for wrong questions
        const questionIds = wrongQuestions.map(q => q.questionId).filter(Boolean) as number[]
        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
            select: { id: true, content: true, category: { select: { name: true } } },
        })
        const qMap = Object.fromEntries(questions.map(q => [q.id, q]))

        // Users with ≥ 5 exams
        const usersWithFiveExamsActual = await prisma.user.count({
            where: { examSessions: { some: {} } },
        })
        // Raw count per user
        const userExamCounts = await prisma.examSession.groupBy({
            by: ['userId'],
            _count: { id: true },
        })
        const usersWithFiveExamsCount = userExamCounts.filter(u => u._count.id >= 5).length

        // Score distribution (0-20%, 20-40%, 40-60%, 60-80%, 80-100%)
        const scoreBuckets = [0, 0, 0, 0, 0]
        for (const s of allScores) {
            const pct = (Number(s.totalScore) / (s.questionCount || 1)) * 100
            if (pct < 20) scoreBuckets[0]++
            else if (pct < 40) scoreBuckets[1]++
            else if (pct < 60) scoreBuckets[2]++
            else if (pct < 80) scoreBuckets[3]++
            else scoreBuckets[4]++
        }

        return NextResponse.json({
            // 1. Category performance
            categoryPerformance: categoryStats.map(c => ({
                name: catMap[c.categoryId!] || `Category ${c.categoryId}`,
                sessions: c._count.id,
                avgScore: c._avg.totalScore ? Math.round(Number(c._avg.totalScore) * 100) / 100 : 0,
            })).sort((a, b) => b.sessions - a.sessions),

            // 2. Top wrong questions
            topWrongQuestions: wrongQuestions.map(q => ({
                questionId: q.questionId,
                wrongCount: q._count.id,
                content: qMap[q.questionId!]?.content?.substring(0, 120) || 'N/A',
                category: qMap[q.questionId!]?.category?.name || 'Unknown',
            })),

            // 3. Level distribution
            levelDistribution: levelDist.map(l => ({
                level: l.level || 'Unknown',
                count: l._count.id,
            })),

            // 4. Country distribution
            countryDistribution: countryDist.map(c => ({
                country: c.country || 'Unknown',
                count: c._count.id,
            })),

            // 5. Mode stats
            modeStats: modeDist.map(m => ({
                mode: m.mode,
                count: m._count.id,
                avgScore: m._avg.totalScore ? Math.round(Number(m._avg.totalScore) * 100) / 100 : 0,
            })),

            // 6. Avg session duration
            avgSessionMinutes: timingStats[0]
                ? Math.round(Number(timingStats[0].avg_seconds) / 60)
                : 0,

            // 7. Funnel
            funnel: {
                totalUsers,
                usersWithExam,
                usersWithFiveExams: usersWithFiveExamsCount,
            },

            // 8. Top users
            topUsers: topUsers.map(u => ({
                name: u.fullName || u.email,
                level: u.level,
                questionsAnswered: u.questionsAnswered,
                avgScore: Math.round(Number(u.averageScore) * 100) / 100,
                studyStreak: u.studyStreak,
                totalSessions: u._count.examSessions,
            })),

            // 9. Score distribution
            scoreDistribution: [
                { range: '0–20%', count: scoreBuckets[0] },
                { range: '20–40%', count: scoreBuckets[1] },
                { range: '40–60%', count: scoreBuckets[2] },
                { range: '60–80%', count: scoreBuckets[3] },
                { range: '80–100%', count: scoreBuckets[4] },
            ],

            // 10. Hourly activity
            hourlyActivity: Array.from({ length: 24 }, (_, h) => {
                const found = hourlyActivity.find(a => Number(a.hour) === h)
                return { hour: `${h}h`, count: found ? Number(found.count) : 0 }
            }),
        })
    } catch (error) {
        console.error('Statistics API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
