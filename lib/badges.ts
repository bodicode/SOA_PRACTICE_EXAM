import { prisma } from '@/lib/prisma'

export async function checkAndAwardBadges(userId: number, currentExamScore?: number) {
    // 1. Fetch User Data with current badges
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            badges: {
                include: { badge: true }
            }
        }
    })

    if (!user) return

    const earnedBadgeCodes = new Set(user.badges.map(ub => ub.badge.code))
    const badgesToAward: string[] = []

    // 2. Define Criteria & Checks
    // Helper to request award
    const award = (code: string) => {
        if (!earnedBadgeCodes.has(code)) {
            badgesToAward.push(code)
            earnedBadgeCodes.add(code) // Prevent double add in same run
        }
    }

    // --- CRITERIA ---

    // A. First Exam
    if (user.questionsAnswered > 0) {
        award('first_exam')
    }

    // B. Question Milestones
    if (user.questionsAnswered >= 100) award('questions_100')
    if (user.questionsAnswered >= 500) award('questions_500')
    if (user.questionsAnswered >= 1000) award('questions_1000')

    // C. Streak Milestones
    if (user.studyStreak >= 3) award('streak_3')
    if (user.studyStreak >= 7) award('streak_7')
    if (user.studyStreak >= 30) award('streak_30')

    // D. Score Achievements (Only if currentExamScore is provided)
    if (currentExamScore !== undefined) {
        // Score is usually on 10 scale if passed from leaderboard/exam logic, or absolute?
        // Let's assume input is normalized 0-10 scale.
        if (currentExamScore >= 9.0) award('score_9')
        if (currentExamScore >= 10.0) award('score_10')
    }

    // 3. Database Updates
    if (badgesToAward.length > 0) {
        // Find badge IDs
        const badges = await prisma.badge.findMany({
            where: { code: { in: badgesToAward } }
        })

        // Create UserBadge records
        for (const badge of badges) {
            await prisma.userBadge.create({
                data: {
                    userId: user.id,
                    badgeId: badge.id
                }
            })
        }
        console.log(`Awarded ${badges.length} badges to User ${userId}:`, badgesToAward)
    }
}
