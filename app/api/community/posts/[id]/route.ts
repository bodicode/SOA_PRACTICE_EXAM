import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/community/posts/[id] - Delete a post
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

        const post = await prisma.post.findUnique({
            where: { id: postId },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        // Only author can delete
        if (post.authorId !== dbUser.id && dbUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.post.delete({
            where: { id: postId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting post:', error)
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }
}

// PATCH /api/community/posts/[id] - Edit a post
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

        const { id } = await params
        const postId = parseInt(id)
        const body = await request.json()
        const { content } = body

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        // Only author can edit
        if (post.authorId !== dbUser.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { content: content.trim() },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
                reactions: {
                    select: {
                        id: true,
                        type: true,
                        userId: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        })

        return NextResponse.json(updatedPost)
    } catch (error) {
        console.error('Error updating post:', error)
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }
}
