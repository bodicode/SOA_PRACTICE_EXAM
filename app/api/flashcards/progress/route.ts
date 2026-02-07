import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/flashcards/progress - Update user's flashcard progress
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, cardId, correct } = body

        if (!userId || !cardId || correct === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, cardId, correct' },
                { status: 400 }
            )
        }

        // Find existing progress or create new
        const existing = await prisma.userFlashcardProgress.findUnique({
            where: {
                userId_cardId: {
                    userId: parseInt(userId),
                    cardId: parseInt(cardId)
                }
            }
        })

        let newStatus = 'learning'
        let correctCount = existing?.correctCount || 0
        let wrongCount = existing?.wrongCount || 0

        if (correct) {
            correctCount++
            // After 3 correct answers, mark as mastered
            if (correctCount >= 3) {
                newStatus = 'mastered'
            }
        } else {
            wrongCount++
            // If wrong, move back to learning
            newStatus = 'learning'
        }

        // Calculate next review time (simple spaced repetition)
        const now = new Date()
        let nextReview = new Date()
        if (newStatus === 'mastered') {
            nextReview.setDate(now.getDate() + 7) // Review after 7 days
        } else if (correctCount >= 2) {
            nextReview.setDate(now.getDate() + 3) // Review after 3 days
        } else if (correctCount >= 1) {
            nextReview.setDate(now.getDate() + 1) // Review tomorrow
        } else {
            nextReview.setHours(now.getHours() + 4) // Review in 4 hours
        }

        const progress = await prisma.userFlashcardProgress.upsert({
            where: {
                userId_cardId: {
                    userId: parseInt(userId),
                    cardId: parseInt(cardId)
                }
            },
            update: {
                status: newStatus,
                correctCount,
                wrongCount,
                lastReviewed: now,
                nextReview
            },
            create: {
                userId: parseInt(userId),
                cardId: parseInt(cardId),
                status: newStatus,
                correctCount,
                wrongCount,
                lastReviewed: now,
                nextReview
            }
        })

        return NextResponse.json({
            success: true,
            progress,
            message: correct ? 'Correct! Keep it up!' : 'Keep practicing!'
        })
    } catch (error) {
        console.error('Error updating flashcard progress:', error)
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 }
        )
    }
}
