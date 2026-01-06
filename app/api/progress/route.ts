import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('userId') || '0');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                totalExams: true,

                studyStreak: true,
                lastStudyDate: true
            }
        });

        const recentSessions = await prisma.examSession.findMany({
            where: { userId: userId },
            orderBy: { startTime: 'desc' },
            take: 10,
            select: {
                id: true,
                mode: true,
                startTime: true,
                totalScore: true,
                questionCount: true,
            }
        });

        return NextResponse.json({ stats: user, history: recentSessions });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}
