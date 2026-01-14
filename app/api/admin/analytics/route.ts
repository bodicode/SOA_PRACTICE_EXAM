import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        // 1. Auth Check (Reuse logic or middleware in future, keeping explicit here for now)
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { role: true }
        })

        if (!dbUser || dbUser.role.toLowerCase() !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. Fetch Data for Charts (Last 30 Days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        const [users, exams] = await Promise.all([
            prisma.user.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true }
            }),
            prisma.examSession.findMany({
                where: { startTime: { gte: thirtyDaysAgo } },
                select: { startTime: true }
            })
        ])

        // 3. Process Data Grouping
        const processByDate = (items: any[], dateKey: string) => {
            const counts: { [key: string]: number } = {}
            items.forEach(item => {
                const date = new Date(item[dateKey]).toISOString().split('T')[0] // YYYY-MM-DD
                counts[date] = (counts[date] || 0) + 1
            })
            return Object.entries(counts)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date))
        }

        const userGrowth = processByDate(users, 'createdAt')
        const examActivity = processByDate(exams, 'startTime')

        return NextResponse.json({
            userGrowth,
            examActivity
        })

    } catch (error) {
        console.error('Admin Analytics API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
