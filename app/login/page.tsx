'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Sync user to database and get role
            const syncRes = await fetch('/api/auth/sync-user', { method: 'POST' })
            const syncData = await syncRes.json()

            // Redirect based on role
            if (syncData.user?.role === 'ADMIN') {
                router.push('/admin')
            } else {
                router.push('/')
            }
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-blue-600">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-blue-900">
                        🛡️ SOA Exam Practice
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Đăng nhập để tiếp tục luyện thi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="transition-all focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="transition-all focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Chưa có tài khoản?{' '}
                        <Link href="/register" className="text-blue-600 hover:underline font-medium">
                            Đăng ký ngay
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
