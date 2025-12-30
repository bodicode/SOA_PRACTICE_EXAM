'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSuccess(true)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-t-4 border-green-600">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-green-700">
                            ✅ Đăng ký thành công!
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => router.push('/login')}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            Đi đến trang đăng nhập
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-purple-600">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-purple-900">
                        🎓 Tạo tài khoản
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Đăng ký để bắt đầu luyện thi SOA
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Họ và tên</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Nguyễn Văn A"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="transition-all focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="transition-all focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Ít nhất 6 ký tự"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="transition-all focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Nhập lại mật khẩu"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="transition-all focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="text-purple-600 hover:underline font-medium">
                            Đăng nhập
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
