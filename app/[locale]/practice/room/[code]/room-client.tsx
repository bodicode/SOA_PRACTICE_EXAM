"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

import { Buffer } from "buffer";
if (typeof window !== "undefined") {
    (window as any).global = window;
    (window as any).process = { env: {} };
    (window as any).Buffer = Buffer;
}
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-hot-toast";
import {
    Users, LogOut, CheckCircle, MessageSquare, Send, Video, VideoOff, Mic, MicOff,
    ChevronLeft, ChevronRight, Settings, ChevronDown, Clock, Flag,
    BookOpen, PlayCircle, Grid, AlertCircle, Menu, X
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/userStore";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const MathRender = dynamic(() => import("@/components/MathRender"), { ssr: false });

interface RoomClientProps {
    roomCode: string;
    roomId: number;
    initialMode: string;
    hostUserId: number;
    currentUser: any;
}

interface Member {
    userId: string;
    email: string;
    onlineAt: string;
}

export default function RoomClient({ roomCode, roomId, hostUserId, currentUser }: RoomClientProps) {
    const t = useTranslations("groupRoom");
    const router = useRouter();
    const supabase = createClient();
    const { user: storeUser } = useUserStore();

    // State
    // Video Call State
    const [isVideoJoined, setIsVideoJoined] = useState(false);
    const isVideoJoinedRef = useRef(false); // Ref for stale closures
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const myStreamRef = useRef<MediaStream | null>(null); // Ref for stale closures
    const [peers, setPeers] = useState<{ peerId: string; peer: any; stream?: MediaStream }[]>([]);
    const [peerStatuses, setPeerStatuses] = useState<Record<string, { mic: boolean; camera: boolean }>>({});
    const peersRef = useRef<{ peerId: string; peer: any; stream?: MediaStream }[]>([]);
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const [members, setMembers] = useState<Member[]>([]);
    // Question List State
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [flagged, setFlagged] = useState<Record<string, boolean>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    // Dialog State
    const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
    const [confirmDisbandOpen, setConfirmDisbandOpen] = useState(false);

    // Derived state
    const question = questions[currentQuestionIndex] || null;

    const [chatMessage, setChatMessage] = useState("");
    const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Font & UI Settings
    const [fontSize, setFontSize] = useState(16);
    const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('sans');
    const [showFontSettings, setShowFontSettings] = useState(false);

    // New State for Categories
    const [categories, setCategories] = useState<{ id: number; name: string; questionsCount: number }[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // Range State
    const [rangeMode, setRangeMode] = useState(false);
    const [rangeStart, setRangeStart] = useState<string | number>("");
    const [rangeEnd, setRangeEnd] = useState<string | number>("");
    const [questionLimit, setQuestionLimit] = useState<string | number>(10);
    const [timeLimit, setTimeLimit] = useState<number>(15);

    // Mobile Responsive State
    const [showLeftSidebar, setShowLeftSidebar] = useState(false);

    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [activeTab, setActiveTab] = useState("chat");

    const isHost = currentUser?.id === hostUserId;
    const channelRef = useRef<any>(null);

    const formatQuestionContent = (content: string) => {
        const trimmed = content.trim();
        return trimmed.replace(/^(\d+)\./, "$1\\.");
    };

    useEffect(() => {
        // Load state from localStorage on mount
        const savedState = localStorage.getItem(`room_state_${roomCode}`);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.questions && parsed.questions.length > 0) {
                    setQuestions(parsed.questions);
                    setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
                    setAnswers(parsed.answers || {});
                    setFlagged(parsed.flagged || {});
                    setIsSubmitted(parsed.isSubmitted || false);
                    toast.success(t('toast.restore'));
                }
            } catch (e) {
                console.error("Failed to restore state", e);
            }
        }

        // Fetch categories
        fetch("/api/categories")
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Failed to fetch categories", err));
    }, [roomCode]);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (questions.length > 0) {
            const stateToSave = {
                questions,
                currentQuestionIndex,
                answers,
                flagged,
                isSubmitted,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(`room_state_${roomCode}`, JSON.stringify(stateToSave));
        }
    }, [questions, currentQuestionIndex, answers, flagged, isSubmitted, roomCode]);

    useEffect(() => {
        if (!currentUser) return;

        // Join Channel
        const channel = supabase.channel(`room:${roomCode}`, {
            config: {
                presence: {
                    key: currentUser.email,
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const newState = channel.presenceState();
                const onlineUsers: Member[] = [];
                for (const key in newState) {
                    // @ts-ignore
                    onlineUsers.push({ email: key, onlineAt: new Date().toISOString() });
                }
                setMembers(onlineUsers);
            })
            .on("broadcast", { event: "start_practice" }, ({ payload }) => {
                console.log('Received start_practice', payload);
                if (payload.questions) {
                    setQuestions(payload.questions);
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                    setFlagged({});
                    setIsSubmitted(false);
                    toast.success(t('toast.newExam'));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            })
            .on("broadcast", { event: "navigate" }, ({ payload }) => {
                if (payload.index !== undefined) {
                    setCurrentQuestionIndex(payload.index);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            })
            .on("broadcast", { event: "answer" }, ({ payload }) => {
                if (payload.questionId && payload.optionIndex !== undefined) {
                    setAnswers(prev => ({ ...prev, [payload.questionId]: payload.optionIndex }));
                }
            })
            .on("broadcast", { event: "finish" }, () => {
                setIsSubmitted(true);
                toast.success(t('toast.submitted'));
                window.scrollTo({ top: 0, behavior: "smooth" });
            })
            .on("broadcast", { event: "destroy_room" }, () => {
                toast.error(t('toast.disbanded'));
                localStorage.removeItem(`room_state_${roomCode}`);
                router.push("/practice/group");
            })
            // Reset local status state for this user potentially?
            // Actually we just wait for their status update or assume default

            .on("broadcast", { event: "status_update" }, ({ payload }) => {
                setPeerStatuses(prev => ({
                    ...prev,
                    [payload.userId]: { mic: payload.mic, camera: payload.camera }
                }));
            })
            .on("broadcast", { event: "join_video" }, async ({ payload }) => {
                if (!isVideoJoinedRef.current || payload.userId === currentUser.id) return;

                // Broadcast my status to the new user (and everyone else, to be safe)
                if (channelRef.current) {
                    channelRef.current.send({
                        type: "broadcast",
                        event: "status_update",
                        payload: { userId: currentUser.id, mic: isMicOn, camera: isCameraOn }
                    });
                }

                const SimplePeer = (await import("simple-peer")).default;

                const rtcConfig = {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:global.stun.twilio.com:3478" }
                    ]
                };

                const peer = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    stream: myStreamRef.current || undefined,
                    config: rtcConfig
                });

                peer.on("signal", (signal: any) => {
                    channel.send({ type: "broadcast", event: "signal", payload: { signal, to: payload.userId, from: currentUser.id } });
                });

                peer.on("error", (err: any) => {
                    console.error("Peer connection error:", err);
                    toast.error(`${t('toast.videoError')}: ${err.code || err.message || "Unknown"}`);
                });

                peer.on("close", () => {
                    console.log("Peer connection closed");
                    // Optional: remove peer from state if needed, though leave_video should handle it
                });

                peer.on("stream", (stream: any) => {
                    const found = peersRef.current.find(p => p.peer === peer);
                    if (found) {
                        found.stream = stream;
                        setPeers([...peersRef.current]);
                    }
                });

                peersRef.current.push({ peerId: payload.userId, peer });
                setPeers([...peersRef.current]);
            })
            .on("broadcast", { event: "signal" }, async ({ payload }) => {
                if (payload.to === currentUser.id) {
                    const item = peersRef.current.find(p => p.peerId === payload.from);
                    if (item) {
                        item.peer.signal(payload.signal);
                    } else {
                        const SimplePeer = (await import("simple-peer")).default;

                        const rtcConfig = {
                            iceServers: [
                                { urls: "stun:stun.l.google.com:19302" },
                                { urls: "stun:global.stun.twilio.com:3478" }
                            ]
                        };

                        const peer = new SimplePeer({
                            initiator: false,
                            trickle: false,
                            stream: myStreamRef.current || undefined,
                            config: rtcConfig
                        });
                        peer.on("signal", (signal: any) => {
                            channel.send({ type: "broadcast", event: "signal", payload: { signal, to: payload.from, from: currentUser.id } });
                        });

                        peer.on("error", (err: any) => {
                            console.error("Peer connection error:", err);
                        });

                        peer.on("stream", (stream: any) => {
                            const found = peersRef.current.find(p => p.peer === peer);
                            if (found) {
                                found.stream = stream;
                                setPeers([...peersRef.current]);
                            }
                        });

                        peersRef.current.push({ peerId: payload.from, peer });
                        setPeers([...peersRef.current]);
                        peer.signal(payload.signal);
                    }
                }
            })
            .on("broadcast", { event: "leave_video" }, ({ payload }) => {
                const item = peersRef.current.find(p => p.peerId === payload.userId);
                if (item) { item.peer.destroy(); }
                peersRef.current = peersRef.current.filter(p => p.peerId !== payload.userId);
                setPeers([...peersRef.current]);
            })
            .on("broadcast", { event: "chat" }, ({ payload }) => {
                setMessages((prev) => [...prev, payload]);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({ online_at: new Date().toISOString(), user_id: currentUser.id });
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomCode, currentUser, supabase]);

    useEffect(() => {
        const wasJoined = localStorage.getItem(`video_joined_${roomCode}`);
        if (wasJoined === "true" && !isVideoJoinedRef.current) {
            joinVideo();
        }
    }, [roomCode]);

    const joinVideo = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(t('toast.browserError'));
            }

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setMyStream(stream);
            myStreamRef.current = stream; // Update Ref
            setIsVideoJoined(true);
            setIsMicOn(true); // Reset mic state
            setIsCameraOn(true); // Reset camera state
            isVideoJoinedRef.current = true; // Update Ref

            // Save intent
            localStorage.setItem(`video_joined_${roomCode}`, "true");

            if (channelRef.current) {
                channelRef.current.send({ type: "broadcast", event: "join_video", payload: { userId: currentUser.id } });
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.message || err.name || "Unknown Error";
            toast.error(`${t('toast.cameraError')}: ${msg}`);
            localStorage.removeItem(`video_joined_${roomCode}`); // Clear intent on failure
        }
    };

    const leaveVideo = () => {
        setIsVideoJoined(false);
        isVideoJoinedRef.current = false; // Update Ref
        myStream?.getTracks().forEach(track => track.stop());
        setMyStream(null);
        myStreamRef.current = null; // Update Ref
        setIsMicOn(true);
        setIsCameraOn(true);

        // Clear intent
        localStorage.removeItem(`video_joined_${roomCode}`);

        if (channelRef.current) {
            channelRef.current.send({ type: "broadcast", event: "leave_video", payload: { userId: currentUser.id } });
        }
        peersRef.current.forEach(p => p.peer.destroy());
        peersRef.current = [];
        setPeers([]);
    };

    const toggleMic = () => {
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            if (audioTrack) {
                const newState = !audioTrack.enabled;
                audioTrack.enabled = newState;
                setIsMicOn(newState);
                toast.success(newState ? t('toast.micOn') : t('toast.micOff'));

                // Broadcast Status
                if (channelRef.current) {
                    channelRef.current.send({
                        type: "broadcast",
                        event: "status_update",
                        payload: { userId: currentUser.id, mic: newState, camera: isCameraOn }
                    });
                }
            }
        }
    };

    const toggleCamera = () => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            if (videoTrack) {
                const newState = !videoTrack.enabled;
                videoTrack.enabled = newState;
                setIsCameraOn(newState);
                toast.success(newState ? t('toast.cameraOn') : t('toast.cameraOff'));

                // Broadcast Status
                if (channelRef.current) {
                    channelRef.current.send({
                        type: "broadcast",
                        event: "status_update",
                        payload: { userId: currentUser.id, mic: isMicOn, camera: newState }
                    });
                }
            }
        }
    };

    // Fix Local Video Attachment
    useEffect(() => {
        if (isVideoJoined && myStream && myVideoRef.current) {
            myVideoRef.current.srcObject = myStream;
        }
    }, [isVideoJoined, myStream]);

    const VideoComponent = ({ peer, stream }: { peer: any, stream?: MediaStream }) => {
        const ref = useRef<HTMLVideoElement>(null);

        useEffect(() => {
            if (stream && ref.current) {
                ref.current.srcObject = stream;
                ref.current.play().catch(e => console.error("Video play failed:", e));
            }
        }, [stream]);

        return <video playsInline autoPlay ref={ref} className="w-full h-full object-cover rounded-lg bg-gray-900" />;
    };

    // Host Actions
    const handleStartPractice = async () => {
        console.log("Starting practice...");
        setLoading(true);
        try {
            // Fetch questions list
            let url = `/api/questions?random=true&take=${questionLimit || 10}`;
            if (selectedCategoryId) {
                url += `&categoryId=${selectedCategoryId}`;
            }

            if (rangeMode) {
                if (rangeStart) url += `&start=${rangeStart}`;
                if (rangeEnd) url += `&end=${rangeEnd}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            // Handle new API response format { questions: [], total: ... }
            const questionsList = Array.isArray(data) ? data : (data.questions || []);

            if (Array.isArray(questionsList) && questionsList.length > 0) {
                const newQuestions = questionsList.map((q: any) => ({
                    ...q,
                    content: formatQuestionContent(q.content),
                    options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
                    id: q.id.toString()
                }));

                // Update Local State
                setQuestions(newQuestions);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setFlagged({});
                setIsSubmitted(false);

                // Broadcast to Room
                if (channelRef.current) {
                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'start_practice',
                        payload: { questions: newQuestions }
                    });
                }
            } else {
                toast.error(t('toast.noQuestions'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('toast.errorLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        // Trigger Dialog
        setConfirmSubmitOpen(true);
    };

    const confirmSubmit = () => {
        if (!isHost) return;
        if (channelRef.current) {
            channelRef.current.send({
                type: "broadcast",
                event: "finish"
            });
        }
        setIsSubmitted(true);
        setConfirmSubmitOpen(false);
    };

    // Disband Room
    const handleDisband = async () => {
        if (!isHost) return;
        if (channelRef.current) {
            await channelRef.current.send({
                type: "broadcast",
                event: "destroy_room",
                payload: {}
            });
        }
        // Host also leaves
        localStorage.removeItem(`room_state_${roomCode}`);
        router.push("/practice/group");
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correctOption) correct++;
        });
        return correct;
    };

    // Navigation Handlers
    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            const newIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(newIndex);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (isHost && channelRef.current) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "navigate",
                    payload: { index: newIndex }
                });
            }
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            const newIndex = currentQuestionIndex - 1;
            setCurrentQuestionIndex(newIndex);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (isHost && channelRef.current) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "navigate",
                    payload: { index: newIndex }
                });
            }
        }
    };

    const handleJumpTo = (index: number) => {
        setCurrentQuestionIndex(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (isHost && channelRef.current) {
            channelRef.current.send({
                type: "broadcast",
                event: "navigate",
                payload: { index: index }
            });
        }
    };

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        const payload = { user: currentUser.email?.split("@")[0] || "User", text: chatMessage };
        channelRef.current?.send({
            type: "broadcast",
            event: "chat",
            payload,
        });
        setMessages((prev) => [...prev, payload]);
        setChatMessage("");
    };

    return (
        <div className="flex flex-col min-h-screen bg-white light-force">
            {/* Header */}
            <header className="sticky top-0 h-16 bg-[#003366] text-white flex items-center justify-between px-4 shadow-md z-50 font-sans">
                <div className="font-bold text-lg flex items-center gap-2">
                    {/* Mobile Menu Toggle */}
                    <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/20 mr-2" onClick={() => setShowLeftSidebar(!showLeftSidebar)}>
                        <Menu className="w-6 h-6" />
                    </Button>

                    {isHost ? (
                        <Button variant="ghost" size="sm" className="text-red-300 hover:text-white hover:bg-red-600/50 gap-2 px-2" onClick={() => setConfirmDisbandOpen(true)}>
                            <X className="w-4 h-4" /> {t('header.disband')}
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2 px-2" onClick={() => {
                            localStorage.removeItem(`room_state_${roomCode}`);
                            router.push("/practice/group");
                        }}>
                            <ChevronLeft className="w-4 h-4" /> {t('header.leave')}
                        </Button>
                    )}
                    <span className="hidden md:inline">{t('header.room')} {roomCode}</span>
                </div>

                <div className="flex items-center gap-4 relative">
                    {/* Font Settings */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("text-white hover:bg-white/20 gap-2 px-3 border border-white/20", showFontSettings && "bg-white/20")}
                            onClick={() => setShowFontSettings(!showFontSettings)}
                            title={t('header.settings')}
                        >
                            <span className="font-serif text-lg font-bold">Aa</span>
                            <span className="hidden sm:inline font-sans text-sm font-normal">{t('header.size')}</span>
                            <ChevronDown className="w-3 h-3 opacity-70" />
                        </Button>

                        {showFontSettings && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-gray-800 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Size</div>
                                        <div className="flex items-center gap-2 bg-gray-100 rounded p-1">
                                            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setFontSize(Math.max(12, fontSize - 1))} disabled={fontSize <= 12}>A-</Button>
                                            <span className="text-sm font-medium w-8 text-center">{fontSize}</span>
                                            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setFontSize(Math.min(24, fontSize + 1))} disabled={fontSize >= 24}>A+</Button>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Font</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant={fontFamily === 'serif' ? 'secondary' : 'outline'} size="sm" onClick={() => setFontFamily('serif')}>Serif</Button>
                                            <Button variant={fontFamily === 'sans' ? 'secondary' : 'outline'} size="sm" onClick={() => setFontFamily('sans')}>Sans</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {showFontSettings && <div className="fixed inset-0 z-40" onClick={() => setShowFontSettings(false)} />}
                    </div>

                    <div className={cn("flex items-center gap-2 font-mono text-xl font-bold px-4 py-1 rounded bg-black/20")}>
                        <Users className="w-5 h-5" />
                        {members.length}
                    </div>

                    {/* Mobile Right Sidebar Toggle */}
                    <Button variant="ghost" size="icon" className="xl:hidden text-white hover:bg-white/20 ml-2" onClick={() => setShowRightSidebar(!showRightSidebar)}>
                        <MessageSquare className="w-6 h-6" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 items-start relative box-border overflow-hidden">
                {/* Mobile Backdrop (Left) */}
                {showLeftSidebar && (
                    <div className="fixed inset-0 bg-black/50 z-[60] lg:hidden" onClick={() => setShowLeftSidebar(false)} />
                )}

                {/* Sidebar: Question List or Members */}
                <aside className={cn(
                    "w-80 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex-col shadow-lg z-[70] lg:z-40 lg:flex transition-transform duration-300 ease-in-out",
                    "fixed left-0 top-16 lg:static",
                    showLeftSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}>
                    {questions.length > 0 ? (
                        /* Question List Grid */
                        <>
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0 font-sans">
                                <span className="font-bold text-gray-700 flex items-center gap-2">
                                    <Grid className="w-4 h-4" /> {t('sidebar.questions')}
                                </span>
                                <div className="text-xs text-gray-500">
                                    {Object.keys(answers).length}/{questions.length} {t('sidebar.done')}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 font-sans">
                                <div className="grid grid-cols-5 gap-2">
                                    {questions.map((q, idx) => (
                                        <button
                                            key={q.id}
                                            onClick={() => handleJumpTo(idx)}
                                            className={cn(
                                                "w-10 h-10 font-medium flex items-center justify-center transition-all relative border rounded-md text-sm",
                                                currentQuestionIndex === idx
                                                    ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50 text-blue-700 font-bold z-10"
                                                    : "border-gray-200 hover:bg-gray-50 text-gray-600",
                                                answers[q.id] !== undefined && currentQuestionIndex !== idx && !flagged[q.id] && "bg-blue-600 text-white border-blue-600",
                                                flagged[q.id] && "bg-yellow-400 border-yellow-500 text-yellow-900 font-bold"
                                            )}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-700 space-y-3 shrink-0 font-sans">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-blue-600 border border-blue-600 shadow-sm"></div>
                                    <span className="font-medium text-[12px]">{t('sidebar.answered')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-white border border-gray-300 shadow-sm"></div>
                                    <span className="font-medium text-[12px]">{t('sidebar.unanswered')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-blue-50 border border-blue-600 ring-1 ring-blue-100 shadow-sm"></div>
                                    <span className="font-medium text-[12px]">{t('sidebar.viewing')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-500 shadow-sm"></div>
                                    <span className="font-medium text-[12px]">{t('sidebar.flagged')}</span>
                                </div>
                            </div>

                            {/* Submit Button (Host Only) */}
                            {!isSubmitted && isHost && questions.length > 0 && (
                                <div className="p-4 border-t border-gray-100 bg-white space-y-3">
                                    <Button
                                        onClick={() => setConfirmSubmitOpen(true)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" /> {t('sidebar.submit')}
                                    </Button>

                                    <Button
                                        onClick={() => setConfirmDisbandOpen(true)}
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" /> {t('sidebar.disbandRoom')}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {t('sidebar.members')} ({members.length})
                                </h3>
                                <Badge variant="secondary" className="bg-green-100 text-green-700">{t('sidebar.online')}</Badge>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {members.map((member) => (
                                    <div key={member.email} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-blue-100">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`} />
                                            <AvatarFallback>{member.email[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {member.email.split('@')[0]}
                                                {member.email === currentUser?.email && <span className="text-gray-400 ml-1">{t('sidebar.you')}</span>}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </aside>

                {/* Main Content */}
                <main
                    className="flex-1 p-6 md:p-10 flex flex-col w-full h-[calc(100vh-4rem)] overflow-y-auto"
                    style={{
                        fontFamily: fontFamily === 'serif' ? '"Times New Roman", Times, serif' : 'ui-sans-serif, system-ui, sans-serif',
                        fontSize: `${fontSize}px`
                    }}
                >
                    {/* Score Board (if Submitted) */}
                    {isSubmitted && questions.length > 0 && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-in fade-in slide-in-from-top-4">
                            <h2 className="text-2xl font-bold text-green-800 mb-2">{t('results.title')}</h2>
                            <div className="text-4xl font-black text-green-600 mb-2">
                                {calculateScore()} / {questions.length}
                            </div>
                            <p className="text-green-700 font-medium">
                                {t('results.percentage')} {Math.round((calculateScore() / questions.length) * 100)}%
                            </p>
                        </div>
                    )}

                    {!question ? (
                        /* Setup UI */
                        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full font-sans">
                            {isHost ? (
                                <Card className="w-full border-t-4 border-t-green-500 shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="text-green-700 flex items-center gap-2">
                                            <Settings className="w-5 h-5" />
                                            {t('lobby.configTitle')}
                                        </CardTitle>
                                        <CardContent className="p-0 pt-2">
                                            <p className="text-sm text-gray-500">
                                                {t('lobby.configDesc')}
                                            </p>
                                        </CardContent>
                                    </CardHeader>
                                    <CardContent className="p-6 md:p-8 space-y-6">
                                        <div>
                                            <Label className="mb-3 block text-gray-700 font-semibold">{t('lobby.selectCategory')}</Label>
                                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-xl p-2 bg-gray-50/50">
                                                {categories.map((cat) => (
                                                    <div
                                                        key={cat.id}
                                                        onClick={() => setSelectedCategoryId(cat.id)}
                                                        className={cn(
                                                            "p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center",
                                                            selectedCategoryId === cat.id ? "border-green-600 bg-green-50 ring-1 ring-green-600 shadow-sm" : "border-transparent hover:bg-white hover:border-gray-200"
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className={cn("font-medium", selectedCategoryId === cat.id ? "text-green-800" : "text-gray-700")}>{cat.name}</span>
                                                            <span className="text-xs text-gray-400">{cat.questionsCount} {t('lobby.questionsSuffix')}</span>
                                                        </div>
                                                        {selectedCategoryId === cat.id && <CheckCircle className="w-5 h-5 text-green-600" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedCategoryId && (
                                            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-gray-700">{t('lobby.modeTitle')}</h3>
                                                    <Tabs defaultValue="random" onValueChange={(v) => setRangeMode(v === 'range')} className="w-full">
                                                        <TabsList className="w-full grid grid-cols-2">
                                                            <TabsTrigger value="random">{t('lobby.modeRandom')}</TabsTrigger>
                                                            <TabsTrigger value="range">{t('lobby.modeRange')}</TabsTrigger>
                                                        </TabsList>

                                                        <TabsContent value="random" className="hidden"></TabsContent>
                                                        <TabsContent value="range" className="hidden"></TabsContent>
                                                    </Tabs>
                                                </div>

                                                {rangeMode && (
                                                    <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-yellow-800">{t('lobby.from')}</Label>
                                                            <Input type="number" min={1} value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="bg-white" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-yellow-800">{t('lobby.to')}</Label>
                                                            <Input type="number" min={1} value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="bg-white" />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-xs text-yellow-800">
                                                                {t('lobby.rangeDesc')} {rangeStart || 1} {t('lobby.to')} {rangeEnd || "hết"}.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label>{t('lobby.countTitle')}</Label>
                                                        <div className="relative">
                                                            <BookOpen className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={questionLimit}
                                                                onChange={(e) => setQuestionLimit(e.target.value)}
                                                                className="pl-10"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500">Tối đa: {categories.find(c => c.id === selectedCategoryId)?.questionsCount || "..."} {t('lobby.maxSuffix')}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>{t('lobby.timeTitle')}</Label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={300}
                                                                value={timeLimit}
                                                                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                                                                className="pl-10"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500">{t('lobby.timeHint')}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800 border border-green-200">
                                                    💡 <strong>{t('lobby.tip')}</strong> {t('lobby.tipDesc')}
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleStartPractice}
                                            size="lg"
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-12"
                                            disabled={!selectedCategoryId || loading}
                                        >
                                            {loading ? t('lobby.preparing') : t('lobby.start')}
                                            <PlayCircle className="w-5 h-5 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="text-center font-sans">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                        <Clock className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('lobby.waitingTitle')}</h3>
                                    <p className="text-gray-500">{t('lobby.waitingDesc')}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Question UI - Exam Style */
                        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-start mb-6 border-b pb-4 border-gray-100 font-sans">
                                <div>
                                    <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">{t('exam.question')} {currentQuestionIndex + 1}</span>
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const qId = question.id;
                                            setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }));
                                        }}
                                        className={cn(
                                            "gap-2 h-8 text-xs font-sans",
                                            flagged[question.id] && "bg-yellow-100 border-yellow-400 text-yellow-700"
                                        )}
                                    >
                                        <Flag className={cn("w-3 h-3", flagged[question.id] && "fill-current")} />
                                        {flagged[question.id] ? t('exam.flagged') : t('exam.flag')}
                                    </Button>
                                </div>
                            </div>

                            <Card className="p-0 border-0 shadow-none flex flex-col mb-8 bg-transparent">
                                <div className="mb-4 leading-relaxed text-gray-900 text-lg">
                                    {(question as any).imageUrl && (
                                        <div className="mb-4 flex justify-center">
                                            <Image
                                                src={(question as any).imageUrl}
                                                alt={`Question Image`}
                                                width={600}
                                                height={400}
                                                className="rounded-lg border border-gray-200 object-contain max-h-[400px]"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <MathRender text={question.content || ""} />
                                </div>

                                <div className="space-y-3">
                                    {question.options.map((option: string, idx: number) => {
                                        const isSelected = answers[question.id] === idx;
                                        const isCorrect = question.correctOption === idx;
                                        let optionStyle = "border-gray-200 hover:bg-gray-50 hover:border-blue-300"; // Default

                                        if (isSubmitted) {
                                            if (isCorrect) optionStyle = "bg-green-100 border-green-500 ring-1 ring-green-500";
                                            else if (isSelected && !isCorrect) optionStyle = "bg-red-50 border-red-500 ring-1 ring-red-500";
                                            else if (isSelected) optionStyle = "bg-blue-50 border-blue-500 ring-1 ring-blue-500";
                                        } else {
                                            if (isSelected) optionStyle = "bg-blue-50 border-blue-500 ring-1 ring-blue-500";
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    if (isSubmitted) return;
                                                    const qId = question.id;
                                                    setAnswers(prev => ({ ...prev, [qId]: idx }));

                                                    if (channelRef.current) {
                                                        channelRef.current.send({
                                                            type: "broadcast",
                                                            event: "answer",
                                                            payload: { questionId: qId, optionIndex: idx }
                                                        });
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center p-3 rounded-lg border cursor-pointer transition-all group",
                                                    optionStyle,
                                                    isSubmitted ? "cursor-default" : "cursor-pointer"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border flex items-center justify-center mr-3 text-sm font-medium transition-colors",
                                                    isSubmitted && isCorrect ? "bg-green-600 border-green-600 text-white" :
                                                        isSubmitted && isSelected && !isCorrect ? "bg-red-500 border-red-500 text-white" :
                                                            isSelected ? "border-blue-600 bg-blue-600 text-white" :
                                                                "border-gray-400 text-gray-500 group-hover:border-blue-400"
                                                )}>
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <div className="flex-1 text-gray-800">
                                                    <MathRender text={option} />
                                                </div>
                                                {isSubmitted && isCorrect && <CheckCircle className="w-5 h-5 text-green-600 ml-2" />}
                                                {isSubmitted && isSelected && !isCorrect && <AlertCircle className="w-5 h-5 text-red-500 ml-2" />}
                                            </div>
                                        )
                                    })}
                                </div>
                            </Card>

                            {/* Explanation (if Submitted) */}
                            {isSubmitted && question.explanation && (
                                <div className="mt-8 p-6 bg-green-50 border border-green-100 rounded-xl animate-in fade-in slide-in-from-top-4">
                                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2 font-sans">
                                        <CheckCircle className="w-5 h-5" /> {t('exam.explanation')}
                                    </h4>
                                    <div className="text-green-900 leading-relaxed">
                                        <MathRender text={question.explanation} />
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={currentQuestionIndex === 0}
                                    className="gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" /> {t('exam.prev')}
                                </Button>

                                <Button
                                    onClick={handleNext}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className={cn(
                                        "gap-2",
                                        currentQuestionIndex === questions.length - 1 ? "bg-gray-400 cursor-not-allowed" : "bg-[#003366] hover:bg-[#002244]"
                                    )}
                                >
                                    {t('exam.next')} <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </main>

                {/* Mobile Backdrop (Right) */}
                {showRightSidebar && (
                    <div className="fixed inset-0 bg-black/50 z-[60] xl:hidden" onClick={() => setShowRightSidebar(false)} />
                )}

                {/* Right Sidebar: Chat & Video */}
                <aside className={cn(
                    "w-80 h-[calc(100vh-4rem)] bg-white border-l border-gray-200 flex flex-col shadow-lg z-[70] xl:z-40 xl:flex transition-transform duration-300 ease-in-out",
                    "fixed right-0 top-16 xl:static",
                    showRightSidebar ? "translate-x-0" : "translate-x-full xl:translate-x-0"
                )}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
                        <div className="p-2 border-b border-gray-100 bg-gray-50 shrink-0">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="chat" className="gap-2"><MessageSquare className="w-4 h-4" /> {t('tabs.chat')}</TabsTrigger>
                                <TabsTrigger value="video" className="gap-2"><Video className="w-4 h-4" /> {t('tabs.video')}</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Chat Content - Manual Visibility */}
                        <div className={cn("flex-1 flex flex-col p-0 m-0 overflow-hidden", activeTab !== "chat" && "hidden")}>
                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                                {messages.length === 0 && (
                                    <p className="text-center text-xs text-gray-400 mt-10">{t('chat.empty')}</p>
                                )}
                                {messages.map((msg, idx) => (
                                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm text-sm">
                                        <span className="font-bold text-blue-800 text-xs block mb-1">{msg.user}</span>
                                        <span className="text-gray-700 leading-relaxed block">{msg.text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Chat Input */}
                            <div className="p-3 bg-white border-t border-gray-100 relative">
                                <textarea
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                    placeholder={t('chat.placeholder')}
                                    className="w-full pl-3 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-10"
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleSendMessage}
                                    className="absolute right-4 top-4 h-8 w-8 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Video Content - Manual Visibility */}
                        <div className={cn("flex-1 flex flex-col p-4 m-0 overflow-hidden bg-gray-900", activeTab !== "video" && "hidden")}>
                            {!isVideoJoined ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-white space-y-4">
                                    <Video className="w-16 h-16 opacity-20" />
                                    <p className="text-gray-400 text-center text-sm">{t('video.desc')}</p>
                                    <Button onClick={joinVideo} className="bg-green-600 hover:bg-green-700 text-white font-bold w-full">
                                        <Video className="w-4 h-4 mr-2" /> {t('video.join')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col space-y-4 overflow-y-auto min-h-0">
                                    <div className="flex flex-col gap-2">
                                        {/* My Video */}

                                        <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden ring-2 ring-green-500 shadow-md group">
                                            <video ref={myVideoRef} autoPlay muted playsInline className={cn("w-full h-full object-cover transform scale-x-[-1]", !isCameraOn && "opacity-0")} />
                                            {!isCameraOn && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
                                                    <VideoOff className="w-12 h-12 opacity-50" />
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                                                <span className="text-xs font-bold text-white truncate max-w-[70%]">{t('video.you')}</span>
                                                <div className="flex items-center gap-1">
                                                    {isMicOn ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-500" />}
                                                    {isCameraOn ? <Video className="w-3 h-3 text-green-400" /> : <VideoOff className="w-3 h-3 text-red-500" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Peers */}
                                        {peers.map((p) => {
                                            const status = peerStatuses[p.peerId] || { mic: true, camera: true };
                                            return (
                                                <div key={p.peerId} className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-md group">
                                                    <div className={cn("absolute inset-0", !status.camera && "opacity-0 transition-opacity")}>
                                                        <VideoComponent peer={p.peer} stream={p.stream} />
                                                    </div>
                                                    {!status.camera && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500 z-10">
                                                            <VideoOff className="w-12 h-12 opacity-50" />
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-20">
                                                        <span className="text-xs font-bold text-white truncate max-w-[70%]">
                                                            {members.find(m => m.userId === p.peerId)?.email.split("@")[0] || "User"}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {status.mic ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-500" />}
                                                            {status.camera ? <Video className="w-3 h-3 text-green-400" /> : <VideoOff className="w-3 h-3 text-red-500" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-auto pt-4 flex gap-4 justify-center">
                                        <Button
                                            onClick={toggleMic}
                                            variant={isMicOn ? "secondary" : "destructive"}
                                            className="h-12 w-12 rounded-full p-0"
                                            title={isMicOn ? t('video.micOff') : t('video.micOn')}
                                        >
                                            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                        </Button>
                                        <Button
                                            onClick={toggleCamera}
                                            variant={isCameraOn ? "secondary" : "destructive"}
                                            className="h-12 w-12 rounded-full p-0"
                                            title={isCameraOn ? t('video.camOff') : t('video.camOn')}
                                        >
                                            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                        </Button>
                                        <Button
                                            onClick={leaveVideo}
                                            variant={isCameraOn ? "destructive" : "destructive"}
                                            className="h-12 w-12 rounded-full p-0 bg-red-600 hover:bg-red-700"
                                            title={t('video.leave')}
                                        >
                                            <LogOut className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Tabs>
                </aside>
            </div >

            {/* Submit Confirmation Dialog */}
            <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialog.submitTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('dialog.submitDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)}>{t('dialog.cancel')}</Button>
                        <Button onClick={confirmSubmit} className="bg-blue-600 text-white hover:bg-blue-700">{t('dialog.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Disband Confirmation Dialog */}
            <Dialog open={confirmDisbandOpen} onOpenChange={setConfirmDisbandOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">{t('dialog.disbandTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('dialog.disbandDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDisbandOpen(false)}>{t('dialog.cancel')}</Button>
                        <Button onClick={handleDisband} className="bg-red-600 text-white hover:bg-red-700">{t('dialog.disbandConfirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    );
}