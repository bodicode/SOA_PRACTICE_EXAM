
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const sessions = await prisma.examSession.findMany({
            orderBy: { startTime: 'desc' },
            take: 50
        });

        const anomalies = sessions.map(s => {
            const score = Number(s.totalScore || 0);
            const count = s.questionCount || 0;
            const scale10 = count > 0 ? (score / count) * 10 : 0;
            return {
                id: s.id,
                userId: s.userId,
                categoryId: s.categoryId,
                rawScore: score,
                totalQuestions: count,
                calculatedScale10: scale10.toFixed(2),
                isAnomaly: scale10 > 10
            };
        });

        return NextResponse.json({ count: sessions.length, data: anomalies });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
