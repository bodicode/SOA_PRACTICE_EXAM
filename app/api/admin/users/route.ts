import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''

        // 1. Auth Check
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

        // 2. Fetch Users
        const skip = (page - 1) * limit
        const whereClause = search ? {
            OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { fullName: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {}

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    createdAt: true,
                    avatarUrl: true,
                    lastStudyDate: true
                }
            }),
            prisma.user.count({ where: whereClause })
        ])

        return NextResponse.json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        })

    } catch (error) {
        console.error('Admin Users API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
