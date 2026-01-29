import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET /api/community/posts/[id]/comments - List comments with replies
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const postId = parseInt(id)

        const comments = await prisma.comment.findMany({
            where: {
                postId,
                parentId: null // Only top-level comments
            },
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
                replies: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: {
                            select: {
                                id: true,
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json(comments)
    } catch (error) {
        console.error('Error fetching comments:', error)
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

// POST /api/community/posts/[id]/comments - Add comment or reply
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
        const { content, parentId } = body

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const comment = await prisma.comment.create({
            data: {
                postId,
                authorId: dbUser.id,
                content: content.trim(),
                parentId: parentId || null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
            },
        })

        return NextResponse.json(comment, { status: 201 })
    } catch (error) {
        console.error('Error creating comment:', error)
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}

// DELETE /api/community/posts/[id]/comments - Delete comment
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

        const { searchParams } = new URL(request.url)
        const commentId = parseInt(searchParams.get('commentId') || '0')

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
        }

        // Check if user is the author
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        })

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        if (comment.authorId !== dbUser.id && dbUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.comment.delete({
            where: { id: commentId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting comment:', error)
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
}

// PATCH /api/community/posts/[id]/comments - Edit comment
export async function PATCH(
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

        const body = await request.json()
        const { commentId, content } = body

        if (!commentId || !content?.trim()) {
            return NextResponse.json({ error: 'Comment ID and content are required' }, { status: 400 })
        }

        // Check if user is the author
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        })

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        if (comment.authorId !== dbUser.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content: content.trim() },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
            },
        })

        return NextResponse.json(updatedComment)
    } catch (error) {
        console.error('Error updating comment:', error)
        return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }
}
