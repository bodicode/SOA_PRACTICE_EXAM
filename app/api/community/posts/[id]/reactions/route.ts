import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const VALID_REACTIONS = ['like', 'love', 'haha', 'wow', 'sad', 'angry']

// POST /api/community/posts/[id]/reactions - Add or update reaction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
        })

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { id } = await params
        const postId = parseInt(id)
        const body = await request.json()
        const { type } = body

        if (!VALID_REACTIONS.includes(type)) {
            return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
        }

        // Upsert reaction (create or update)
        const reaction = await prisma.reaction.upsert({
            where: {
                postId_userId: {
                    postId,
                    userId: dbUser.id,
                },
            },
            update: { type },
            create: {
                postId,
                userId: dbUser.id,
                type,
            },
        })

        return NextResponse.json(reaction)
    } catch (error) {
        console.error('Error adding reaction:', error)
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
    }
}

// DELETE /api/community/posts/[id]/reactions - Remove reaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
        })

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { id } = await params
        const postId = parseInt(id)

        await prisma.reaction.deleteMany({
            where: {
                postId,
                userId: dbUser.id,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing reaction:', error)
        return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
    }
}
