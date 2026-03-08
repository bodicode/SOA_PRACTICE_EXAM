import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        // 1. Auth Check
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Role Check (Must fetch from DB as metadata might be stale)
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { role: true }
        })

        if (!dbUser || dbUser.role.toLowerCase() !== 'admin') { // Case-insensitive check
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 3. Fetch Stats
        const [
            totalUsers,
            totalQuestions,
            totalExams,
            activeUsers7Days,
            recentUsers,
            recentExams
        ] = await Promise.all([
            prisma.user.count(),
            prisma.question.count(),
            prisma.examSession.count(),
            prisma.user.count({
                where: {
                    lastStudyDate: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),
            // Recent Activity: New Users
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, fullName: true, email: true, createdAt: true }
            }),
            // Recent Activity: Completed Exams
            prisma.examSession.findMany({
                take: 5,
                where: { endTime: { not: null } },
                orderBy: { endTime: 'desc' },
                include: {
                    user: { select: { fullName: true, email: true } },
                    category: { select: { name: true } }
                }
            })
        ])

        // 4. Format Recent Activity
        const recentActivity = [
            ...recentUsers.map(u => ({
                type: 'USER_REGISTER',
                id: `user-${u.id}`,
                title: `Người dùng mới đăng ký: ${u.fullName || u.email}`,
                date: u.createdAt,
                user: u
            })),
            ...recentExams.map(e => ({
                type: 'EXAM_COMPLETE',
                id: `exam-${e.id}`,
                title: `${e.user.fullName || e.user.email} đã hoàn thành bài thi`,
                date: e.endTime!,
                score: e.totalScore !== null && e.totalScore !== undefined
                    ? Number(e.totalScore)
                    : undefined,
                questionCount: e.questionCount,
                mode: e.mode,
                category: e.category?.name ?? null,
                user: e.user
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

        return NextResponse.json({
            stats: {
                totalUsers,
                totalQuestions,
                totalExams,
                activeUsers7Days
            },
            recentActivity,
            debug: {
                totalExamsAllTime: totalExams,
                latestExamDate: recentExams[0]?.endTime || recentExams[0]?.user || 'No exams'
            }
        })

    } catch (error) {
        console.error('Admin Dashboard API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
