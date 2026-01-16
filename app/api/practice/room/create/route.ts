
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

    // Get user from DB to ensure they exist and get their ID
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate unique Room Code (6 digits)
    let roomCode = "";
    let isUnique = false;
    while (!isUnique) {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await prisma.battleRoom.findUnique({
        where: { roomCode },
      });
      if (!existing) isUnique = true;
    }

    const { mode = "study" } = await req.json().catch(() => ({}));

    // Create Room
    const room = await prisma.battleRoom.create({
      data: {
        roomCode,
        hostUserId: dbUser.id,
        mode: mode, // 'study' or 'battle'
        status: "waiting",
      },
    });

    // Add Host as Participant
    await prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: dbUser.id,
      },
    });

    return NextResponse.json({ roomCode, roomId: room.id });
  } catch (error) {
    console.error("Create Room Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
