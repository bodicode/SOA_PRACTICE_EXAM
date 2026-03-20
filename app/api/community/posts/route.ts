import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET /api/community/posts - List posts with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        // Get current user for reaction matching
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        let currentDbUserId: number | null = null

        if (user?.email) {
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email },
                select: { id: true }
            })
            currentDbUserId = dbUser?.id || null
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
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
            }),
            prisma.post.count(),
        ])

        // Add current user's reaction to each post
        const postsWithUserReaction = posts.map(post => ({
            ...post,
            currentUserReaction: currentDbUserId
                ? post.reactions.find(r => r.userId === currentDbUserId)?.type || null
                : null
        }))

        return NextResponse.json({
            posts: postsWithUserReaction,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching posts:', error)
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }
}

// POST /api/community/posts - Create a new post
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user from database
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
        })

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const body = await request.json()
        const { content, imageUrl } = body

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const post = await prisma.post.create({
            data: {
                authorId: dbUser.id,
                content: content.trim(),
                imageUrl: imageUrl || null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
                reactions: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        })

        return NextResponse.json(post, { status: 201 })
    } catch (error) {
        console.error('Error creating post:', error)
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }
}
