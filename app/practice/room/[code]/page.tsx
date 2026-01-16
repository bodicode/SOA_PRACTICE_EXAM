
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RoomClient from "./room-client";

interface PageProps {
    params: Promise<{ code: string }>;
}

export default async function RoomPage({ params }: PageProps) {
    const { code } = await params;
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
                <h1 className="text-2xl font-bold text-red-600">Không Tìm Thấy Phòng</h1>
                <p className="text-gray-600">Mã phòng {code} không hợp lệ hoặc đã hết hạn.</p>
                <a href="/practice/group" className="text-blue-600 hover:underline">Quay lại Sảnh chờ</a>
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
