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
    const [googleLoading, setGoogleLoading] = useState(false)
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

    const handleGoogleLogin = async () => {
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

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
                    </div>
                </div>

                {/* Google Sign In Button */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="w-full h-12 bg-background hover:bg-muted border-border text-foreground font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
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

