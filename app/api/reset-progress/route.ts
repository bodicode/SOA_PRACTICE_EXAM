
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Get all exam sessions for this user, ordered by date
        const sessions = await prisma.examSession.findMany({
            where: { userId: Number(userId) },
            orderBy: { startTime: 'desc' }
        });

        if (sessions.length <= 1) {
            return NextResponse.json({ message: 'No cleanup needed (only 1 or 0 sessions).' });
        }

        // 2. Keep the LATEST session (index 0), delete the rest
        const latestSessionId = sessions[0].id;
        const sessionsToDelete = sessions.slice(1).map(s => s.id);

        console.log(`Keeping session ${latestSessionId}, deleting ${sessionsToDelete.length} old sessions for user ${userId}`);

        // 3. Delete old sessions (Cascade delete will remove ExamDetail)
        await prisma.examSession.deleteMany({
            where: {
                id: { in: sessionsToDelete }
            }
        });

        // 4. Recalculate Stats from the remaining session(s)
        const [avgStats, answeredCount] = await Promise.all([
            prisma.examSession.aggregate({
                where: { userId: Number(userId), mode: { in: ['mock', 'exam'] } },
                _avg: { totalScore: true }
            }),
            prisma.examDetail.count({
                where: {
                    session: { userId: Number(userId) },
                    userChoice: { not: null }
                }
            })
        ]);

        // 5. Update User
        await prisma.user.update({
            where: { id: Number(userId) },
            data: {
                averageScore: Number(avgStats._avg.totalScore || 0),
                questionsAnswered: answeredCount,
                // We keep streak intact or reset? Let's keep streak as is, or recalculate is safer but complex.
                // Generally cleaning up old data shouldn't hurt streak if streak is just based on `lastStudyDate`.
                // But `lastStudyDate` might be from an old session? 
                // Let's ensure lastStudyDate is from the LATEST session.
                lastStudyDate: sessions[0].startTime
            }
        });

        return NextResponse.json({ success: true, deletedCount: sessionsToDelete.length });
    } catch (error: any) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
