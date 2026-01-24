
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import RoomClient from "./room-client";
import { getTranslations } from "next-intl/server";

interface PageProps {
    params: Promise<{ code: string; locale: string }>;
}

export default async function RoomPage({ params }: PageProps) {
    const { code, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'groupRoom' });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/practice/room/${code}`);
    }

    // Fetch Room Info directly from DB
    const room = await prisma.battleRoom.findUnique({
        where: { roomCode: code },
        include: {
            host: { select: { fullName: true, email: true } }
        }
    });

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-red-600">{t('notFound.title')}</h1>
                <p className="text-gray-600">{t('notFound.desc')}</p>
                <Link href="/practice/group" className="text-blue-600 hover:underline">{t('notFound.back')}</Link>
            </div>
        );
    }

    // Get current user DB ID
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { id: true, email: true, fullName: true, avatarUrl: true }
    });

    if (!dbUser) {
        redirect('/login');
    }

    return (
        <RoomClient
            roomCode={code}
            roomId={room.id}
            initialMode={room.mode}
            hostUserId={room.hostUserId}
            currentUser={dbUser}
        />
    );
}
