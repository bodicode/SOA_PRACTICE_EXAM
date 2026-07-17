import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateUserStats } from '@/lib/leaderboard';
import { checkAndAwardBadges } from '@/lib/badges';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        // 1. Authenticate user via Supabase session (server-side, trustworthy)
        const supabase = await createClient();
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !supabaseUser) {
            return NextResponse.json({ error: 'Unauthorized. Please log in to save your results.' }, { status: 401 });
        }

        // 2. Lookup the DB user record by email (source of truth for integer userId)
        const dbUser = await prisma.user.findUnique({
            where: { email: supabaseUser.email! },
            select: { id: true }
        });

        let userId: number;
        if (!dbUser) {
            // User is authenticated in Supabase but not yet synced to DB
            // Auto-sync them now
            const newUser = await prisma.user.create({
                data: {
                    email: supabaseUser.email!,
                    fullName: supabaseUser.user_metadata?.full_name || null,
                    role: 'STUDENT',
                    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
                }
            });
            userId = newUser.id;
        } else {
            userId = dbUser.id;
        }

        const body = await req.json();
        const { mode, score, totalQuestions, startTime, endTime, details, categoryId } = body;

        // 3. Create Exam Session
        const session = await prisma.examSession.create({
            data: {
                userId: userId,
                mode: mode,
                categoryId: categoryId ? Number(categoryId) : null,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : new Date(),
                totalScore: score,
                questionCount: totalQuestions || 0,
            }
        });

        // 4. Create Details
        const detailsData = details.map((d: any) => ({
            sessionId: session.id,
            questionId: d.questionId, // Might be undefined if PDF question
            pdfRegionQuestionId: d.pdfRegionQuestionId, // Might be undefined if normal question
            userChoice: d.userChoice,
            isCorrect: d.isCorrect,
            timeSpentSeconds: 0 // We don't track per-question time yet
        }));

        if (detailsData.length > 0) {
            await prisma.examDetail.createMany({
                data: detailsData
            });
        }

        // 5. Update User Stats (streak)
        await prisma.$transaction(async (tx: any) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { lastStudyDate: true, studyStreak: true }
            });

            if (user) {
                let newStreak = user.studyStreak;
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (user.lastStudyDate) {
                    const lastDate = new Date(user.lastStudyDate);
                    lastDate.setHours(0, 0, 0, 0);

                    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        newStreak += 1; // Consecutive day
                    } else if (diffDays > 1) {
                        newStreak = 1; // Broken streak
                    }
                } else {
                    newStreak = 1; // First time
                }

                await tx.user.update({
                    where: { id: userId },
                    data: {
                        studyStreak: newStreak,
                        lastStudyDate: new Date()
                    }
                });
            }
        });

        // 6. Update Leaderboard Stats (Score, Questions, Level)
        await updateUserStats(userId);

        // 7. Check & Award Badges
        let normalizedScore = 0;
        if (totalQuestions > 0) {
            normalizedScore = (Number(score) / totalQuestions) * 10;
        }
        await checkAndAwardBadges(userId, normalizedScore);

        return NextResponse.json({ success: true, sessionId: session.id });
    } catch (error: any) {
        console.error('Error saving exam session:', error);
        let msg = 'Failed to save session';
        if (error.code === 'P2003') {
            msg = 'User ID not found in database.';
        }
        return NextResponse.json({ error: msg, details: error.message }, { status: 500 });
    }
}
