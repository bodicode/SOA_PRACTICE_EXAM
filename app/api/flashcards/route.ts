import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/flashcards - Get all flashcards with optional user progress
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')
        const category = searchParams.get('category')

        const where: any = {}
        if (category && category !== 'all') {
            where.category = category
        }

        const flashcards = await prisma.formulaCard.findMany({
            where,
            orderBy: [
                { category: 'asc' },
                { difficulty: 'asc' },
                { name: 'asc' }
            ],
            include: userId ? {
                progress: {
                    where: { userId: parseInt(userId) }
                }
            } : undefined
        })

        // Transform data to include user progress inline
        const result = flashcards.map((card: any) => ({
            ...card,
            userProgress: userId && card.progress?.[0] ? card.progress[0] : null,
            progress: undefined // Remove the raw progress array
        }))

        // Get categories for filter
        const categories = await prisma.formulaCard.findMany({
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' }
        })

        // Get stats if userId provided
        let stats = null
        if (userId) {
            const progressCounts = await prisma.userFlashcardProgress.groupBy({
                by: ['status'],
                where: { userId: parseInt(userId) },
                _count: true
            })

            const total = flashcards.length
            const mastered = progressCounts.find((p: any) => p.status === 'mastered')?._count || 0
            const learning = progressCounts.find((p: any) => p.status === 'learning')?._count || 0
            const newCards = total - mastered - learning

            stats = { total, mastered, learning, new: newCards }
        }

        return NextResponse.json({
            cards: result,
            categories: categories.map((c: any) => c.category),
            stats
        })
    } catch (error) {
        console.error('Error fetching flashcards:', error)
        return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 })
    }
}
