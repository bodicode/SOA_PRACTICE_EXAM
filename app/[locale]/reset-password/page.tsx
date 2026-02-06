'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { translateAuthError } from '@/lib/utils'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<{ type: 'success' | 'error', content: string } | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Check if user is authenticated (url param logic happens in middleware/callback, 
    // here we just check if we have a session to allow updating password)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // If no session, user might have accessed this page directly without clicking email link
                // Or session expired. Redirect to login or forgot password.
                // For better UX, we could show a message first.
                setMsg({ type: 'error', content: 'Liên kết không hợp lệ hoặc đã hết hạn.' })
            }
        }
        checkSession()
    }, [])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setMsg({ type: 'error', content: 'Mật khẩu xác nhận không khớp' })
            return
        }
        if (password.length < 6) {
            setMsg({ type: 'error', content: 'Mật khẩu phải có ít nhất 6 ký tự' })
            return
        }

        setLoading(true)
        setMsg(null)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                setMsg({ type: 'error', content: translateAuthError(error.message) })
            } else {
                setMsg({ type: 'success', content: 'Đổi mật khẩu thành công! Đang chuyển hướng...' })
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            }
        } catch (err) {
            setMsg({ type: 'error', content: 'Đã có lỗi xảy ra. Vui lòng thử lại.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-400/20 rounded-full blur-[120px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-lg p-6"
            >
                <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-10 shadow-xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Đặt lại mật khẩu</h1>
                        <p className="text-muted-foreground">Nhập mật khẩu mới cho tài khoản của bạn</p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-foreground font-medium">Mật khẩu mới</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 pr-10 h-12 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-blue-500 focus:ring-blue-100 transition-all rounded-xl"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-blue-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Xác nhận mật khẩu</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="pl-10 h-12 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-blue-500 focus:ring-blue-100 transition-all rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {msg && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`p-4 rounded-xl text-sm flex items-start gap-3 ${msg.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                    : 'bg-red-50 border border-red-200 text-red-600'
                                    }`}
                            >
                                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${msg.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                {msg.content}
                            </motion.div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || (msg?.type === 'success')}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/10 hover:shadow-indigo-900/20"
                        >
                            {loading ? (
                                <Loader size="icon" className="text-white" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Cập nhật mật khẩu <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
