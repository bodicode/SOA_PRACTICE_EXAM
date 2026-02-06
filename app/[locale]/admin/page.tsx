'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Users, FileQuestion, BookOpen, Activity, TrendingUp } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import Link from 'next/link'

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    fetch('/api/admin/dashboard'),
                    fetch('/api/admin/analytics')
                ])

                if (statsRes.ok && analyticsRes.ok) {
                    const statsData = await statsRes.json()
                    const analyticsData = await analyticsRes.json()
                    setStats(statsData)
                    setAnalytics(analyticsData)
                }
            } catch (error) {
                console.error("Failed to fetch admin data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Đang tải thống kê..." /></div>
    }

    const statCards = [
        { title: 'Tổng người dùng', value: stats?.stats?.totalUsers || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
        { title: 'Tổng câu hỏi', value: stats?.stats?.totalQuestions || 0, icon: FileQuestion, color: 'bg-green-100 text-green-600' },
        { title: 'Tổng lượt thi', value: stats?.stats?.totalExams || 0, icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
        { title: 'Active (7 ngày)', value: stats?.stats?.activeUsers7Days || 0, icon: Activity, color: 'bg-orange-100 text-orange-600' },
    ]

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tổng Quan</h1>
                    <p className="text-gray-600 mt-1">Chào mừng quay lại, Admin!</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className=" text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Tăng trưởng người dùng (30 ngày)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics?.userGrowth || []}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" fontSize={12} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
                                <YAxis fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-500" />
                            Hoạt động thi (30 ngày)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.examActivity || []}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" fontSize={12} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
                                <YAxis fontSize={12} allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Lượt thi" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.recentActivity?.length > 0 ? (
                                stats.recentActivity.map((activity: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${activity.type === 'USER_REGISTER' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                                {activity.score !== undefined && (
                                                    <p className="text-xs text-gray-500">Điểm số: <span className="font-semibold text-blue-600">{activity.score}</span></p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(activity.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 text-sm py-4">Chưa có hoạt động nào.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Hành Động Nhanh</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/admin/categories" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Quản lý Danh Mục</p>
                                <p className="text-xs text-gray-500">Thêm/Sửa danh mục đề thi</p>
                            </div>
                        </Link>
                        <Link href="/admin/questions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Quản lý Câu Hỏi</p>
                                <p className="text-xs text-gray-500">Xem và chỉnh sửa ngân hàng câu hỏi</p>
                            </div>
                        </Link>
                        {/* Placeholder for future features */}
                        <div className="flex items-center gap-3 p-3 rounded-lg opacity-60 cursor-not-allowed bg-gray-50/50">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Thống kê chi tiết</p>
                                <p className="text-xs text-gray-500">Đang phát triển...</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
