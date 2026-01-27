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
import { useTranslations } from 'next-intl'

export default function ProfilePage() {
    const t = useTranslations('profile')
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
                // Force fresh fetch with timestamp
                const res = await fetch(`/api/profile?userId=${user.id}&t=${Date.now()}`)
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
                toast.success(t('messages.updateSuccess'))
            } else {
                toast.error(t('messages.updateError'))
            }
        } catch (error) {
            console.error("Failed to update", error)
            toast.error(t('messages.error'))
        } finally {
            setIsSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (!newPassword || !oldPassword || !confirmPassword) {
            toast.error(t('messages.fillAll'))
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error(t('messages.passwordMismatch'))
            return
        }

        if (newPassword.length < 6) {
            toast.error(t('messages.passwordLength'))
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
                toast.error(t('messages.wrongPassword'))
                setIsChangingPassword(false)
                return
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (updateError) {
                toast.error(t('messages.updateError') + ": " + updateError.message)
            } else {
                toast.success(t('messages.passwordSuccess'))
                setOldPassword("")
                setNewPassword("")
                setConfirmPassword("")
            }
        } catch (err) {
            console.error(err)
            toast.error(t('messages.error'))
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error(t('messages.sizeError'))
            return
        }

        const toastId = toast.loading(t('messages.uploading'))
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
                toast.success(t('messages.uploadSuccess'), { id: toastId })
            } else {
                throw new Error("Failed to update profile")
            }
        } catch (error) {
            console.error(error)
            toast.error(t('messages.uploadError'), { id: toastId })
        } finally {
            e.target.value = ''
        }
    }

    if (!user) {
        return <div className="h-screen flex items-center justify-center">{t('loading')}</div>
    }

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Hero Header with Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-card shadow-xl border border-border/50">
                    {/* Gradient Banner */}
                    <div className="h-36 sm:h-44 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 relative">
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    {/* Profile Info Section */}
                    <div className="px-6 sm:px-8 pb-6 -mt-16 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                            {/* Avatar with Upload */}
                            <div className="relative group">
                                <div className="ring-4 ring-card rounded-full shadow-xl">
                                    <Avatar className="w-28 h-28 sm:w-32 sm:h-32 cursor-pointer transition-transform group-hover:scale-105" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                        <AvatarImage src={stats?.avatarUrl || user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="object-cover" />
                                        <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                            {user.email?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <button
                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                    className="absolute bottom-1 right-1 p-2 bg-card rounded-full shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-all hover:bg-muted hover:scale-110"
                                >
                                    <Camera className="w-4 h-4 text-muted-foreground" />
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
                                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.fullName || user.fullName || "User"}</h1>
                                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 capitalize shadow-sm">
                                        {stats?.role || "Student"}
                                    </Badge>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-muted-foreground text-sm justify-center sm:justify-start">
                                    <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                                        <Mail className="w-4 h-4" /> {user.email}
                                    </span>
                                    <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                                        <Calendar className="w-4 h-4" /> {t('stats.joined')} {new Date(stats?.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Trophy className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('stats.totalPractice')}</p>
                                <h3 className="text-3xl font-bold text-foreground">{stats?._count?.examSessions || 0}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group bg-card/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Flame className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('stats.streak')}</p>
                                <h3 className="text-3xl font-bold text-foreground">{stats?.studyStreak || 0} <span className="text-lg font-medium text-muted-foreground">{t('stats.days')}</span></h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Tabs */}
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/80 p-1 rounded-xl h-auto">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg py-3 text-sm font-semibold transition-all text-muted-foreground">
                            <User className="w-4 h-4 mr-2" />
                            {t('tabs.profile')}
                        </TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg py-3 text-sm font-semibold transition-all text-muted-foreground">
                            <Shield className="w-4 h-4 mr-2" />
                            {t('tabs.security')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="mt-6">
                        <div className="space-y-6">
                            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-foreground">{t('personalInfo.title')}</CardTitle>
                                    <CardDescription className="text-muted-foreground">{t('personalInfo.description')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">{t('personalInfo.displayName')}</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-10 h-11 border-border bg-background focus:border-primary focus:ring-primary text-foreground"
                                                placeholder={t('personalInfo.placeholderName')}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">{t('personalInfo.country')}</label>
                                            <select
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
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
                                            <label className="text-sm font-medium text-foreground">{t('personalInfo.level')} <span className="text-xs text-primary font-normal ml-1">{t('personalInfo.levelAuto')}</span></label>
                                            <div className="flex h-11 w-full rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed">
                                                {level === 'Expert' && t('levels.Expert')}
                                                {level === 'Advanced' && t('levels.Advanced')}
                                                {level === 'Intermediate' && t('levels.Intermediate')}
                                                {level === 'Beginner' && t('levels.Beginner')}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                {t('personalInfo.levelHint')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">{t('personalInfo.email')}</label>
                                        <Input value={user.email || ''} disabled className="bg-muted h-11 border-border text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">{t('personalInfo.emailHint')}</p>
                                    </div>
                                    <div className="pt-2">
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving || !fullName.trim()}
                                            className="bg-gradient-to-r from-[#003366] to-[#0050a0] hover:from-[#002244] hover:to-[#003366] text-white shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {isSaving ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('personalInfo.saving')}</>
                                            ) : (
                                                <><Save className="mr-2 h-4 w-4" /> {t('personalInfo.save')}</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="mt-6">
                        <div className="space-y-6">
                            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-foreground">{t('security.title')}</CardTitle>
                                    <CardDescription className="text-muted-foreground">{t('security.description')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">{t('security.currentPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                className="pl-10 h-11 border-border bg-background text-foreground"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">{t('security.newPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pl-10 h-11 border-border bg-background text-foreground"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">{t('security.confirmPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pl-10 h-11 border-border bg-background text-foreground"
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
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('security.changing')}</>
                                            ) : (
                                                <><Lock className="mr-2 h-4 w-4" /> {t('security.change')}</>
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
