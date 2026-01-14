'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Target, Calendar, TrendingUp, Clock, History, ArrowLeft, Filter, Map, Zap, Star, Flame, Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { useProgressStore } from '@/stores/progressStore'
import ProgressChart from '@/components/ProgressChart'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

interface UserStats {
    totalExams: number
    studyStreak: number
    lastStudyDate: string | null
    averageScore: number
    totalQuestions: number
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
    const { getData, fetchProgress, isLoading, cache } = useProgressStore()

    const [activeCategory, setActiveCategory] = useState<number | undefined>(undefined)

    // Derive data from store cache
    const activeData = useMemo(() => {
        return getData(activeCategory);
    }, [getData, activeCategory, cache]);

    const stats = activeData?.stats || null;
    const history = activeData?.history || [];

    useEffect(() => {
        if (user && !isNaN(Number(user.id))) {
            const uid = Number(user.id);
            // Prefetch all categories to ensure smooth tab switching
            fetchProgress(uid, undefined); // All
            fetchProgress(uid, 1);       // Exam P
            fetchProgress(uid, 2);       // Exam FM
        }
    }, [user, fetchProgress]);

    // Show loading only if we have NO data yet for this specific combination
    const isInitialLoading = isLoading(activeCategory) && !activeData;

    // Use full history directly
    const filteredHistory = history;

    const chartData = useMemo(() => {
        // Filter for exams only
        const examSessions = filteredHistory.filter((s: ExamSession) => s.mode === 'exam' && (s.questionCount || 0) > 0);

        const sorted = [...examSessions].reverse();
        return sorted.map(session => {
            const total = session.questionCount || 0;
            const score = Number(session.totalScore || 0);
            const scale10 = total > 0 ? (score / total) * 10 : 0;
            const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

            const dateObj = new Date(session.startTime);
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const dayPrefix = days[dateObj.getDay()];
            const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

            return {
                date: `${dayPrefix} ${dateStr}`,
                fullDate: new Date(session.startTime).toLocaleString('vi-VN'),
                score: score,
                total: total,
                scale10: Number(scale10.toFixed(1)),
                percentage: percentage,
                mode: 'Thi thử'
            };
        });
    }, [filteredHistory]);

    // Calculate outcomes
    const outcomes = useMemo(() => {
        let pass = 0;
        let fail = 0;
        // Also filter outcomes to only Exam mode
        filteredHistory.filter((s: ExamSession) => s.mode === 'exam').forEach((session: ExamSession) => {
            const total = session.questionCount || 0;
            const score = Number(session.totalScore || 0);
            const percentage = total > 0 ? (score / total) * 100 : 0;
            if (percentage >= 70) pass++; // Assuming 70% is pass
            else fail++;
        });
        return [
            { name: 'Pass', value: pass, color: '#2563EB' },
            { name: 'Fail', value: fail, color: '#EF4444' }
        ];
    }, [filteredHistory]);

    const passRate = outcomes[0].value + outcomes[1].value > 0
        ? Math.round((outcomes[0].value / (outcomes[0].value + outcomes[1].value)) * 100)
        : 0;

    if (isInitialLoading) {
        return <div className="p-8 flex justify-center text-gray-500">Loading analytics...</div>
    }

