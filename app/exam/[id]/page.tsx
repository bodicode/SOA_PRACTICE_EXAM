'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { examService, Question } from '@/services/exam.service'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Clock, Flag, ChevronLeft, ChevronRight, Grid, ChevronDown, Check, Pause, Play } from 'lucide-react'
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
    const [isPaused, setIsPaused] = useState(false)

    // State persistence key
    const STORAGE_KEY = `exam_state_${categoryId}_${mode}`

    // Font Settings State
    const [fontSize, setFontSize] = useState(13)
    const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif')
    const [showFontSettings, setShowFontSettings] = useState(false)

    // Load Font Settings
    useEffect(() => {
        const savedFont = localStorage.getItem('exam_font_settings')
        if (savedFont) {
            try {
                const parsed = JSON.parse(savedFont)
                if (parsed.fontSize) setFontSize(parsed.fontSize)
                if (parsed.fontFamily) setFontFamily(parsed.fontFamily)
            } catch (e) {
                console.error("Failed to parse font settings", e)
            }
        }
    }, [])

    // Save Font Settings
    useEffect(() => {
        localStorage.setItem('exam_font_settings', JSON.stringify({ fontSize, fontFamily }))
    }, [fontSize, fontFamily])

    // Init Exam
    useEffect(() => {
        const initExam = async () => {
            if (isNaN(categoryId)) return

            // ... (rest of init code) ...
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
        if (isLoading || isSubmitted || timeLeft <= 0 || isPaused) return

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
        <div className="flex flex-col min-h-screen bg-white">
            {/* Top Bar - Sticky */}
            <header className="sticky top-0 h-16 bg-[#003366] text-white flex items-center justify-between px-6 shadow-md z-50 font-sans text-base">
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
                <div className="flex items-center gap-6 relative">
                    {/* Font Settings Button */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("text-white hover:bg-white/20 gap-2 px-3 border border-white/20", showFontSettings && "bg-white/20")}
                            onClick={() => setShowFontSettings(!showFontSettings)}
                            title="Cấu hình hiển thị"
                        >
                            <span className="font-serif text-lg font-bold">Aa</span>
                            <span className="hidden sm:inline font-sans text-sm font-normal">Cỡ chữ</span>
                            <ChevronDown className="w-3 h-3 opacity-70" />
                        </Button>

                        {showFontSettings && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-gray-800 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Size</div>
                                        <div className="flex items-center gap-2 bg-gray-100 rounded p-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 hover:bg-white hover:shadow-sm"
                                                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                                                disabled={fontSize <= 10}
                                            >
                                                A-
                                            </Button>
                                            <span className="text-sm font-medium w-8 text-center">{fontSize}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 hover:bg-white hover:shadow-sm"
                                                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                                                disabled={fontSize >= 24}
                                            >
                                                A+
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Font Style</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant={fontFamily === 'serif' ? 'secondary' : 'outline'}
                                                size="sm"
                                                className={cn("font-serif", fontFamily === 'serif' && "bg-blue-100 text-blue-800 border-blue-200 ring-1 ring-blue-300")}
                                                onClick={() => setFontFamily('serif')}
                                            >
                                                Serif
                                            </Button>
                                            <Button
                                                variant={fontFamily === 'sans' ? 'secondary' : 'outline'}
                                                size="sm"
                                                className={cn("font-sans", fontFamily === 'sans' && "bg-blue-100 text-blue-800 border-blue-200 ring-1 ring-blue-300")}
                                                onClick={() => setFontFamily('sans')}
                                            >
                                                Sans
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                {/* Click outside to close - Backdrop overlay if needed, or just detailed handler. For now simple toggle works if careful. */}
                            </div>
                        )}
                        {/* Overlay to close when clicking outside */}
                        {showFontSettings && (
                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowFontSettings(false)} />
                        )}
                    </div>

                    <div className={cn(
                        "flex items-center gap-2 font-mono text-xl font-bold px-4 py-1 rounded bg-black/20",
                        timeLeft < 300 && "text-red-300 animate-pulse"
                    )}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>

                    {mode === 'practice' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsPaused(!isPaused)}
                            className={cn(
                                "text-white hover:bg-white/20 h-auto py-1 px-2",
                                isPaused && "bg-yellow-500/20 text-yellow-200 animate-pulse"
                            )}
                            title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                        >
                            {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                        </Button>
                    )}

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
                {/* Left Sidebar - Sticky Navigation */}
                <aside className="sticky top-16 w-72 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col shadow-lg z-40 hidden lg:flex overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0 font-sans">
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                            <Grid className="w-4 h-4" /> Danh sách câu hỏi
                        </span>
                        <div className="text-xs text-gray-500">
                            {Object.keys(answers).length}/{questions.length} đã làm
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-sans">
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => {
                                        setCurrentQuestionIndex(idx);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className={cn(
                                        "w-8 h-8 font-medium flex items-center justify-center transition-all relative border",
                                        currentQuestionIndex === idx
                                            ? "ring-1 ring-offset-1 ring-[#003366] border-[#003366] bg-blue-50 text-[#003366]"
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
                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-700 space-y-3 shrink-0 font-sans">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-blue-600 border border-blue-600 shadow-sm"></div>
                            <span className="font-medium text-[12px]">Đã trả lời</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-white border border-gray-300 shadow-sm"></div>
                            <span className="font-medium text-[12px]">Chưa trả lời</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-blue-50 border border-blue-600 ring-1 ring-blue-100 shadow-sm"></div>
                            <span className="font-medium text-[12px]">Đang xem</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-500 shadow-sm"></div>
                            <span className="font-medium text-[12px]">Đã đánh dấu</span>
                        </div>
                    </div>
                </aside>

                {/* Main Question Area - Window Scroll */}
                <main
                    className="flex-1 p-6 md:p-10 flex flex-col w-full min-h-[calc(100vh-4rem)]"
                    style={{
                        fontFamily: fontFamily === 'serif' ? '"Times New Roman", Times, serif' : 'ui-sans-serif, system-ui, sans-serif',
                        fontSize: `${fontSize}px`
                    }}
                >

                    {isSubmitted && (
                        <div className="mb-6 bg-white p-6 rounded-lg shadow border border-blue-100 flex items-center justify-between font-sans">
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

                    <div className="flex justify-between items-start mb-2 border-b pb-1 border-gray-200">
                        <h2 className="text-[15px] font-bold text-gray-800">
                            Question {currentQuestionIndex + 1}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleFlag}
                                className={cn(
                                    "gap-2 h-7 text-xs font-sans",
                                    flagged[currentQuestion.id] && "bg-yellow-100 border-yellow-400 text-yellow-700"
                                )}
                            >
                                <Flag className={cn("w-3 h-3", flagged[currentQuestion.id] && "fill-current")} />
                                {flagged[currentQuestion.id] ? 'Flagged' : 'Flag'}
                            </Button>
                        </div>
                    </div>

                    <Card className="p-0 border-0 shadow-none flex flex-col mb-2 bg-transparent">
                        <div className="mb-1 leading-normal text-black">
                            {/* Question Text */}
                            <MathRender text={formatQuestionContent(currentQuestionIndex, currentQuestion.content ?? "")} />
                        </div>

                        <RadioGroup
                            key={currentQuestion.id}
                            value={answers[currentQuestion.id]?.toString() ?? ""}
                            onValueChange={(val) => handleAnswer(parseInt(val))}
                            className="space-y-0"
                        >
                            {currentQuestion.options.map((option, idx) => (
                                <div key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={cn(
                                        "flex items-start py-0.5 px-2 rounded transition-colors cursor-pointer hover:bg-gray-50 group",
                                        answers[currentQuestion.id] === idx && "bg-blue-50",
                                        isSubmitted && idx === currentQuestion.correctOption && "bg-green-100",
                                        isSubmitted && answers[currentQuestion.id] === idx && idx !== currentQuestion.correctOption && "bg-red-100"
                                    )}>
                                    <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} className="mt-0.5 border-gray-400 text-[#003366]" disabled={isSubmitted} />
                                    <Label htmlFor={`opt-${idx}`} className="flex-1 ml-2 cursor-pointer font-normal text-black group-hover:text-[#003366]">
                                        <MathRender text={option} />
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>

                        {isSubmitted && currentQuestion.explanation && (
                            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="font-bold text-green-800 mb-2 font-sans text-sm">Giải thích:</h4>
                                <div className="text-green-900">
                                    <MathRender text={currentQuestion.explanation ?? ""} />
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="flex justify-start mt-auto pt-4 pb-10 gap-2 font-sans border-t border-gray-200">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            disabled={currentQuestionIndex === 0}
                            className="w-10 h-10 p-0 rounded-full border-gray-300"
                            title="Previous Question"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                        <Button
                            className={cn("bg-[#003366] hover:bg-[#002244] w-10 h-10 p-0 rounded-full", currentQuestionIndex === questions.length - 1 && "bg-green-600 hover:bg-green-700")}
                            onClick={() => {
                                if (currentQuestionIndex === questions.length - 1) {
                                    setShowSubmitDialog(true);
                                } else {
                                    setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                            }}
                            title={currentQuestionIndex === questions.length - 1 ? "Nộp bài" : "Câu tiếp theo"}
                        >
                            {currentQuestionIndex === questions.length - 1 ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </Button>
                    </div>
                </main>
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
