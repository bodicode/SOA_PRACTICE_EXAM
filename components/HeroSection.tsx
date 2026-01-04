'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/stores/userStore'
import { CheckCircle2, TrendingUp, Target, Trophy, ArrowRight, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UserStats {
    totalExams: number
    averageScore: number
    studyStreak: number
    lastStudyDate: string | null
}

interface ExamSession {
    id: number
    totalScore: number
    startTime: string
}

export function HeroSection() {
    const { user } = useUserStore()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [history, setHistory] = useState<ExamSession[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)

    useEffect(() => {
        if (user) {
            const fetchStats = async () => {
                if (!user.id || isNaN(Number(user.id))) return
                setIsLoading(true)
                try {
                    // Fetch dynamic userId
                    const res = await fetch(`/api/progress?userId=${user.id}`)
                    if (res.ok) {
                        const data = await res.json()
                        setStats(data.stats)
                        setHistory(data.history || [])
                    }
                } catch (error) {
                    console.error("Failed to fetch stats", error)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchStats()
        }
    }, [user])

    // Render Progress Dashboard for active users
    if (user && stats && stats.totalExams > 0) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="relative perspective-1000"
            >
                <div className="relative z-10 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)] border border-white/50 p-8 overflow-hidden transform-gpu hover:scale-[1.01] transition-transform duration-500">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

                    <div className="relative z-20">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Chào, {user.fullName || "User"}! 👋</h3>
                                <p className="text-sm text-gray-500">Tiếp tục giữ vững phong độ nhé.</p>
                            </div>
                            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Online
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Streak Card */}
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2 text-orange-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{stats.studyStreak}</div>
                                <div className="text-xs text-gray-500 font-medium">Ngày liên tiếp</div>
                            </div>

                            {/* Average Score Card using Circular Progress logic conceptually */}
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-blue-600">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(0)}%</div>
                                <div className="text-xs text-gray-500 font-medium">Điểm trung bình</div>
                            </div>
                        </div>

                        {/* Recent Activity Bar Chart */}
                        <div className="bg-white/50 rounded-xl p-5 border border-gray-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-blue-600" /> Biểu đồ điểm số
                                </span>
                                <span className="text-xs text-gray-400">5 bài thi gần nhất</span>
                            </div>

                            <div className="flex justify-between h-32 gap-2">
                                {history.length > 0 ? (
                                    history.slice(0, 5).reverse().map((session, idx) => (
                                        <div key={session.id} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group">
                                            <div className="relative w-full flex-1 flex items-end justify-center bg-gray-50/50 rounded-t-md"> {/* Added track */}
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 transition-opacity bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                                    {new Date(session.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                </div>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(((session.totalScore || 0) / 30) * 100, 5)}%` }} // Normalized to 30 questions, min 5%
                                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                    className={`w-full max-w-[24px] rounded-t-sm ${(session.totalScore || 0) >= 20 ? 'bg-green-500' :
                                                        (session.totalScore || 0) >= 15 ? 'bg-blue-500' : 'bg-orange-400'
                                                        }`}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-600">{session.totalScore || 0}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
                                        Chưa có dữ liệu bài thi
                                    </div>
                                )}
                            </div>
                        </div>

                        <Link href="/progress">
                            <Button className="w-full bg-[#003366] hover:bg-[#002244] text-white">
                                Xem chi tiết tiến độ <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        )
    }

    // Default Mock Question for guests or new users
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative perspective-1000"
        >
            <div className="relative z-10 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)] border border-white/50 p-8 overflow-hidden transform-gpu hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

                <div className="relative mb-6">
                    <div className="flex justify-between items-start mb-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Thử Tài Actuary
                        </div>
                        <span className="text-xs font-semibold text-gray-400">Exam P • Probability</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight mt-3">
                        Tung một đồng xu cân đối 3 lần. Xác suất để có đúng 2 mặt ngửa là?
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-20">
                    {['1/8', '3/8', '1/2', '5/8'].map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedOption(idx)}
                            className={`
                        relative px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2
                        ${selectedOption === idx
                                    ? option === '3/8'
                                        ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                                        : 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                                    : 'bg-white border-transparent hover:border-blue-200 text-gray-600 hover:bg-blue-50'
                                }
                      `}
                        >
                            {option}
                            {selectedOption === idx && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {option === '3/8'
                                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        : <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center"><span className="text-red-600 text-[10px]">✕</span></div>
                                    }
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {selectedOption !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-6 text-sm font-medium p-4 rounded-xl flex items-center gap-3 ${selectedOption === 1 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                    >
                        {selectedOption === 1 ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">🥳</div>
                                <div>
                                    <p className="font-bold">Chính xác!</p>
                                    <p className="text-xs opacity-80">Số trường hợp: {`{HHN, HNH, NHH}`} = 3</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">🤔</div>
                                <div>
                                    <p className="font-bold">Chưa đúng rồi</p>
                                    <p className="text-xs opacity-80">Hãy thử liệt kê các trường hợp xem!</p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
