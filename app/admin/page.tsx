'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
    const stats = [
        { title: 'Tổng Danh Mục', value: '15', icon: '📂', color: 'bg-blue-500' },
        { title: 'Tổng Câu Hỏi', value: '1,234', icon: '❓', color: 'bg-green-500' },
        { title: 'Bộ Đề Thi', value: '8', icon: '📝', color: 'bg-purple-500' },
        { title: 'Người Dùng', value: '156', icon: '👥', color: 'bg-orange-500' },
    ]

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tổng Quan</h1>
                <p className="text-gray-600 mt-1">Chào mừng bạn đến với trang quản trị</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Hành Động Nhanh</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <a href="/admin/categories" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Thêm Danh Mục Mới</p>
                                <p className="text-sm text-gray-500">Tạo danh mục đề thi mới</p>
                            </div>
                        </a>
                        <a href="/admin/questions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Thêm Câu Hỏi Mới</p>
                                <p className="text-sm text-gray-500">Nhập câu hỏi vào ngân hàng đề</p>
                            </div>
                        </a>
                        <a href="/admin/exams" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Tạo Bộ Đề Thi</p>
                                <p className="text-sm text-gray-500">Tổ hợp câu hỏi thành đề thi</p>
                            </div>
                        </a>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Hoạt Động Gần Đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { action: 'Thêm câu hỏi mới', category: 'Exam P', time: '5 phút trước' },
                                { action: 'Cập nhật danh mục', category: 'Exam FM', time: '1 giờ trước' },
                                { action: 'Tạo bộ đề thi', category: 'Mock Exam #5', time: '2 giờ trước' },
                                { action: 'Thêm 10 câu hỏi', category: 'Exam IFM', time: '1 ngày trước' },
                            ].map((activity, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                        <p className="text-xs text-gray-500">{activity.category}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">{activity.time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
