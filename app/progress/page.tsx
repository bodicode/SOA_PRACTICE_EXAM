'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Target, Calendar, TrendingUp, Clock, History, ArrowLeft, Filter, Map, Zap } from 'lucide-react'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import ProgressChart from '@/components/ProgressChart'

interface UserStats {
    totalExams: number
    studyStreak: number
    lastStudyDate: string | null
}

interface ExamSession {
    id: number
    mode: string
    startTime: string
    totalScore: number
    questionCount?: number
}

export default function ProgressPage() {
    const { user } = useUserStore()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [history, setHistory] = useState<ExamSession[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("all")

    const filteredHistory = useMemo(() => {
        if (activeTab === "all") return history;
        return history.filter(session => session.mode === activeTab);
    }, [history, activeTab]);

    const chartData = useMemo(() => {
        // Reverse history to show oldest to newest
        // Only include sessions with valid questionCount > 0 for the chart
        const sorted = [...filteredHistory].reverse().filter(s => (s.questionCount || 0) > 0);
        return sorted.map(session => {
            const total = session.questionCount || 0;
            const percentage = total > 0 ? (session.totalScore / total) * 100 : 0;
            return {
                date: new Date(session.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                fullDate: new Date(session.startTime).toLocaleString('vi-VN'),
                score: session.totalScore,
                total: total,
                percentage: Math.round(percentage)
            };
        });
    }, [filteredHistory]);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                // Fetch dynamic userId
                if (!user || isNaN(Number(user.id))) return
                const res = await fetch(`/api/progress?userId=${user.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setStats(data.stats)
                    setHistory(data.history)
                }
            } catch (error) {
                console.error("Failed to fetch progress", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (user) {
            fetchProgress()
        } else {
            setIsLoading(false)
        }
    }, [user])

    if (isLoading) {
        return <div className="p-8 flex justify-center">Đang tải dữ liệu...</div>
    }

    if (!stats) {
        return <div className="p-8">Chưa có dữ liệu học tập. Hãy làm một bài thi thử!</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-2">
                            <ArrowLeft className="w-4 h-4" /> Trang chủ
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Tiến Độ Học Tập</h1>
                        <p className="text-gray-500">Theo dõi quá trình ôn luyện của bạn</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <Card className="border-green-100 bg-linear-to-br from-white to-green-50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-700">Chuỗi Ngày Học</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{stats.studyStreak}</div>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Ngày liên tiếp
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-100 bg-linear-to-br from-white to-blue-50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700">Hoạt Động Gần Nhất</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-gray-900">
                                {stats.lastStudyDate ? new Date(stats.lastStudyDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                            </div>
                            <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Ngày làm bài cuối
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-100 bg-linear-to-br from-white to-amber-50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700">Thành Tích Tốt Nhất</CardTitle>
                            <Trophy className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {history.length > 0 ? Math.max(...history.map(s => s.questionCount ? Math.round((s.totalScore / s.questionCount) * 100) : 0)) : 0}%
                            </div>
                            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> Điểm cao nhất
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Chart */}
                <div className="mb-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Map className="w-5 h-5 text-blue-600" />
                            Hành trình của bạn
                        </h2>
                        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">Tất cả</TabsTrigger>
                                <TabsTrigger value="exam">Thi Thử</TabsTrigger>
                                <TabsTrigger value="practice">Luyện Tập</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <ProgressChart data={chartData} />
                </div>

                {/* Recent History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" /> Lịch Sử Làm Bài {activeTab !== 'all' && <span className="text-sm font-normal text-gray-500 capitalize">({activeTab === 'exam' ? 'Thi Thử' : 'Luyện Tập'})</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Chưa có lịch sử làm bài cho chế độ này.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-md">Thời gian</th>
                                            <th className="px-4 py-3">Chế độ</th>
                                            <th className="px-4 py-3">Trạng thái</th>
                                            <th className="px-4 py-3 text-right">Điểm số</th>
                                            <th className="px-4 py-3 rounded-r-md text-right">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredHistory.map((session) => {
                                            const count = session.questionCount || 0;
                                            const percent = count > 0 ? (session.totalScore / count) * 100 : 0;

                                            // Badge logic
                                            let badgeColor = "bg-gray-100 text-gray-700";
                                            let badgeText = "Chưa rõ";
                                            if (count > 0) {
                                                if (percent >= 80) {
                                                    badgeColor = "bg-green-100 text-green-700";
                                                    badgeText = "Tốt";
                                                } else if (percent >= 50) {
                                                    badgeColor = "bg-blue-100 text-blue-700";
                                                    badgeText = "Khá";
                                                } else {
                                                    badgeColor = "bg-yellow-100 text-yellow-800";
                                                    badgeText = "Cần cố gắng";
                                                }
                                            }

                                            return (
                                                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900">
                                                            {new Date(session.startTime).toLocaleString('vi-VN')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 capitalize">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${session.mode === 'exam' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                            }`}>
                                                            {session.mode === 'exam' ? 'Thi Thử' : 'Luyện Tập'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
                                                            {badgeText}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                        {session.totalScore} / {count > 0 ? count : '?'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                                                        {count > 0 ? `${Math.round(percent)}%` : '-'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
