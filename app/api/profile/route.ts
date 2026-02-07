import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { examSessions: true }
                },

                studyStreak: true,
                avatarUrl: true,
                country: true,
                level: true,
                badges: {
                    include: {
                        badge: true
                    },
                    orderBy: { earnedAt: 'desc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { userId, fullName, avatarUrl, country } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (fullName) dataToUpdate.fullName = fullName;
        if (avatarUrl) dataToUpdate.avatarUrl = avatarUrl;
        if (country) dataToUpdate.country = country;
        // Level is updated automatically by system stats

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: dataToUpdate,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                avatarUrl: true,
                country: true,
                level: true,
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Failed to update profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
