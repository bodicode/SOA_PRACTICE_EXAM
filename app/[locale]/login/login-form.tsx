'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight, ShieldCheck, Mail, Lock, Key, Fingerprint, Eye, EyeOff } from 'lucide-react'
import { translateAuthError } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export default function LoginForm() {
    const t = useTranslations('auth')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const errorMsg = searchParams.get('error')
        if (errorMsg) {
            setError(decodeURIComponent(errorMsg))
        }
    }, [searchParams])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(translateAuthError(error.message))
                setLoading(false)
                return
            }

            // Sync user to database
            const syncRes = await fetch('/api/auth/sync-user', { method: 'POST' })
            const syncData = await syncRes.json()

            // Redirect based on role
            if (syncData.user?.role === 'ADMIN') {
                router.push('/admin')
            } else {
                router.push('/')
            }
            router.refresh()
        } catch (err) {
            setError(t('errorGeneric'))
            setLoading(false)
        }
    }

    return (
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
                        className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20"
                    >
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{t('loginTitle')}</h1>
                    <p className="text-muted-foreground">{t('loginSubtitle')}</p>
                </div>

                {/* Floating Icons */}
                <div className="absolute top-20 left-10 hidden lg:block pointer-events-none">
                    <motion.div
                        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="text-blue-300"
                    >
                        <Key className="w-12 h-12 opacity-50" />
                    </motion.div>
                </div>
                <div className="absolute bottom-20 right-10 hidden lg:block pointer-events-none">
                    <motion.div
                        animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="text-indigo-300"
                    >
                        <Fingerprint className="w-16 h-16 opacity-50" />
                    </motion.div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground font-medium">{t('email')}</Label>
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

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password" className="text-foreground font-medium">{t('password')}</Label>
                            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline relative z-10">
                                {t('forgotPassword')}
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
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
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                {t('signIn')} <ArrowRight className="w-5 h-5" />
                            </span>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center bg-muted/50 p-4 rounded-xl">
                    <p className="text-muted-foreground text-sm">
                        {t('noAccount')}{' '}
                        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors">
                            {t('createAccount')}
                        </Link>
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
