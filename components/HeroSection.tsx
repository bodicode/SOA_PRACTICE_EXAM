'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/userStore'
import { CheckCircle2, TrendingUp, Target, Trophy, ArrowRight, BarChart2, Sigma, Pi, Divide, Percent, FunctionSquare, Binary } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UserStats {
    totalExams: number
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

    // Mock Question State
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [timerKey, setTimerKey] = useState(0)

    const questions = [
        {
            category: "Exam P • Probability",
            question: "Tung một đồng xu cân đối 3 lần. Xác suất để có đúng 2 mặt ngửa là?",
            options: ['1/8', '3/8', '1/2', '5/8'],
            correctIndex: 1,
            explanation: {
                correct: "Các trường hợp (N=Ngửa, S=Sấp): {NNS, NSN, SNN} = 3",
                incorrect: "Hãy thử liệt kê các trường hợp xem!"
            }
        },
        {
            category: "Exam FM • Financial Math",
            question: "Một khoản đầu tư tăng gấp đôi sau 10 năm. Lãi suất kép hàng năm là bao nhiêu?",
            options: ['6.9%', '7.2%', '10%', '14.4%'],
            correctIndex: 1, // Approx 7.2% using Rule of 72 or exact calculation
            explanation: {
                correct: "(1+i)^10 = 2 => i = 2^(1/10) - 1 ≈ 7.18%",
                incorrect: "Gợi ý: Sử dụng công thức (1+i)^10 = 2"
            }
        },
        {
            category: "Exam IFM • Investment",
            question: "Quyền chọn nào cho phép người mua bán tài sản cơ sở tại một mức giá định trước?",
            options: ['Call Option', 'Put Option', 'Forward', 'Future'],
            correctIndex: 1,
            explanation: {
                correct: "Put Option (Quyền chọn bán) cho phép bán tại giá thực hiện.",
                incorrect: "Call là quyền mua. Hãy nghĩ về 'Put' = Đặt bán."
            }
        }
    ]

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

    useEffect(() => {
        // Only run timer if not showing stats and logic permits
        // Auto-advance even if hovering, only stop if user has selected an option (to read result)
        const showingStats = user && stats && stats.totalExams > 0
        if (selectedOption === null && !showingStats) {
            const timer = setTimeout(() => {
                setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
                setTimerKey(prev => prev + 1)
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [currentQuestionIndex, selectedOption, user, stats, questions.length])

    const currentQuestion = questions[currentQuestionIndex]

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
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-6">
                            {/* Streak Card */}
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2 text-orange-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{stats.studyStreak}</div>
                                <div className="text-xs text-gray-500 font-medium">Ngày liên tiếp</div>
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
            className="relative perspective-1000 h-[600px] flex items-center justify-center -mt-10" // Added height and alignment
        >
            {questions.map((question, index) => {
                const offset = (index - currentQuestionIndex + questions.length) % questions.length;
                const isFront = offset === 0;
                const isHidden = offset > 2; // Hide if more than 3 cards in stack

                return (
                    <motion.div
                        key={index}
                        layout
                        initial={false}
                        animate={{
                            scale: isFront ? 1 : 0.9 + offset * 0.04, // Smoother scale
                            y: isFront ? [null, -120, 0] : offset * 12, // Reduced jump height for natural feel
                            rotateX: isFront ? 0 : 0, // Simplified rotation
                            zIndex: isFront ? 100 : questions.length - offset,
                            opacity: isFront ? 1 : 1 - offset * 0.2
                        }}
                        transition={{
                            layout: { type: "spring", stiffness: 300, damping: 30 }, // Smooth resizing
                            y: { duration: 0.8, ease: "easeInOut", times: [0, 0.5, 1] }, // Keyframe jump needs duration, not spring
                            default: { type: "spring", stiffness: 200, damping: 20 }
                        }}
                        className={`absolute w-full max-w-2xl mx-auto will-change-transform
                            ${isFront ? 'pointer-events-auto' : 'pointer-events-none'}
                        `}
                        style={{
                            transformOrigin: "bottom center"
                        }}
                    >
                        <div className="relative z-10 bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(30,58,138,0.2)] border border-white/60 p-8 overflow-hidden">
                            {/* Dynamic Gradient Border Top */}
                            <div className={`absolute inset-x-0 top-0 h-1.5 transition-colors duration-500 bg-gradient-to-r ${selectedOption !== null && isFront
                                ? selectedOption === question.correctIndex
                                    ? "from-green-400 via-emerald-500 to-green-400"
                                    : "from-red-400 via-rose-500 to-red-400"
                                : "from-blue-500 via-indigo-500 to-blue-500"
                                }`} />

                            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

                            <div className="relative mb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                        Thử Tài Actuary
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{question.category}</span>
                                </div>
                                <h3 className="text-xl lg:text-2xl font-bold text-slate-800 leading-snug min-h-[64px]">
                                    {question.question}
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3 relative z-20">
                                {question.options.map((option, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={isFront ? { scale: 1.02, y: -2 } : {}}
                                        whileTap={isFront ? { scale: 0.98 } : {}}
                                        onClick={() => isFront && setSelectedOption(idx)}
                                        className={`
                                        relative px-4 py-4 rounded-2xl text-sm font-bold transition-all duration-200 border-2 shadow-sm
                                        ${selectedOption === idx && isFront
                                                ? idx === question.correctIndex
                                                    ? 'bg-green-50 border-green-500 text-green-700 shadow-green-100 ring-2 ring-green-200 ring-offset-1'
                                                    : 'bg-red-50 border-red-500 text-red-700 shadow-red-100 ring-2 ring-red-200 ring-offset-1'
                                                : 'bg-white border-slate-100 hover:border-blue-300 text-slate-600 hover:bg-blue-50 hover:shadow-md'
                                            }
                                    `}
                                    >
                                        {option}
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {selectedOption === idx && isFront && (
                                                idx === question.correctIndex
                                                    ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="w-5 h-5 text-green-600" /></motion.div>
                                                    : <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center"><span className="text-red-600 text-xs font-black">✕</span></div></motion.div>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            <AnimatePresence>
                                {selectedOption !== null && isFront && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: 10 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: 10 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="overflow-hidden"
                                    >
                                        <div className={`mt-6 text-sm font-medium p-5 rounded-2xl flex items-center gap-4 border ${selectedOption === question.correctIndex
                                            ? 'bg-green-50/80 border-green-200 text-green-900 shadow-[0_4px_20px_-5px_rgba(22,163,74,0.15)]'
                                            : 'bg-red-50/80 border-red-200 text-red-900 shadow-[0_4px_20px_-5px_rgba(220,38,38,0.15)]'
                                            }`}>
                                            {selectedOption === question.correctIndex ? (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-lg shrink-0 scale-110">🥳</div>
                                                    <div>
                                                        <p className="font-bold text-base">Chính xác!</p>
                                                        <p className="text-xs opacity-90 mt-0.5 font-medium">{question.explanation.correct}</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="ml-auto text-xs bg-green-200 text-green-800 hover:bg-green-300 border-0 rounded-xl"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedOption(null)
                                                            setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
                                                            setTimerKey(prev => prev + 1)
                                                        }}
                                                    >
                                                        Câu tiếp <ArrowRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-lg shrink-0 scale-110">🤔</div>
                                                    <div>
                                                        <p className="font-bold text-base">Chưa đúng rồi</p>
                                                        <p className="text-xs opacity-90 mt-0.5 font-medium">{question.explanation.incorrect}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Progress Indicators & Timer */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 flex">
                                {/* Timer Bar - Only shows when not answered and not paused */}
                                {selectedOption === null && isFront && (
                                    <motion.div
                                        key={`timer-${timerKey}`} // Re-render to restart animation
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 4, ease: "linear" }}
                                        className="bg-blue-500 h-full origin-left absolute top-0 left-0 z-10"
                                    />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </motion.div>
    )
}
