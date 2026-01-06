import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, mode, score, totalQuestions, startTime, endTime, details } = body;

        // 1. Validate User ID
        if (!userId || userId === 0) {
            console.warn("Exam session submitted without valid userId (0 or null). Skipping user stats update.");
            // We can still save the session with userId=1 (Guest) or fail? 
            // If we require login, we should fail.
            // Let's check if User 1 exists? Or just fail for now to enforce login.
            // return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

            // Allow generic saving if strictly needed, but better to enforce valid user.
        }

        // 1. Create Exam Session
        const session = await prisma.examSession.create({
            data: {
                userId: userId, // This will fail if userId doesn't exist in User table
                mode: mode,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : new Date(),
                totalScore: score,
                questionCount: totalQuestions || 0,
            }
        });

        // 2. Create Details
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

        // 3. Update User Stats (Only if valid user)
        if (userId > 0) {
            await prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { lastStudyDate: true, studyStreak: true } // Select minimal fields
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
                        // If diffDays === 0 (same day), keep streak same
                    } else {
                        newStreak = 1; // First time
                    }

                    await tx.user.update({
                        where: { id: userId },
                        data: {
                            totalExams: { increment: 1 },
                            totalScore: { increment: score }, // Accumulate score
                            studyStreak: newStreak,
                            lastStudyDate: new Date()
                        }
                    });
                }
            });
        }

        return NextResponse.json({ success: true, sessionId: session.id });
    } catch (error: any) {
        console.error('Error saving exam session:', error);
        // Better error message
        let msg = 'Failed to save session';
        if (error.code === 'P2003') { // Foreign key constraint failed
            msg = 'User ID not found in database.';
        }
        return NextResponse.json({ error: msg, details: error.message }, { status: 500 });
    }
}
