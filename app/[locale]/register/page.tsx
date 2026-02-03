'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight, UserPlus, Mail, Lock, User, ChevronLeft, Rocket, GraduationCap, Stars, Eye, EyeOff } from 'lucide-react'

import { translateAuthError } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
    const t = useTranslations('auth')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/api/auth/callback`,
                },
            })

            if (error) {
                setError(translateAuthError(error.message))
                setLoading(false)
            } else {
                setSuccess(true)
            }
        } catch (err) {
            setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
            setLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/api/auth/callback`,
                },
            })

            if (error) {
                setError(translateAuthError(error.message))
                setGoogleLoading(false)
            }
        } catch (err) {
            setError(t('errorGeneric'))
            setGoogleLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
                <Link
                    href="/"
                    className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all text-muted-foreground hover:text-primary font-medium group shadow-sm hover:shadow-md"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>{t('home')}</span>
                </Link>
                {/* Background (Same as Login but Green) */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-green-400/20 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            x: [0, 50, 0],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[100px]"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-lg p-6"
                >
                    <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-10 shadow-xl text-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                            <UserPlus className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Đăng ký thành công!</h2>
                        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                            Vui lòng kiểm tra email của bạn để xác nhận tài khoản trước khi đăng nhập.
                        </p>
                        <Button
                            onClick={() => router.push('/login')}
                            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02]"
                        >
                            Đến trang đăng nhập
                        </Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            <Link
                href="/"
                className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all text-muted-foreground hover:text-primary font-medium group shadow-sm hover:shadow-md"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>{t('home')}</span>
            </Link>
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-400/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, 50, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[100px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-2xl p-6"
            >
                <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-10 shadow-xl">
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20"
                        >
                            <UserPlus className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Tạo tài khoản mới</h1>
                        <p className="text-muted-foreground">Bắt đầu hành trình chinh phục SOA của bạn</p>
                    </div>

                    {/* Floating Icons */}
                    <div className="absolute top-10 right-10 hidden lg:block pointer-events-none">
                        <motion.div
                            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="text-purple-300"
                        >
                            <Rocket className="w-12 h-12 opacity-50" />
                        </motion.div>
                    </div>
                    <div className="absolute bottom-40 left-5 hidden lg:block pointer-events-none">
                        <motion.div
                            animate={{ y: [0, 15, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="text-pink-300"
                        >
                            <GraduationCap className="w-14 h-14 opacity-50" />
                        </motion.div>
                    </div>
                    <div className="absolute top-1/2 -right-5 hidden lg:block pointer-events-none">
                        <motion.div
                            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="text-yellow-400"
                        >
                            <Stars className="w-8 h-8" />
                        </motion.div>
                    </div>

                    {/* Google Sign Up Button - At the top */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignUp}
                        disabled={googleLoading}
                        className="w-full h-12 bg-background hover:bg-muted border-border text-foreground font-medium rounded-xl transition-all shadow-sm hover:shadow-md mb-6"
                    >
                        {googleLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-3">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                {t('continueWithGoogle')}
                            </span>
                        )}
                    </Button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
                        </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-foreground font-medium">Họ và tên</Label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground font-medium">Mật khẩu</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ít nhất 6 ký tự"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-10 pr-10 h-11 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-foreground font-medium">Xác nhận mật khẩu</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Nhập lại mật khẩu"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="pl-10 pr-10 h-11 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </motion.div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/10 hover:shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Đăng ký ngay <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center bg-muted/50 p-4 rounded-xl">
                        <p className="text-muted-foreground text-sm">
                            Đã có tài khoản?{' '}
                            <Link href="/login" className="text-primary hover:text-primary/90 font-bold hover:underline transition-colors">
                                Đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

