
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const badges = [
        {
            code: 'first_exam',
            name: 'First Step',
            description: 'Completed your first exam.',
            imageUrl: '🚀'
        },
        {
            code: 'streak_3',
            name: 'Warming Up',
            description: 'Maintained a 3-day study streak.',
            imageUrl: '🔥'
        },
        {
            code: 'streak_7',
            name: 'On Fire',
            description: 'Maintained a 7-day study streak.',
            imageUrl: '🔥🔥'
        },
        {
            code: 'streak_30',
            name: 'Unstoppable',
            description: 'Maintained a 30-day study streak.',
            imageUrl: '🏆'
        },
        {
            code: 'questions_100',
            name: 'Century Club',
            description: 'Answered 100 questions.',
            imageUrl: '💯'
        },
        {
            code: 'questions_500',
            name: 'Question Master',
            description: 'Answered 500 questions.',
            imageUrl: '📚'
        },
        {
            code: 'questions_1000',
            name: 'Grandmaster',
            description: 'Answered 1000 questions.',
            imageUrl: '👑'
        },
        {
            code: 'score_9',
            name: 'High Achiever',
            description: 'Achieved a score of 9.0 or higher in an exam.',
            imageUrl: '🌟'
        },
        {
            code: 'score_10',
            name: 'Perfectionist',
            description: 'Achieved a perfect 10.0 score in an exam.',
            imageUrl: '💎'
        }
    ]

    let createdCount = 0

    for (const badge of badges) {
        const existing = await prisma.badge.findUnique({
            where: { code: badge.code }
        })

        if (!existing) {
            await prisma.badge.create({
                data: badge
            })
            createdCount++
        }
    }

    return NextResponse.json({ message: `Seeded ${createdCount} badges.` })
}
