
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { roomCode } = await req.json();

        if (!roomCode) {
            return NextResponse.json({ error: "Room code required" }, { status: 400 });
        }

        // Find Room
        const room = await prisma.battleRoom.findUnique({
            where: { roomCode },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User record not found" }, { status: 404 });
        }

        // Check if already joined
        const existingParticipant = await prisma.roomParticipant.findFirst({
            where: {
                roomId: room.id,
                userId: dbUser.id,
            },
        });

        if (!existingParticipant) {
            // Add as participant
            await prisma.roomParticipant.create({
                data: {
                    roomId: room.id,
                    userId: dbUser.id,
                },
            });
        }

        return NextResponse.json({ success: true, roomId: room.id, mode: room.mode });
    } catch (error) {
        console.error("Join Room Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
