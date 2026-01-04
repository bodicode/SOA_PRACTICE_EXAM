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
            }
        });

        // 2. Create Details
        // ... (rest same)

        // 3. Update User Stats (Only if valid user)
        if (userId > 0) {
            await prisma.$transaction(async (tx: any) => {
                // ... existing logic ...
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
