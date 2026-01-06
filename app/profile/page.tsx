'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, User, Mail, Calendar, Trophy, Target, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
    const { user, setUser } = useUserStore()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [fullName, setFullName] = useState('')
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        if (!user) {
            // Redirect if not logged in
            // router.push('/') 
            return
        }

        const fetchProfile = async () => {
            if (!user.id) return;
            try {
                const res = await fetch(`/api/profile?userId=${user.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setFullName(data.fullName || '')
                    setStats(data)
                }
            } catch (error) {
                console.error("Failed to fetch profile", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [user])

    const handleSave = async () => {
        if (!user || isSaving) return
        setIsSaving(true)
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, fullName })
            })

            if (res.ok) {
                const data = await res.json()
                // Update local store
                setUser({ ...user, fullName: data.user.fullName })
                alert("Cập nhật thông tin thành công!")
            } else {
                alert("Có lỗi xảy ra khi cập nhật.")
            }
        } catch (error) {
            console.error("Failed to update", error)
            alert("Lỗi kết nối!")
        } finally {
            setIsSaving(false)
        }
    }

    if (!user) {
        return <div className="h-screen flex items-center justify-center">Vui lòng đăng nhập để xem hồ sơ.</div>
    }

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <Avatar className="w-24 h-24 border-4 border-blue-50">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                        <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                            {user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="text-center md:text-left flex-1 space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">{stats?.fullName || user.fullName || "User"}</h1>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 capitalize">
                                {stats?.role || "Student"}
                            </Badge>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 text-gray-500 text-sm items-center md:items-start">
                            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Tham gia: {new Date(stats?.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Stats Cards */}
                    <Card className="md:col-span-3 border-none bg-transparent shadow-none p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-white border-blue-100">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Tổng số lần luyện tập và thi thử</p>
                                        <h3 className="text-2xl font-bold text-gray-900">{stats?.totalExams || 0}</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-orange-100">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Chuỗi học tập</p>
                                        <h3 className="text-2xl font-bold text-gray-900">{stats?.studyStreak || 0} ngày</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </Card>

                    {/* Edit Profile Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Cập nhật thông tin</CardTitle>
                                <CardDescription>Thay đổi tên hiển thị của bạn trên hệ thống.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Tên hiển thị</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <Input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-10"
                                            placeholder="Nhập tên hiển thị của bạn"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                    <Input value={user.email || ''} disabled className="bg-gray-50" />
                                    <p className="text-xs text-gray-500">Email không thể thay đổi.</p>
                                </div>
                                <div className="pt-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || !fullName.trim()}
                                        className="bg-[#003366] hover:bg-[#002244]"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Helper (Optional) */}
                    <div className="md:col-span-1">
                        <Card className="bg-blue-50 border-blue-100">
                            <CardHeader>
                                <CardTitle className="text-[#003366] text-lg">Gợi ý</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-700 space-y-2">
                                <p>• Cập nhật tên thật để nhận chứng chỉ sau này.</p>
                                <p>• Duy trì chuỗi học tập để nhận huy hiệu.</p>
                                <p>• Kiểm tra tiến độ thường xuyên để cải thiện điểm số.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