    const bestScore = history.length > 0
        ? Math.max(...history.map((s: ExamSession) => s.questionCount ? (s.totalScore / s.questionCount) * 10 : 0))
        : 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Thống Kê Hiệu Quả</h1>
                        <p className="text-slate-500 mt-1">Theo dõi chi tiết tiến độ ôn thi Exam P & FM</p>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="mb-6">
                    <Tabs defaultValue="all" className="w-full" onValueChange={(val) => setActiveCategory(val === 'all' ? undefined : parseInt(val))}>
                        <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-100 p-1">
                            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-500 font-medium">Tất cả</TabsTrigger>
                            <TabsTrigger value="1" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-500 font-medium">Exam P</TabsTrigger>
                            <TabsTrigger value="2" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-500 font-medium">Exam FM</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>



                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Average Score */}
                    <Card className="border-none shadow-sm bg-white p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-blue-500 mb-1">Điểm Trung Bình</p>
                                <div className="text-3xl font-bold text-slate-900">
                                    {stats?.averageScore ? Number(stats.averageScore).toFixed(1) : 0}<span className="text-lg text-gray-400 font-normal">/10</span>
                                </div>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Mục tiêu: 7.0/10
                        </p>
                    </Card>

                    {/* Total Exams */}
                    <Card className="border-none shadow-sm bg-white p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Tổng Số Bài Thi</p>
                                <div className="text-3xl font-bold text-slate-900">{stats?.totalExams || 0}</div>
                            </div>
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <FileText className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Đã hoàn thành {stats?.totalQuestions || 0} câu hỏi
                        </p>
                    </Card>

                    {/* Best Score (Replaces Strongest Topic) */}
                    <Card className="border-none shadow-sm bg-white p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Điểm Cao Nhất</p>
                                <div className="text-3xl font-bold text-slate-900 leading-tight">
                                    {bestScore.toFixed(1)}<span className="text-lg text-gray-400 font-normal">/10</span>
                                </div>
                            </div>
                            <div className="p-2 bg-yellow-50 rounded-lg">
                                <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                            </div>
                        </div>
                        <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                            <VerifiedIcon className="w-3 h-3" /> Kỷ lục cá nhân
                        </p>
                    </Card>

                    {/* Study Streak */}
                    <Card className="border-none shadow-sm bg-white p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Chuỗi Ngày Học</p>
                                <div className="text-3xl font-bold text-slate-900">{stats?.studyStreak || 0} Ngày</div>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Giữ vững phong độ nhé!
                        </p>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="mb-8">
                    {/* Score Evolution Chart */}
                    <div className="h-[400px]">
                        <ProgressChart data={chartData} />
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Exam Outcomes */}
                    <Card className="border-none shadow-md bg-white p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-6">Tỉ Lệ Đạt (Pass Rate)</h3>
                        <div className="h-64 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={outcomes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {outcomes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: any) => [value, 'Số lượng']} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-slate-900">{passRate}%</span>
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Tỉ lệ Đậu</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                <span className="text-sm text-slate-600">Đậu ({outcomes[0].value})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-slate-600">Trượt ({outcomes[1].value})</span>
                            </div>
                        </div>
                    </Card>

                    {/* Recent Attempts */}
                    <Card className="lg:col-span-2 border-none shadow-md bg-white p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-900">Lịch Sử Làm Bài Gần Đây</h3>
                            <Link href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Xem tất cả</Link>
                        </div>
                        <div className="space-y-4">
                            {filteredHistory.slice(0, 4).map((session: ExamSession, i: number) => {
                                const total = session.questionCount || 0;
                                const score = Number(session.totalScore || 0);
                                const scale10 = total > 0 ? (score / total) * 10 : 0;
                                const percentage = total > 0 ? (score / total) * 100 : 0;
                                const isPassed = percentage >= 70; // Logic đậu/trượt tạm thời

                                return (
                                    <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                                <History className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">
                                                    {session.mode === 'exam' ? `Bài Thi Thử #${session.id}` : `Luyện Tập #${session.id}`}
                                                </h4>
                                                <p className="text-xs text-slate-500">{new Date(session.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
                                                {scale10.toFixed(1)}/10
                                            </div>
                                            <div className={`text-[10px] uppercase font-bold tracking-wider ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
                                                {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {filteredHistory.length === 0 && (
                                <div className="text-center py-8 text-slate-400">Chưa có dữ liệu trong khoảng thời gian này.</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function VerifiedIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12.01 2.011a3.2 3.2 0 0 1 2.113 .797l.154 .145l.698 .698a1.2 1.2 0 0 0 .71 .341l.135 .008h1a3.2 3.2 0 0 1 3.195 3.018l.005 .182v1c0 .27 .092 .533 .258 .743l.09 .1l.697 .698a3.2 3.2 0 0 1 .147 4.382l-.145 .154l-.698 .698a1.2 1.2 0 0 0 -.341 .71l-.008 .135v1a3.2 3.2 0 0 1 -3.018 3.195l-.182 .005h-1a1.2 1.2 0 0 0 -.743 .258l-.1 .09l-.698 .697a3.2 3.2 0 0 1 -4.382 .147l-.154 -.145l-.698 -.698a1.2 1.2 0 0 0 -.71 -.341l-.135 -.008h-1a3.2 3.2 0 0 1 -3.195 -3.018l-.005 -.182v-1a1.2 1.2 0 0 0 -.258 -.743l-.09 -.1l-.697 -.698a3.2 3.2 0 0 1 -.147 -4.382l.145 -.154l.698 -.698a1.2 1.2 0 0 0 .341 -.71l.008 -.135v-1a3.2 3.2 0 0 1 3.018 -3.195l.182 -.005h1a1.2 1.2 0 0 0 .743 -.258l.1 -.09l.698 -.697a3.2 3.2 0 0 1 2.269 -.944z" strokeWidth="0" fill="currentColor" />
            <path d="M9 12l2 2l4 -4" stroke="white" strokeWidth="2" fill="none" />
        </svg>
    )
}

