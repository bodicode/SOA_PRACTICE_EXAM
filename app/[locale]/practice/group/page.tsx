"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Users, Plus, LogIn, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export default function GroupStudyLobby() {
    const t = useTranslations("groupLobby");
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
            if (!res.ok) throw new Error(data.error || t('create.error'));

            toast.success(t('create.success'));
            router.push(`/practice/room/${data.roomCode}`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomCode || roomCode.length < 6) {
            toast.error(t('join.invalidCode'));
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
            if (!res.ok) throw new Error(data.error || t('join.error'));

            toast.success(t('join.success'));
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
                            {t('title')}
                        </h1>
                        <p className="text-lg text-gray-600">
                            {t('subtitle')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{t('features.realtimeTitle')}</h3>
                                <p className="text-sm text-gray-500">{t('features.realtimeDesc')}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                                <ArrowRight className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{t('features.progressTitle')}</h3>
                                <p className="text-sm text-gray-500">{t('features.progressDesc')}</p>
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
                                <Plus className="w-5 h-5" /> {t('create.title')}
                            </CardTitle>
                            <CardDescription>{t('create.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={isCreating}
                            >
                                {isCreating ? t('create.loading') : t('create.button')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Join Room */}
                    <Card className="border-l-4 border-green-600 shadow-md hover:shadow-xl transition-all">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-800">
                                <LogIn className="w-5 h-5" /> {t('join.title')}
                            </CardTitle>
                            <CardDescription>{t('join.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder={t('join.placeholder')}
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
                                {isJoining ? t('join.loading') : t('join.button')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
