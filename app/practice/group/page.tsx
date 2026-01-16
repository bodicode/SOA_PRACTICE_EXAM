"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Users, Plus, LogIn, ArrowRight } from "lucide-react";

export default function GroupStudyLobby() {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const handleCreateRoom = async () => {
        setIsCreating(true);
        try {
            const res = await fetch("/api/practice/room/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "study" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create room");

            toast.success("Room created!");
            router.push(`/practice/room/${data.roomCode}`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomCode || roomCode.length < 6) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }
        setIsJoining(true);
        try {
            const res = await fetch("/api/practice/room/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to join room");

            toast.success("Joined room!");
            router.push(`/practice/room/${roomCode}`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 flex items-center justify-center">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">

                {/* Intro Section */}
                <div className="flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold text-[#003366] flex items-center gap-3">
                            <Users className="w-10 h-10" />
                            Group Study
                        </h1>
                        <p className="text-lg text-gray-600">
                            Ôn tập cùng bạn bè. Cùng nhau giải đề, thảo luận đáp án, và chinh phục kỳ thi SOA.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Học Nhóm Real-time</h3>
                                <p className="text-sm text-gray-500">Đồng bộ câu hỏi với mọi người trong phòng.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                                <ArrowRight className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Tiến Độ Chung</h3>
                                <p className="text-sm text-gray-500">Chủ phòng điều khiển tốc độ làm bài.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="flex flex-col gap-6">
                    {/* Create Room */}
                    <Card className="border-l-4 border-blue-600 shadow-md hover:shadow-xl transition-all cursor-pointer" onClick={handleCreateRoom}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-800">
                                <Plus className="w-5 h-5" /> Tạo Phòng Mới
                            </CardTitle>
                            <CardDescription>Bạn sẽ là chủ phòng và chọn đề thi.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={isCreating}
                            >
                                {isCreating ? "Đang tạo..." : "Tạo Phòng Ngay"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Join Room */}
                    <Card className="border-l-4 border-green-600 shadow-md hover:shadow-xl transition-all">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-800">
                                <LogIn className="w-5 h-5" /> Tham Gia Phòng
                            </CardTitle>
                            <CardDescription>Nhập mã số phòng từ bạn bè của bạn.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Nhập mã phòng (VD: 123456)"
                                    className="text-center text-lg tracking-widest uppercase font-bold text-gray-700"
                                    maxLength={6}
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-green-600 text-green-700 hover:bg-green-50"
                                onClick={handleJoinRoom}
                                disabled={isJoining}
                            >
                                {isJoining ? "Đang vào..." : "Vào Phòng"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
