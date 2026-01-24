'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight, Mail, ChevronLeft, Key } from 'lucide-react'
import { translateAuthError } from '@/lib/utils'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<{ type: 'success' | 'error', content: string } | null>(null)
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMsg(null)

        try {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
            })

            if (error) {
                setMsg({ type: 'error', content: translateAuthError(error.message) })
            } else {
                setMsg({
                    type: 'success',
                    content: 'Đã gửi email khôi phục. Vui lòng kiểm tra hộp thư của bạn (bao gồm cả mục Spam).'
                })
            }
        } catch (err) {
            setMsg({ type: 'error', content: 'Đã có lỗi xảy ra. Vui lòng thử lại.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            <Link
                href="/login"
                className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all text-muted-foreground hover:text-primary font-medium group shadow-sm hover:shadow-md"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Quay lại đăng nhập</span>
            </Link>

            {/* Animated Background - Reused from Login */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[120px]"
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
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20"
                        >
                            <Key className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Quên mật khẩu?</h1>
                        <p className="text-muted-foreground">Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu</p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground font-medium">Email đã đăng ký</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 h-12 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-blue-500 focus:ring-blue-100 transition-all rounded-xl"
                                />
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
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Gửi yêu cầu <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
