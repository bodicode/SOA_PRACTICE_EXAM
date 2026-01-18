'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, MapPin, Globe, Search, ArrowUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'

interface LeaderboardUser {
    userId: number
    fullName: string
    avatarUrl: string | null
    country: string | null
    level: string | null
    averageScore: number
    totalQuestions: number
    rank: number
}

const COUNTRIES = [
    { code: 'ALL', name: 'Toàn cầu 🌍' },
    { code: 'VN', name: 'Vietnam 🇻🇳' },
    { code: 'US', name: 'USA 🇺🇸' },
    { code: 'UK', name: 'UK 🇬🇧' },
    { code: 'CA', name: 'Canada 🇨🇦' },
    { code: 'AU', name: 'Australia 🇦🇺' },
    { code: 'SG', name: 'Singapore 🇸🇬' },
    { code: 'KR', name: 'Korea 🇰🇷' },
    { code: 'JP', name: 'Japan 🇯🇵' }
]

export default function LeaderboardPage() {
    const { user } = useUserStore()
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCountry, setSelectedCountry] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true)
            try {
                let url = `/api/leaderboard?limit=50`
                if (selectedCountry !== 'ALL') {
                    url += `&country=${selectedCountry}`
                }
                const res = await fetch(url)
                if (res.ok) {
                    const data = await res.json()
                    setLeaderboard(data)
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [selectedCountry])

    // Filter by search term locally
    const filteredLeaderboard = leaderboard.filter(u =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const currentUserRank = leaderboard.find(u => u.userId === Number(user?.id))

    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 1: return 'text-yellow-500' // Gold
            case 2: return 'text-gray-400'   // Silver
            case 3: return 'text-amber-600'  // Bronze
            default: return 'text-gray-600'
        }
    }

    const UserRow = ({ entry, isMe = false }: { entry: LeaderboardUser, isMe?: boolean }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center p-4 rounded-xl mb-3 border transition-all duration-200",
                isMe ? "bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-300 transform scale-[1.01]" : "bg-white border-gray-100 hover:shadow-sm hover:border-gray-200"
            )}
        >
            {/* Rank */}
            <div className="w-12 shrink-0 flex justify-center">
                {entry.rank <= 3 ? (
                    <Trophy className={cn("w-6 h-6", getMedalColor(entry.rank))} />
                ) : (
                    <span className="font-bold text-gray-500 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                        {entry.rank}
                    </span>
                )}
            </div>

            {/* Avatar & Name */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="relative">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                        <AvatarImage src={entry.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.fullName}`} />
                        <AvatarFallback>{entry.fullName?.[0]}</AvatarFallback>
                    </Avatar>
                    {entry.country && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px] shadow-sm text-xs" title={entry.country}>
                            {COUNTRIES.find(c => c.code === entry.country)?.name.split(' ').pop() || '🌍'}
                        </div>
                    )}
                </div>
                <div className="overflow-hidden">
                    <h3 className={cn("font-bold truncate", isMe ? "text-blue-700" : "text-gray-900")}>
                        {entry.fullName || "Người dùng ẩn"} {isMe && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Bạn</span>}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide">{entry.level || 'Người mới'}</span>
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 sm:gap-8 ml-4 text-right">
                <div className="hidden sm:block">
                    <div className="text-xs text-gray-400 font-medium uppercase">Câu hỏi</div>
                    <div className="font-bold text-gray-700">{entry.totalQuestions}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-400 font-medium uppercase">Điểm TB</div>
                    <div className="font-bold text-blue-600 text-lg">{entry.averageScore.toFixed(1)}</div>
                </div>
            </div>
        </motion.div>
    )

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 text-white pb-20 pt-10 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-full mb-2 ring-1 ring-white/20"
                    >
                        <Globe className="w-6 h-6 mr-2 text-blue-200" />
                        <span className="font-semibold text-blue-100">Bảng Xếp Hạng</span>
                    </motion.div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200">
                        Đấu Trường SOA
                    </h1>
                    <p className="text-blue-200 text-lg max-w-xl mx-auto leading-relaxed">
                        Tranh tài cùng cộng đồng Actuary toàn cầu. Khẳng định đẳng cấp và chinh phục đỉnh cao!
                    </p>
                </div>
            </div>

            {/* Filters & Content */}
            <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl mb-6 ring-1 ring-gray-100">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm thành viên..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                            <SelectTrigger className="w-full sm:w-[200px] bg-white">
                                <SelectValue placeholder="Chọn Quốc gia" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map(c => (
                                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <div className="space-y-1">
                    {loading ? (
                        <div className="text-center py-20 text-gray-400">Đang tải dữ liệu...</div>
                    ) : filteredLeaderboard.length > 0 ? (
                        filteredLeaderboard.map(entry => (
                            <UserRow key={entry.userId} entry={entry} isMe={entry.userId === Number(user?.id)} />
                        ))
                    ) : (
                        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed">
                            Chưa có thành viên nào trong khu vực này.
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Fooer for Current User Rank if not visible? Or just highlight logic used above. */}
            {currentUserRank && !searchTerm && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-2xl z-30 sm:hidden"
                >
                    <div className="max-w-4xl mx-auto">
                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Thứ hạng của bạn</div>
                        <UserRow entry={currentUserRank} isMe={true} />
                    </div>
                </motion.div>
            )}
        </div>
    )
}
