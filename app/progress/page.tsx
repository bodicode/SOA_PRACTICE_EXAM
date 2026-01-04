'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Target, Calendar, TrendingUp, Clock, History, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'

interface UserStats {
    totalExams: number
    averageScore: number // Score per exam (count of correct answers). Wait, averageScore in schema is Float (avg score).
    studyStreak: number
    lastStudyDate: string | null
}

interface ExamSession {
    id: number
    mode: string
    startTime: string
    totalScore: number
}

export default function ProgressPage() {
    const { user } = useUserStore()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [history, setHistory] = useState<ExamSession[]>([])
    const [isLoading, setIsLoading] = useState(true)

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng Số Bài Thi</CardTitle>
                            <Trophy className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalExams}</div>
                            <p className="text-xs text-muted-foreground">Bài thi đã hoàn thành</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Điểm Trung Bình</CardTitle>
                            <Target className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
                            <p className="text-xs text-muted-foreground">Câu đúng / bài</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Chuỗi Ngày Học</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.studyStreak}</div>
                            <p className="text-xs text-muted-foreground">Ngày liên tiếp</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Hoạt Động Gần Nhất</CardTitle>
                            <Calendar className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">
                                {stats.lastStudyDate ? new Date(stats.lastStudyDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                            </div>
                            <p className="text-xs text-muted-foreground">Ngày làm bài cuối</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" /> Lịch Sử Làm Bài
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Chưa có lịch sử làm bài.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-md">Thời gian</th>
                                            <th className="px-4 py-3">Chế độ</th>
                                            <th className="px-4 py-3 rounded-r-md text-right">Điểm số</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map((session) => (
                                            <tr key={session.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">
                                                        {new Date(session.startTime).toLocaleString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 capitalize">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${session.mode === 'exam' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {session.mode === 'exam' ? 'Thi Thử' : 'Luyện Tập'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                    {session.totalScore}
                                                </td>
                                            </tr>
                                        ))}
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
