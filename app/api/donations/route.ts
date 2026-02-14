import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// POST - Create a new donation
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { donorName, donorEmail, amount, method, message } = body

        if (!amount || !method) {
            return NextResponse.json(
                { error: 'Amount and method are required' },
                { status: 400 }
            )
        }

        if (!['bank', 'momo'].includes(method)) {
            return NextResponse.json(
                { error: 'Method must be "bank" or "momo"' },
                { status: 400 }
            )
        }

        // Check if user is logged in (optional)
        let userId: number | null = null
        try {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                })
                if (dbUser) userId = dbUser.id
            }
        } catch {
            // Guest donation - no user linked
        }

        const donation = await prisma.donation.create({
            data: {
                donorName: donorName || null,
                donorEmail: donorEmail || null,
                amount: typeof amount === 'number' ? amount : parseFloat(amount),
                method,
                message: message || null,
                userId,
            }
        })

        return NextResponse.json({
            message: 'Donation recorded successfully!',
            donation
        })
    } catch (error) {
        console.error('Error recording donation:', error)
        return NextResponse.json(
            { error: 'Failed to record donation', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

// GET - Admin only: list all donations
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
        })

        if (!dbUser || dbUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const status = searchParams.get('status')

        const where: any = {}
        if (status && status !== 'all') {
            where.status = status
        }

        const [donations, total, stats] = await Promise.all([
            prisma.donation.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { fullName: true, email: true } }
                }
            }),
            prisma.donation.count({ where }),
            prisma.donation.aggregate({
                _sum: { amount: true },
                _count: true,
                where: { status: 'confirmed' }
            })
        ])

        const pendingCount = await prisma.donation.count({ where: { status: 'pending' } })

        return NextResponse.json({
            donations,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            stats: {
                totalConfirmedAmount: stats._sum.amount || 0,
                totalConfirmedCount: stats._count,
                pendingCount
            }
        })
    } catch (error) {
        console.error('Error fetching donations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch donations' },
            { status: 500 }
        )
    }
}
