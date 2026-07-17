'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
    Users, Target, Clock, TrendingUp, BookOpen,
    AlertCircle, Trophy, Globe, RefreshCw, ArrowLeft, Zap
} from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import Link from 'next/link'

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

export default function StatisticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        try {
            const res = await fetch('/api/admin/statistics')
            if (res.ok) setData(await res.json())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader size="lg" text="Đang tải thống kê chi tiết..." />
        </div>
    )

    const funnelPct = (val: number, base: number) => base > 0 ? Math.round((val / base) * 100) : 0

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Thống Kê Chi Tiết</h1>
                        <p className="text-muted-foreground mt-0.5">Phân tích toàn diện hành vi & kết quả người dùng</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-all text-sm font-medium disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {/* Funnel */}
            <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Phễu Chuyển Đổi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Tổng đăng ký', value: data?.funnel?.totalUsers || 0, pct: 100, color: 'bg-blue-500' },
                        {
                            label: 'Đã làm ≥1 bài', value: data?.funnel?.usersWithExam || 0,
                            pct: funnelPct(data?.funnel?.usersWithExam, data?.funnel?.totalUsers), color: 'bg-violet-500'
                        },
                        {
                            label: 'Đã làm ≥5 bài', value: data?.funnel?.usersWithFiveExams || 0,
                            pct: funnelPct(data?.funnel?.usersWithFiveExams, data?.funnel?.totalUsers), color: 'bg-green-500'
                        },
                    ].map((item, i) => (
                        <Card key={i} className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                                <p className="text-3xl font-bold text-foreground">{item.value.toLocaleString()}</p>
                                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{item.pct}% tổng user</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Mode stats + Avg session time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Luyện tập</p>
                            <p className="text-2xl font-bold text-foreground">
                                {data?.modeStats?.find((m: any) => m.mode === 'practice')?.count || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">lượt</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Thi thử</p>
                            <p className="text-2xl font-bold text-foreground">
                                {data?.modeStats?.find((m: any) => m.mode === 'exam')?.count || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">lượt</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">TB thời gian / bài</p>
                            <p className="text-2xl font-bold text-foreground">{data?.avgSessionMinutes || 0}</p>
                            <p className="text-xs text-muted-foreground">phút</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score distribution */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            Phân Bố Điểm Số (% đúng)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.scoreDistribution || []}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="range" fontSize={12} />
                                <YAxis fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" name="Số bài" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Level distribution */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4 text-violet-500" />
                            Phân Bố Trình Độ Người Dùng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.levelDistribution || []}
                                    dataKey="count"
                                    nameKey="level"
                                    cx="50%" cy="50%"
                                    outerRadius={90}
                                    label={({ name, percent }) => `${name ?? ''} ${percent != null ? (percent * 100).toFixed(0) : 0}%`}
                                    labelLine={false}
                                >
                                    {(data?.levelDistribution || []).map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly activity heatmap */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            Giờ Cao Điểm (30 ngày gần nhất)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.hourlyActivity || []}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="hour" fontSize={10} interval={2} />
                                <YAxis fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" name="Lượt thi" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category performance */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            Hiệu Suất Theo Kỳ Thi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.categoryPerformance?.slice(0, 8) || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" fontSize={12} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                                <Tooltip
                                    formatter={(val: any, name: any) => [val, name === 'sessions' ? 'Lượt thi' : 'Điểm TB']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="sessions" name="sessions" fill="#059669" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top wrong questions */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Top 10 Câu Hỏi Sai Nhiều Nhất
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {(data?.topWrongQuestions || []).map((q: any, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-red-600">#{i + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground line-clamp-2">{q.content}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full border border-border">{q.category}</span>
                                        <span className="text-xs text-red-600 font-semibold">{q.wrongCount} lần sai</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!data?.topWrongQuestions?.length) && (
                            <p className="text-center text-muted-foreground text-sm py-4">Chưa có dữ liệu.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Top active users */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Top 10 Người Dùng Tích Cực Nhất
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">#</th>
                                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Người dùng</th>
                                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Level</th>
                                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Câu đã làm</th>
                                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Số bài thi</th>
                                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Streak 🔥</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.topUsers || []).map((u: any, i: number) => (
                                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-3">
                                            <span className={`font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-medium text-foreground">{u.name}</td>
                                        <td className="py-3 px-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.level === 'Advanced' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                u.level === 'Intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>{u.level || 'Beginner'}</span>
                                        </td>
                                        <td className="py-3 px-3 text-right text-foreground">{u.questionsAnswered.toLocaleString()}</td>
                                        <td className="py-3 px-3 text-right text-foreground">{u.totalSessions}</td>
                                        <td className="py-3 px-3 text-right font-semibold text-orange-500">{u.studyStreak}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Country distribution */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        Phân Bố Theo Quốc Gia
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {(data?.countryDistribution || []).map((c: any, i: number) => (
                            <div key={i} className="text-center p-4 rounded-xl bg-muted/50 border border-border hover:border-blue-200 transition-colors">
                                <p className="text-2xl mb-1">{c.country === 'VN' ? '🇻🇳' : c.country === 'US' ? '🇺🇸' : c.country === 'SG' ? '🇸🇬' : '🌍'}</p>
                                <p className="text-lg font-bold text-foreground">{c.count}</p>
                                <p className="text-xs text-muted-foreground">{c.country || 'Unknown'}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
