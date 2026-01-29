import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const categoryId = searchParams.get('categoryId'); // Optional
    const sort = searchParams.get('sort') || 'time_desc'; // Default sort

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    try {
        const whereCondition: any = {
            userId: userId,
            mode: { in: ['mock', 'exam', 'practice'] },
        };

        if (categoryId && categoryId !== 'all') {
            whereCondition.categoryId = parseInt(categoryId);
        }

        // Count total first (common for both paths)
        const total = await prisma.examSession.count({
            where: whereCondition
        });

        let history: any[] = [];

        if (sort.startsWith('score')) {
            // Use Raw SQL for calculated score sorting
            // Calculate percentage: (totalScore / questionCount)
            // Handle division by zero by checking questionCount > 0

            const direction = sort === 'score_high' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
            const nulls = sort === 'score_high' ? Prisma.sql`NULLS LAST` : Prisma.sql`NULLS FIRST`; // Push null/zero scores to appropriate end

            const categoryFilter = (categoryId && categoryId !== 'all')
                ? Prisma.sql`AND "categoryId" = ${parseInt(categoryId)}`
                : Prisma.sql``;

            history = await prisma.$queryRaw`
                SELECT id, mode, "startTime", "totalScore", "questionCount", "categoryId"
                FROM "ExamSession"
                WHERE "userId" = ${userId}
                AND "mode" IN ('mock', 'exam', 'practice')
                ${categoryFilter}
                ORDER BY 
                    CASE 
                        WHEN "questionCount" > 0 AND "totalScore" IS NOT NULL 
                        THEN CAST("totalScore" AS DOUBLE PRECISION) / "questionCount" 
                        ELSE 0 
                    END ${direction} ${nulls},
                    "startTime" DESC
                OFFSET ${skip}
                LIMIT ${limit}
            `;

            // Map Decimal/BigInt if necessary (Raw query returns mostly JS primitives for standard types, but Decimal might be object)
            // But Prisma usually handles Decimal -> Decimal object. 
            // We just return it, JSON.stringify handles it? No, client might need number.
            // But findMany returns Decimal objects too.
        } else {
            // Use standard findMany for time sorting
            let orderBy: any = { startTime: 'desc' };
            if (sort === 'time_asc') {
                orderBy = { startTime: 'asc' };
            }

            history = await prisma.examSession.findMany({
                where: whereCondition,
                orderBy: orderBy,
                skip: skip,
                take: limit,
                select: {
                    id: true,
                    mode: true,
                    startTime: true,
                    totalScore: true,
                    questionCount: true,
                    categoryId: true
                }
            });
        }


        return NextResponse.json({
            data: history,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
