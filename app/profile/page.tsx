'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, User, Mail, Calendar, Trophy, Lock, Shield, Camera, Flame } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ProfilePage() {
    const { user, setUser } = useUserStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [fullName, setFullName] = useState('')
    const [country, setCountry] = useState('VN')
    const [level, setLevel] = useState('Beginner')
    const [stats, setStats] = useState<any>(null)

    // Password Change State
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    useEffect(() => {
        if (!user) return

        const fetchProfile = async () => {
            if (!user.id) return
            if (isNaN(Number(user.id))) return

            try {
                const res = await fetch(`/api/profile?userId=${user.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setFullName(data.fullName || '')
                    setCountry(data.country || 'VN')
                    setLevel(data.level || 'Beginner')
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
                body: JSON.stringify({ userId: user.id, fullName, country, level })
            })

            if (res.ok) {
                const data = await res.json()
                setUser({ ...user, fullName: data.user.fullName })
                toast.success("Cập nhật thông tin thành công!")
            } else {
                toast.error("Có lỗi xảy ra khi cập nhật.")
            }
        } catch (error) {
            console.error("Failed to update", error)
            toast.error("Lỗi kết nối!")
        } finally {
            setIsSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (!newPassword || !oldPassword || !confirmPassword) {
            toast.error("Vui lòng nhập đầy đủ thông tin.")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp.")
            return
        }

        if (newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.")
            return
        }

        setIsChangingPassword(true)
        const supabase = createClient()

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: oldPassword,
            })

            if (signInError) {
                toast.error("Mật khẩu hiện tại không đúng.")
                setIsChangingPassword(false)
                return
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (updateError) {
                toast.error("Lỗi khi cập nhật mật khẩu: " + updateError.message)
            } else {
                toast.success("Đổi mật khẩu thành công!")
                setOldPassword("")
                setNewPassword("")
                setConfirmPassword("")
            }
        } catch (err) {
            console.error(err)
            toast.error("Đã xảy ra lỗi không mong muốn.")
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Ảnh không được quá 2MB")
            return
        }

        const toastId = toast.loading("Đang tải ảnh lên...")
        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `public/${user?.id}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, avatarUrl: publicUrl })
            })

            if (res.ok) {
                setUser({ ...user!, avatarUrl: publicUrl })
                setStats((prev: any) => ({ ...prev, avatarUrl: publicUrl }))
                toast.success("Cập nhật avatar thành công!", { id: toastId })
            } else {
                throw new Error("Failed to update profile")
            }
        } catch (error) {
            console.error(error)
            toast.error("Lỗi khi tải ảnh lên", { id: toastId })
        } finally {
            e.target.value = ''
        }
    }

    if (!user) {
        return <div className="h-screen flex items-center justify-center">Vui lòng đăng nhập để xem hồ sơ.</div>
    }

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Hero Header with Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100/50">
                    {/* Gradient Banner */}
                    <div className="h-36 sm:h-44 bg-gradient-to-r from-[#003366] via-[#0050a0] to-[#0066cc] relative">
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/20 to-transparent"></div>
                    </div>

                    {/* Profile Info Section */}
                    <div className="px-6 sm:px-8 pb-6 -mt-16 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                            {/* Avatar with Upload */}
                            <div className="relative group">
                                <div className="ring-4 ring-white rounded-full shadow-xl">
                                    <Avatar className="w-28 h-28 sm:w-32 sm:h-32 cursor-pointer transition-transform group-hover:scale-105" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                        <AvatarImage src={stats?.avatarUrl || user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="object-cover" />
                                        <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                            {user.email?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <button
                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                    className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-50 hover:scale-110"
                                >
                                    <Camera className="w-4 h-4 text-gray-600" />
                                </button>
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center sm:text-left pb-2 sm:mt-20">
                                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 mb-2">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.fullName || user.fullName || "User"}</h1>
                                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 capitalize shadow-sm">
                                        {stats?.role || "Student"}
                                    </Badge>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-gray-500 text-sm justify-center sm:justify-start">
                                    <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                                        <Mail className="w-4 h-4" /> {user.email}
                                    </span>
                                    <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                                        <Calendar className="w-4 h-4" /> Tham gia: {new Date(stats?.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="group bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tổng luyện tập & thi thử</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stats?._count?.examSessions || 0}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Flame className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Chuỗi học tập</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stats?.studyStreak || 0} <span className="text-lg font-medium text-gray-500">ngày</span></h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Tabs */}
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-xl h-auto">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-lg py-3 text-sm font-semibold transition-all text-gray-500">
                            <User className="w-4 h-4 mr-2" />
                            Hồ sơ cá nhân
                        </TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-lg py-3 text-sm font-semibold transition-all text-gray-500">
                            <Shield className="w-4 h-4 mr-2" />
                            Bảo mật
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="mt-6">
                        <div className="space-y-6">
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl">Cập nhật thông tin</CardTitle>
                                    <CardDescription>Thay đổi tên hiển thị của bạn trên hệ thống.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Tên hiển thị</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Nhập tên hiển thị của bạn"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Quốc gia</label>
                                            <select
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className="flex h-11 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="VN">Vietnam 🇻🇳</option>
                                                <option value="US">USA 🇺🇸</option>
                                                <option value="UK">UK 🇬🇧</option>
                                                <option value="CA">Canada 🇨🇦</option>
                                                <option value="AU">Australia 🇦🇺</option>
                                                <option value="SG">Singapore 🇸🇬</option>
                                                <option value="KR">Korea 🇰🇷</option>
                                                <option value="JP">Japan 🇯🇵</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Trình độ <span className="text-xs text-blue-500 font-normal ml-1">(Tự động xếp hạng)</span></label>
                                            <div className="flex h-11 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed">
                                                {level === 'Expert' && 'Expert (Chuyên gia) 🏆'}
                                                {level === 'Advanced' && 'Advanced (Nâng cao) 🥇'}
                                                {level === 'Intermediate' && 'Intermediate (Trung bình) 🥈'}
                                                {level === 'Beginner' && 'Beginner (Mới bắt đầu) 🥉'}
                                            </div>
                                            <p className="text-[10px] text-gray-400">
                                                *Luyện tập nhiều hơn để thăng hạng tự động.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <Input value={user.email || ''} disabled className="bg-gray-50 h-11" />
                                        <p className="text-xs text-gray-500">Email không thể thay đổi.</p>
                                    </div>
                                    <div className="pt-2">
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving || !fullName.trim()}
                                            className="bg-gradient-to-r from-[#003366] to-[#0050a0] hover:from-[#002244] hover:to-[#003366] text-white shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {isSaving ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>
                                            ) : (
                                                <><Save className="mr-2 h-4 w-4" /> Lưu thay đổi</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="mt-6">
                        <div className="space-y-6">
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl">Đổi mật khẩu</CardTitle>
                                    <CardDescription>Cập nhật mật khẩu mới cho tài khoản của bạn.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                type="password"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                className="pl-10 h-11 border-gray-200"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Mật khẩu mới</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pl-10 h-11 border-gray-200"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pl-10 h-11 border-gray-200"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Button
                                            onClick={handleChangePassword}
                                            disabled={isChangingPassword}
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm"
                                        >
                                            {isChangingPassword ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang cập nhật...</>
                                            ) : (
                                                <><Lock className="mr-2 h-4 w-4" /> Đổi mật khẩu</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
