'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight, UserPlus, Mail, Lock, User, ChevronLeft } from 'lucide-react'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
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
                setError(error.message)
                setLoading(false)
            } else {
                setSuccess(true)
            }
        } catch (err) {
            setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-green-50 relative overflow-hidden">
                <Link
                    href="/"
                    className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-sm transition-all text-gray-600 hover:text-green-600 font-medium group shadow-sm hover:shadow-md"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Trang chủ</span>
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
                    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-10 shadow-xl text-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                            <UserPlus className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Đăng ký thành công!</h2>
                        <p className="text-gray-600 mb-8 max-w-xs mx-auto">
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
        <div className="min-h-screen w-full flex items-center justify-center bg-purple-50 relative overflow-hidden">
            <Link
                href="/"
                className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-sm transition-all text-gray-600 hover:text-purple-600 font-medium group shadow-sm hover:shadow-md"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Trang chủ</span>
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
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-10 shadow-xl">
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20"
                        >
                            <UserPlus className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản mới</h1>
                        <p className="text-gray-500">Bắt đầu hành trình chinh phục SOA của bạn</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-gray-700 font-medium">Họ và tên</Label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-purple-100 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-purple-100 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 font-medium">Mật khẩu</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Ít nhất 6 ký tự"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-purple-100 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Xác nhận mật khẩu</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Nhập lại mật khẩu"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-purple-100 transition-all rounded-xl"
                                />
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

                    <div className="mt-8 text-center bg-gray-50/50 p-4 rounded-xl">
                        <p className="text-gray-600 text-sm">
                            Đã có tài khoản?{' '}
                            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-bold hover:underline transition-colors">
                                Đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
