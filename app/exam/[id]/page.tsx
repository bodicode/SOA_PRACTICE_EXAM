'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { examService, Question } from '@/services/exam.service'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Clock, Flag, ChevronLeft, ChevronRight, Grid } from 'lucide-react'
import { cn } from '@/lib/utils'
import MathRender from '@/components/MathRender'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function ExamPage() {
    // Hooks
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useUserStore()
    const shouldPersist = useRef(true)

    // Query Params
    const categoryId = parseInt(params.id as string)
    const mode = searchParams.get('mode') || 'practice'
    const limitParam = parseInt(searchParams.get('limit') || '0')
    const countParam = parseInt(searchParams.get('count') || '10')

    // State
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, number>>({}) // questionId -> optionIndex
    const [flagged, setFlagged] = useState<Record<string, boolean>>({}) // questionId -> boolean
    const [timeLeft, setTimeLeft] = useState<number>(0) // in seconds
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)

    // State persistence key
    const STORAGE_KEY = `exam_state_${categoryId}_${mode}`

    // Init Exam
    useEffect(() => {
        const initExam = async () => {
            if (isNaN(categoryId)) return

            // Try to load from local storage first
            const savedState = localStorage.getItem(STORAGE_KEY)
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState)
                    // Basic validation: ensure it's not expired (optional) or data is valid
                    if (parsed.questions?.length > 0 && !parsed.isSubmitted) {
                        setQuestions(parsed.questions)
                        setAnswers(parsed.answers || {})
                        setFlagged(parsed.flagged || {})
                        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0)
                        setTimeLeft(parsed.timeLeft || 0)
                        setIsLoading(false)
                        return // Skip fetching from API
                    }
                } catch (e) {
                    console.error("Failed to parse saved state", e)
                    localStorage.removeItem(STORAGE_KEY)
                }
            }

            try {
                let qCount = countParam
                let tLimit = limitParam * 60

                if (mode === 'exam') {
                    qCount = 30
                    tLimit = 180 * 60
                }

                setTimeLeft(tLimit)

                // Fetch questions
                const data = await examService.getQuestions({
                    categoryId: categoryId,
                    limit: qCount
                })
                setQuestions(data)
            } catch (error) {
                console.error('Failed to load exam', error)
            } finally {
                setIsLoading(false);
            }
        }
        initExam()
    }, [categoryId, mode, limitParam, countParam])

    // Save State
    useEffect(() => {
        if (!isLoading && questions.length > 0 && !isSubmitted && shouldPersist.current) {
            const state = {
                questions,
                answers,
                flagged,
                currentQuestionIndex,
                timeLeft,
                isSubmitted,
                timestamp: Date.now()
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        }
    }, [questions, answers, flagged, currentQuestionIndex, timeLeft, isSubmitted, isLoading])

    // Clear storage on unmount is NOT desired because we want to persist on reload.
    // We only clear on explicit exit or submit.

    // Timer Logic
    useEffect(() => {
        if (isLoading || isSubmitted || timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleSubmit() // Auto submit when time runs out
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isLoading, isSubmitted, timeLeft])

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const handleAnswer = (optionIndex: number) => {
        if (isSubmitted) return
        const qId = questions[currentQuestionIndex].id
        setAnswers(prev => ({ ...prev, [qId]: optionIndex }))
    }

    const toggleFlag = () => {
        const qId = questions[currentQuestionIndex].id
        setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }))
    }

    const handleSubmit = async () => {
        setShowSubmitDialog(false)
        setIsSaving(true);
        try {
            // Validate User
            let currentUserId = 0;
            if (user && user.id) {
                const parsedId = parseInt(user.id);
                if (!isNaN(parsedId)) {
                    currentUserId = parsedId;
                } else {
                    console.warn("User ID is not a number (likely UUID):", user.id);
                    // Attempt to use 1 as fallback or handle error?
                    // For now, let's alert if we can't identify the user
                    // alert("Không thể xác định tài khoản người dùng. Vui lòng tải lại trang.");
                    // return;
                }
            }

            if (currentUserId === 0) {
                // Try to fallback to '1' if we want to allow guest saves, BUT 
                // this might be risky if User 1 doesn't exist or is a real user.
                // Let's assume for now we NEED a valid user.
                console.error("No valid numeric user ID found");
            }

            const details = questions.map(q => {
                const userChoiceIdx = answers[q.id];
                const isCorrect = userChoiceIdx === q.correctOption;

                const detail: any = {
                    userChoice: userChoiceIdx?.toString(),
                    isCorrect: isCorrect
                };

                const idNum = Number(q.id);
                if (!isNaN(idNum)) {
                    detail.questionId = idNum;
                } else {
                    detail.pdfRegionQuestionId = q.id.toString();
                }
                return detail;
            });

            const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctOption ? 1 : 0), 0);

            const payload = {
                userId: currentUserId,
                mode: mode,
                score: score,
                totalQuestions: questions.length,
                startTime: new Date(Date.now() - (limitParam || 30) * 60000 + timeLeft * 1000).toISOString(),
                endTime: new Date().toISOString(),
                details: details
            };

            console.log("Submitting exam payload:", payload);

            const res = await fetch('/api/exam-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Server error: ${res.status}`);
            }

            shouldPersist.current = false // Stop saving
            localStorage.removeItem(STORAGE_KEY)
            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to save result", error);
            alert(`Lỗi khi lưu kết quả: ${error instanceof Error ? error.message : "Không xác định"}`);
            setIsSubmitted(true);
        } finally {
            setIsSaving(false);
        }
    }


    // Determine correctness for review
    const isCorrect = (q: Question) => {
        return answers[q.id] === q.correctOption
    }

    if (isLoading) return <div className="h-screen flex items-center justify-center">Đang tải đề thi...</div>
    if (questions.length === 0) return <div className="h-screen flex items-center justify-center">Không tìm thấy câu hỏi nào.</div>

    const currentQuestion = questions[currentQuestionIndex]

    const formatQuestionContent = (index: number, content: string) => {
        const trimmed = content.trim();
        return trimmed.replace(/^(\d+)\./, "$1\\.");
    };

    return (

        <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
            {/* Top Bar - Sticky */}
            <header className="sticky top-0 h-16 bg-[#003366] text-white flex items-center justify-between px-6 shadow-md z-50">
                <div className="font-bold text-lg flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2" onClick={() => {
                        if (isSubmitted || confirm("Bạn có chắc chắn muốn thoát? Kết quả sẽ không được lưu.")) {
                            shouldPersist.current = false
                            localStorage.removeItem(STORAGE_KEY)
                            router.push('/practice')
                        }
                    }}>
                        <ChevronLeft className="w-4 h-4" /> Thoát
                    </Button>
                    SOA Exam Simulator
                </div>
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "flex items-center gap-2 font-mono text-xl font-bold px-4 py-1 rounded bg-black/20",
                        timeLeft < 300 && "text-red-300 animate-pulse"
                    )}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white border-0"
                        onClick={() => setShowSubmitDialog(true)}
                        disabled={isSubmitted || isSaving}
                    >
                        {isSaving ? 'Đang lưu...' : 'Nộp Bài'}
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 items-start relative box-border">
                {/* Main Question Area - Window Scroll */}
                <main className="flex-1 p-6 md:p-10 flex flex-col w-full min-h-[calc(100vh-4rem)]">

                    {isSubmitted && (
                        <div className="mb-6 bg-white p-6 rounded-lg shadow border border-blue-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-[#003366]">Kết Quả Của Bạn</h3>
                                <p className="text-gray-600">Bạn đã hoàn thành bài thi.</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className="text-4xl font-bold text-blue-600">
                                    {questions.reduce((acc, q) => acc + (answers[q.id] === q.correctOption ? 1 : 0), 0)} / {questions.length}
                                </div>
                                <div className="text-sm font-medium text-gray-500">Câu trả lời đúng</div>
                                <div className="flex gap-2 mt-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                        shouldPersist.current = false
                                        localStorage.removeItem(STORAGE_KEY)
                                        window.location.reload()
                                    }}>
                                        Làm lại
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => router.push('/practice')}>
                                        Danh sách bài tập
                                    </Button>
                                    <Button size="sm" onClick={() => router.push('/progress')}>
                                        Xem tiến độ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            Câu hỏi {currentQuestionIndex + 1} / {questions.length}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleFlag}
                                className={cn(
                                    "gap-2",
                                    flagged[currentQuestion.id] && "bg-yellow-100 border-yellow-400 text-yellow-700"
                                )}
                            >
                                <Flag className={cn("w-4 h-4", flagged[currentQuestion.id] && "fill-current")} />
                                {flagged[currentQuestion.id] ? 'Đã đánh dấu' : 'Đánh dấu'}
                            </Button>
                        </div>
                    </div>

                    <Card className="p-8 shadow-sm flex flex-col mb-6">
                        <div className="text-lg mb-8 leading-relaxed">
                            <MathRender text={formatQuestionContent(currentQuestionIndex, currentQuestion.content ?? "")} />
                        </div>

                        <RadioGroup
                            key={currentQuestion.id}
                            value={answers[currentQuestion.id]?.toString() ?? ""}
                            onValueChange={(val) => handleAnswer(parseInt(val))}
                            className="space-y-4"
                        >
                            {currentQuestion.options.map((option, idx) => (
                                <div key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={cn(
                                        "flex items-start p-4 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50",
                                        answers[currentQuestion.id] === idx && "border-[#003366] bg-blue-50 ring-1 ring-blue-900",
                                        isSubmitted && idx === currentQuestion.correctOption && "bg-green-100 border-green-500",
                                        isSubmitted && answers[currentQuestion.id] === idx && idx !== currentQuestion.correctOption && "bg-red-100 border-red-500"
                                    )}>
                                    <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} className="mt-1" disabled={isSubmitted} />
                                    <Label htmlFor={`opt-${idx}`} className="flex-1 ml-3 cursor-pointer font-normal text-base">
                                        <MathRender text={option} />
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>

                        {isSubmitted && currentQuestion.explanation && (
                            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="font-bold text-green-800 mb-2">Giải thích:</h4>
                                <div className="text-green-900">
                                    <MathRender text={currentQuestion.explanation ?? ""} />
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="flex justify-between mt-auto pt-4 pb-10">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="w-32"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Trước
                        </Button>
                        <Button
                            className="bg-[#003366] hover:bg-[#002244] w-32"
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            disabled={currentQuestionIndex === questions.length - 1}
                        >
                            Sau <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </main>

                {/* Right Sidebar - Sticky Navigation */}
                <aside className="sticky top-16 w-72 h-[calc(100vh-4rem)] bg-white border-l border-gray-200 flex flex-col shadow-xl z-40 hidden lg:flex overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                            <Grid className="w-4 h-4" /> Danh sách câu hỏi
                        </span>
                        <div className="text-xs text-gray-500">
                            {Object.keys(answers).length}/{questions.length} đã làm
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => {
                                        setCurrentQuestionIndex(idx);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className={cn(
                                        "w-10 h-10 rounded-md text-sm font-medium flex items-center justify-center transition-all relative border",
                                        currentQuestionIndex === idx
                                            ? "ring-2 ring-offset-1 ring-[#003366] border-[#003366] bg-blue-50 text-[#003366]"
                                            : "border-gray-200 hover:bg-gray-50 text-gray-600",
                                        answers[q.id] !== undefined && currentQuestionIndex !== idx && !flagged[q.id] && "bg-blue-600 text-white border-blue-600",
                                        flagged[q.id] && "bg-yellow-400 border-yellow-500 text-yellow-900 font-bold"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-700 space-y-3 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded bg-blue-600 border border-blue-600 shadow-sm"></div>
                            <span className="font-medium">Đã trả lời</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded bg-white border border-gray-300 shadow-sm"></div>
                            <span className="font-medium">Chưa trả lời</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded bg-blue-50 border border-blue-600 ring-2 ring-blue-100 shadow-sm"></div>
                            <span className="font-medium">Đang xem</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded bg-yellow-400 border border-yellow-500 shadow-sm"></div>
                            <span className="font-medium">Đã đánh dấu</span>
                        </div>
                    </div>
                </aside>
            </div>

            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận nộp bài</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn nộp bài không? Hành động này không thể hoàn tác.
                            <br />
                            Bạn đã làm {Object.keys(answers).length}/{questions.length} câu hỏi.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Hủy</Button>
                        <Button className="bg-[#003366]" onClick={handleSubmit}>Nộp Bài</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
