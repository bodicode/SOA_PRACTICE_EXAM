import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

export interface LeaderboardEntry {
    userId: number
    fullName: string | null
    avatarUrl: string | null
    country: string | null
    level: string | null
    averageScore: number
    totalQuestions: number
    rank?: number
}

// Fetch global leaderboard
export const getGlobalLeaderboard = unstable_cache(
    async (limit = 20, country?: string) => {
        const where: any = {}
        if (country && country !== 'ALL') {
            where.country = country
        }

        const users = await prisma.user.findMany({
            where: {
                ...where,
                questionsAnswered: { gt: 0 } // Only active users
            },
            select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                country: true,
                level: true,
                averageScore: true,
                questionsAnswered: true
            },
            orderBy: {
                averageScore: 'desc'
            },
            take: limit
        })

        return users.map((u, index) => ({
            userId: u.id,
            fullName: u.fullName,
            avatarUrl: u.avatarUrl,
            country: u.country,
            level: u.level,
            averageScore: u.averageScore,
            totalQuestions: u.questionsAnswered,
            rank: index + 1
        }))
    },
    ['global-leaderboard'],
    { revalidate: 300, tags: ['leaderboard'] } // Cache 5 mins
)

// Update User Stats (Call this after exam submission)
export async function updateUserStats(userId: number) {
    // 1. Recalculate average score based on sessions
    const sessions = await prisma.examSession.findMany({
        where: { userId, mode: 'exam', totalScore: { not: null } }
    })

    let newAvg = 0
    if (sessions.length > 0) {
        let sumNormalized = 0
        let count = 0
        sessions.forEach(s => {
            if (s.questionCount && s.questionCount > 0) {
                const score = Number(s.totalScore)
                // Normalize to 10 scale
                const normalized = (score / s.questionCount) * 10
                sumNormalized += normalized
                count++
            }
        })
        newAvg = count > 0 ? sumNormalized / count : 0
    }

    // 2. Count UNIQUE questions answered
    // We need to look at ExamDetails to find unique question IDs
    const distinctQuestions = await prisma.examDetail.findMany({
        where: {
            session: {
                userId: userId,
                // mode: 'exam' // Should we count practice too? User said "làm ở lần 2 câu 100 đó lại xuất hiện". 
                // Usually leaderboard counts 'exam' mode only? 
                // Or maybe all 'practice' and 'exam'? 
                // Schema has `mode` in ExamSession.
                // Let's assume we want to count distinct questions across ALL VALID sessions (where totalScore is not null, imply finished).
                // Or just all details?
                // Let's stick to sessions that are finished.
                totalScore: { not: null }
            }
        },
        select: {
            questionId: true,
            pdfRegionQuestionId: true
        },
        distinct: ['questionId', 'pdfRegionQuestionId'] // Prisma distinct
    })

    // Prisma distinct might return combinations. Use Set to be sure if Prisma strict distinct doesn't handle mix of nulls well.
    // Actually, distinct array in Prisma works on the combination.
    // We want unique (questionId) AND unique (pdfRegionQuestionId).
    // But a row has either questionId OR pdfRegionQuestionId (or both? unlikely).
    // Let's fetch all and count in JS to be safe and accurate.

    const allDetails = await prisma.examDetail.findMany({
        where: {
            session: {
                userId: userId,
                totalScore: { not: null }
            }
        },
        select: {
            questionId: true,
            pdfRegionQuestionId: true
        }
    })

    const uniqueIds = new Set<string>()
    allDetails.forEach(d => {
        if (d.questionId) uniqueIds.add(`q-${d.questionId}`)
        if (d.pdfRegionQuestionId) uniqueIds.add(`pdf-${d.pdfRegionQuestionId}`)
    })

    const totalQuestions = uniqueIds.size

    let newLevel = 'Beginner'
    if (totalQuestions > 500 && newAvg >= 8.5) newLevel = 'Expert'
    else if (totalQuestions > 200 && newAvg >= 7.0) newLevel = 'Advanced'
    else if (totalQuestions > 50 && newAvg >= 5.0) newLevel = 'Intermediate'

    await prisma.user.update({
        where: { id: userId },
        data: {
            averageScore: newAvg,
            questionsAnswered: totalQuestions,
            level: newLevel
        }
    })
}
