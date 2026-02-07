'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { examService, Question } from '@/services/exam.service'
import { useUserStore } from '@/stores/userStore'
import { useProgressStore } from '@/stores/progressStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Clock, Flag, ChevronLeft, ChevronRight, Grid, ChevronDown, Check, Pause, Play, Highlighter, Trash2, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import Lottie from 'lottie-react'

const MathRender = dynamic(() => import('@/components/MathRender'), { ssr: false })

// Simple mascot loading component
const MascotLoading = () => {
    const [animationData, setAnimationData] = useState<any>(null)
    useEffect(() => {
        fetch('/mascot.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error(err))
    }, [])
    if (!animationData) return <div className="w-32 h-32 bg-purple-200 rounded-full animate-pulse" />
    return <Lottie animationData={animationData} loop autoplay className="w-full h-full" />
}

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
    const t = useTranslations('examRunner')
    const { setTheme } = useTheme()

    // Force light theme
    useEffect(() => {
        setTheme('light')
    }, [setTheme])

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
    const startParam = searchParams.get('start') ? parseInt(searchParams.get('start')!) : undefined
    const endParam = searchParams.get('end') ? parseInt(searchParams.get('end')!) : undefined

    // State
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [flagged, setFlagged] = useState<Record<string, boolean>>({})
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [showClearHighlightDialog, setShowClearHighlightDialog] = useState(false)
    const [showExitDialog, setShowExitDialog] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [showReferenceSheet, setShowReferenceSheet] = useState(false)

    // Highlighting State
    const [highlights, setHighlights] = useState<Record<string, { text: string, index: number }[]>>({}) // questionId -> array of highlight objects
    const [isHighlightMode, setIsHighlightMode] = useState(false)

    // Pagination State
    const [seed] = useState<number>(Date.now());
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [examStartTime, setExamStartTime] = useState<string | null>(null);

    // AI Analysis State
    const [analysis, setAnalysis] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [sessionId, setSessionId] = useState<number | null>(null)

    const handleHighlight = () => {
        if (!isHighlightMode) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const text = selection.toString().trim();
        if (!text) return;

        let container = selection.anchorNode?.parentElement;
        while (container && !container.classList.contains('prose')) {
            container = container.parentElement;
        }

        let index = 0;
        if (container) {
            const range = selection.getRangeAt(0);
            const preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(container);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);

            const preText = preSelectionRange.toString();
            const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedText, 'gi');
            const matches = preText.match(regex);
            index = matches ? matches.length : 0;
        }

        const qId = questions[currentQuestionIndex].id;
        setHighlights(prev => {
            const currentHighlights = prev[qId] || [];
            if (currentHighlights.some(h => h.text === text && h.index === index)) return prev;
            return { ...prev, [qId]: [...currentHighlights, { text, index }] };
        });

        selection.removeAllRanges();
    };
    const STORAGE_KEY = `exam_state_${categoryId}_${mode}`

    const [fontSize, setFontSize] = useState(13)
    const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif')
    const [showFontSettings, setShowFontSettings] = useState(false)

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

    useEffect(() => {
        localStorage.setItem('exam_font_settings', JSON.stringify({ fontSize, fontFamily }))
    }, [fontSize, fontFamily])
    useEffect(() => {
        const initExam = async () => {
            if (isNaN(categoryId)) return
            const savedState = localStorage.getItem(STORAGE_KEY)
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState)
                    // Restore state for both in-progress AND submitted exams
                    if (parsed.questions?.length > 0) {
                        setQuestions(parsed.questions)
                        setAnswers(parsed.answers || {})
                        setFlagged(parsed.flagged || {})
                        setIsSubmitted(parsed.isSubmitted || false)
                        setExamStartTime(parsed.examStartTime || new Date().toISOString())

                        // Restore AI analysis state
                        if (parsed.sessionId) setSessionId(parsed.sessionId)
                        if (parsed.analysis) setAnalysis(parsed.analysis)

                        let defaultTotal = countParam;
                        if (mode === 'exam') defaultTotal = 30;
                        setTotalQuestions(parsed.totalQuestions || defaultTotal)
                        if (categoryId === 1 && !parsed.isSubmitted) {
                            setShowReferenceSheet(true);
                        }
                        if (parsed.highlights) {
                            const valid = Object.values(parsed.highlights).every((arr: any) =>
                                Array.isArray(arr) && arr.every(item => typeof item === 'object' && item.text !== undefined)
                            );
                            if (valid) {
                                setHighlights(parsed.highlights)
                            } else {
                                setHighlights({})
                            }
                        }

                        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0)
                        setTimeLeft(parsed.timeLeft || 0)
                        setIsLoading(false)
                        return
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

                setTotalQuestions(qCount)
                setTimeLeft(tLimit)
                setExamStartTime(new Date().toISOString()) // Set initial start time

                const BATCH_SIZE = 50;
                const { questions: data, total: apiTotal } = await examService.getQuestions({
                    categoryId: categoryId,
                    limit: Math.min(qCount, BATCH_SIZE),
                    start: startParam,
                    end: endParam,
                    seed: seed,
                    page: 1
                })

                setQuestions(data)
            } catch (error) {
                console.error('Failed to load exam', error)
            } finally {
                setIsLoading(false);
            }
        }
        initExam()
    }, [categoryId, mode, limitParam, countParam, startParam, endParam, seed])

    useEffect(() => {
        if (!isLoading && questions.length > 0 && shouldPersist.current) {
            const state = {
                questions,
                answers,
                flagged,
                currentQuestionIndex,
                timeLeft,
                isSubmitted,
                totalQuestions,
                highlights,
                examStartTime,
                sessionId,
                analysis,
                timestamp: Date.now()
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        }
    }, [questions, answers, flagged, currentQuestionIndex, timeLeft, isSubmitted, isLoading, highlights, totalQuestions, examStartTime, sessionId, analysis])

    useEffect(() => {
        if (isLoading || isSubmitted || timeLeft <= 0 || isPaused) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleSubmit()
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
            let currentUserId = 1;
            let userIdSource = "default";

            if (user && user.id) {
                const parsedId = parseInt(user.id);
                if (!isNaN(parsedId) && parsedId > 0) {
                    currentUserId = parsedId;
                    userIdSource = "store";
                }
            }

            if (userIdSource === "default" && typeof window !== 'undefined') {
                try {
                    const storedUser = localStorage.getItem('user-storage');
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        const storageUser = parsed.state?.user;
                        if (storageUser && storageUser.id) {
                            const parsedId = parseInt(storageUser.id);
                            if (!isNaN(parsedId) && parsedId > 0) {
                                currentUserId = parsedId;
                                userIdSource = "localStorage";
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse user-storage", e);
                }
            }

            if (currentUserId === 1) {
                console.warn("Using Guest User ID (1) for submission.");
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

            // Fallback if examStartTime is missing for some reason
            const calculatedStartTime = new Date(Date.now() - (mode === 'exam' ? 180 : (limitParam || 30)) * 60000 + timeLeft * 1000).toISOString();
            const finalStartTime = examStartTime || calculatedStartTime;

            const payload = {
                userId: currentUserId,
                mode: mode,
                categoryId: isNaN(categoryId) ? null : categoryId,
                score: score,
                totalQuestions: totalQuestions,
                startTime: finalStartTime,
                endTime: new Date().toISOString(),
                details: details
            };

            const res = await fetch('/api/exam-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Server error: ${res.status}`);
            }

            const data = await res.json();
            if (data.sessionId) {
                setSessionId(data.sessionId);
            }

            // Don't clear localStorage - keep state for reload
            // shouldPersist.current = false
            // localStorage.removeItem(STORAGE_KEY)
            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to save result", error);
            alert(`${t('error.save')}: ${error instanceof Error ? error.message : "Unkown"}`);
            setIsSubmitted(true);
        } finally {
            setIsSaving(false);
        }
    }

    const handleExitClick = () => {
        if (isSubmitted) {
            confirmExit();
        } else {
            setShowExitDialog(true);
        }
    }

    const handleAnalyze = async () => {
        if (!sessionId) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/ai/analyze-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
            const data = await res.json();
            if (data.analysis) {
                setAnalysis(data.analysis);
            }
        } catch (error) {
            console.error("Failed to analyze", error);
        } finally {
            setIsAnalyzing(false);
        }
    }

    const confirmExit = () => {
        shouldPersist.current = false
        localStorage.removeItem(STORAGE_KEY)
        router.push('/practice')
    }

    const clearHighlights = () => {
        setShowClearHighlightDialog(true);
    }

    const confirmClearHighlights = () => {
        const qId = questions[currentQuestionIndex].id;
        setHighlights(prev => {
            const newHighlights = { ...prev };
            delete newHighlights[qId];
            return newHighlights;
        });
        setShowClearHighlightDialog(false);
    }

    const applyHighlights = (content: string) => {
        const qId = questions[currentQuestionIndex].id;
        const currentHighlights = highlights[qId];
        if (!currentHighlights || currentHighlights.length === 0) return content;
        const ranges: { start: number, end: number }[] = [];
        currentHighlights.forEach(({ text, index }) => {
            const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedText})`, 'gi');
            let match;
            let matchIndex = 0;
            while ((match = regex.exec(content)) !== null) {
                if (matchIndex === index) {
                    ranges.push({ start: match.index, end: match.index + match[0].length });
                    break;
                }
                matchIndex++;
            }
        });
        if (ranges.length === 0) return content;
        // Step 2: Merge overlapping ranges
        ranges.sort((a, b) => a.start - b.start);
        const mergedRanges: { start: number, end: number }[] = [];
        let currentRange = ranges[0];
        for (let i = 1; i < ranges.length; i++) {
            const nextRange = ranges[i];
            if (nextRange.start <= currentRange.end) {
                currentRange.end = Math.max(currentRange.end, nextRange.end);
            } else {
                mergedRanges.push(currentRange);
                currentRange = nextRange;
            }
        }
        mergedRanges.push(currentRange);
        let result = '';
        let lastIndex = 0;
        mergedRanges.forEach(range => {
            result += content.substring(lastIndex, range.start);
            result += `<mark class="bg-yellow-200 rounded-sm px-0.5 text-black">${content.substring(range.start, range.end)}</mark>`;
            lastIndex = range.end;
        });
        result += content.substring(lastIndex);
        return result;
    };

    const isCorrect = (q: Question) => {
        return answers[q.id] === q.correctOption
    }

    if (isLoading) return <div className="h-screen flex items-center justify-center">{t('loading')}</div>
    if (questions.length === 0) return <div className="h-screen flex items-center justify-center">{t('noQuestions')}</div>

    const fetchPageForIndex = async (index: number) => {
        if (questions[index]) return true; // Already loaded

        setLoadingMore(true);
        try {
            const BATCH_SIZE = 50;
            const page = Math.floor(index / BATCH_SIZE) + 1;

            const { questions: newQuestions } = await examService.getQuestions({
                categoryId: categoryId,
                limit: BATCH_SIZE,
                start: startParam,
                end: endParam,
                seed: seed,
                page: page
            });

            if (newQuestions && newQuestions.length > 0) {
                setQuestions(prev => {
                    const updated = [...prev];
                    // Sparse fill
                    const startIdx = (page - 1) * BATCH_SIZE;
                    newQuestions.forEach((q, i) => {
                        updated[startIdx + i] = q;
                    });
                    return updated;
                });
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to fetch more questions", e);
            return false;
        } finally {
            setLoadingMore(false);
        }
    }

    const handleJumpToQuestion = async (index: number) => {
        if (index < 0 || index >= totalQuestions) return;

        const success = await fetchPageForIndex(index);
        if (success || questions[index]) { // Ensure it exists after fetch
            setCurrentQuestionIndex(index);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Check next/prev handlers to use this too
    const handleNext = () => handleJumpToQuestion(currentQuestionIndex + 1);
    const handlePrev = () => handleJumpToQuestion(currentQuestionIndex - 1);

    const currentQuestion = questions[currentQuestionIndex]

    const formatQuestionContent = (index: number, content: string) => {
        const trimmed = content?.trim() || "";
        // Remove leading number and dot (e.g. "82. ")
        return trimmed.replace(/^\d+\.\s*/, "");
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Top Bar - Sticky */}
            <header className="sticky top-0 h-16 bg-[#003366] text-white flex items-center justify-between px-6 shadow-md z-50 font-sans text-base">
                <div className="font-bold text-lg flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2" onClick={handleExitClick}>
                        <ChevronLeft className="w-4 h-4" /> {t('header.exit')}
                    </Button>
                    {t('header.title')}
                </div>
                <div className="flex items-center gap-6 relative">
                    {/* Font Settings Button */}
                    <div className="relative">

                        {categoryId === 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("text-white hover:bg-white/20 gap-2 px-3 border border-white/20", showReferenceSheet && "bg-white/20")}
                                onClick={() => setShowReferenceSheet(!showReferenceSheet)}
                                title={t('header.reference')}
                            >
                                <FileText className="w-4 h-4" />
                                <span className="hidden md:inline font-sans text-sm">{t('header.referenceShort')}</span>
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("text-white hover:bg-white/20 gap-2 px-3 border border-white/20", showFontSettings && "bg-white/20")}
                            onClick={() => setShowFontSettings(!showFontSettings)}
                            title={t('header.settings')}
                        >
                            <span className="font-serif text-lg font-bold">Aa</span>
                            <span className="hidden sm:inline font-sans text-sm font-normal">{t('header.size')}</span>
                            <ChevronDown className="w-3 h-3 opacity-70" />
                        </Button>

                        {showFontSettings && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-gray-800 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{t('header.size')}</div>
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
                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{t('header.font')}</div>
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
                            title={isPaused ? t('header.play') : t('header.pause')}
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
                        {isSaving ? t('header.saving') : t('header.submit')}
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 items-start relative box-border">
                {/* Left Sidebar - Sticky Navigation */}
                <aside className="sticky top-16 w-72 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col shadow-lg z-40 hidden lg:flex overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0 font-sans">
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                            <Grid className="w-4 h-4" /> {t('sidebar.title')}
                        </span>
                        <div className="text-xs text-gray-500">
                            {Object.keys(answers).length}/{totalQuestions} {t('sidebar.done')}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-sans">
                        <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: totalQuestions }).map((_, idx) => {
                                const q = questions[idx];
                                const isLoaded = !!q;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleJumpToQuestion(idx)}
                                        disabled={loadingMore && !isLoaded}
                                        className={cn(
                                            "w-8 h-8 font-medium flex items-center justify-center transition-all relative border",
                                            currentQuestionIndex === idx
                                                ? "ring-1 ring-offset-1 ring-[#003366] border-[#003366] bg-blue-50 text-[#003366]"
                                                : "border-gray-200 hover:bg-gray-50 text-gray-600",
                                            isLoaded && answers[q.id] !== undefined && currentQuestionIndex !== idx && !flagged[q.id] && "bg-blue-600 text-white border-blue-600",
                                            isLoaded && flagged[q.id] && "bg-yellow-400 border-yellow-500 text-yellow-900 font-bold",
                                            !isLoaded && "border-dashed bg-gray-50 text-gray-400"
                                        )}
                                    >
                                        {isLoaded ? idx + 1 : (loadingMore && idx === currentQuestionIndex ? "..." : idx + 1)}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-700 space-y-3 shrink-0 font-sans">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-blue-600 border border-blue-600 shadow-sm"></div>
                            <span className="font-medium text-[12px]">{t('sidebar.answered')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-white border border-gray-300 shadow-sm"></div>
                            <span className="font-medium text-[12px]">{t('sidebar.unanswered')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-blue-50 border border-blue-600 ring-1 ring-blue-100 shadow-sm"></div>
                            <span className="font-medium text-[12px]">{t('sidebar.viewing')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-500 shadow-sm"></div>
                            <span className="font-medium text-[12px]">{t('sidebar.flagged')}</span>
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
                                <h3 className="text-2xl font-bold text-[#003366]">{t('results.title')}</h3>
                                <p className="text-gray-600">{t('results.desc')}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className="text-4xl font-bold text-blue-600">
                                    {questions.reduce((acc, q) => acc + (answers[q.id] === q.correctOption ? 1 : 0), 0)} / {totalQuestions}
                                </div>
                                <div className="text-sm font-medium text-gray-500">{t('results.correct')}</div>
                                <div className="flex gap-2 mt-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                        shouldPersist.current = false
                                        localStorage.removeItem(STORAGE_KEY)
                                        window.location.reload()
                                    }}>
                                        {t('results.retry')}
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => router.push('/practice')}>
                                        {t('results.list')}
                                    </Button>
                                    <Button size="sm" onClick={() => router.push('/progress')}>
                                        {t('results.progress')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !!analysis || !sessionId}
                                        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {isAnalyzing ? "Analyzing..." : "Analyze Mistakes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="mb-6 bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-lg border border-purple-200 flex flex-col items-center justify-center gap-4 animate-in fade-in">
                            <div className="w-32 h-32">
                                <MascotLoading />
                            </div>
                            <div className="text-center">
                                <p className="text-purple-800 font-semibold text-lg">
                                    AI đang phân tích bài thi...
                                </p>
                                <p className="text-purple-600 text-sm mt-1">
                                    Vui lòng chờ trong giây lát 🤖
                                </p>
                            </div>
                        </div>
                    )}

                    {analysis && (
                        <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-purple-100 animate-in fade-in slide-in-from-top-4">
                            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                AI Analysis
                            </h3>
                            <div className="prose prose-slate max-w-none text-gray-800 bg-purple-50/50 p-4 rounded-md">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{analysis}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-2 border-b pb-1 border-gray-200">
                        <h2 className="text-[15px] font-bold text-gray-800">
                            {t('question.label')} {currentQuestionIndex + 1}
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-gray-100 rounded-md p-0.5 border border-gray-200 mr-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsHighlightMode(!isHighlightMode)}
                                    className={cn(
                                        "h-7 px-2 text-xs font-sans gap-2 transition-colors",
                                        isHighlightMode ? "bg-yellow-200 text-yellow-800 hover:bg-yellow-300" : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                                    )}
                                    title={t('question.highlightTooltip')}
                                >
                                    <Highlighter className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{t('question.highlight')}</span>
                                </Button>
                                {highlights[currentQuestion.id]?.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearHighlights}
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        title={t('question.clearTooltip')}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>

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
                                {flagged[currentQuestion.id] ? t('question.flagged') : t('question.flag')}
                            </Button>
                        </div>
                    </div>

                    <Card className="p-0 border-0 shadow-none flex flex-col mb-2 bg-transparent">
                        <div className="mb-1 leading-normal text-black">
                            {/* Question Text */}
                            <div onMouseUp={handleHighlight}>
                                {(currentQuestion as any).imageUrl && (
                                    <div className="mb-4 flex justify-center">
                                        <Image
                                            src={(currentQuestion as any).imageUrl}
                                            alt={`Question ${currentQuestionIndex + 1} Image`}
                                            width={600}
                                            height={400}
                                            className="rounded-lg border border-gray-200 object-contain max-h-[400px]"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                                <MathRender text={formatQuestionContent(currentQuestionIndex, applyHighlights(currentQuestion.content ?? ""))} />
                            </div>
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
                                <h4 className="font-bold text-green-800 mb-2 font-sans text-sm">{t('question.explanation')}</h4>
                                <div className="text-green-900">
                                    <MathRender text={currentQuestion.explanation ?? ""} />
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="flex justify-start mt-auto pt-4 pb-10 gap-2 font-sans border-t border-gray-200">
                        <Button
                            variant="outline"
                            onClick={handlePrev}
                            disabled={currentQuestionIndex === 0 || loadingMore}
                            className="w-10 h-10 p-0 rounded-full border-gray-300"
                            title={t('nav.prev')}
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                        <Button
                            className={cn("bg-[#003366] hover:bg-[#002244] w-10 h-10 p-0 rounded-full", currentQuestionIndex === totalQuestions - 1 && "bg-green-600 hover:bg-green-700")}
                            onClick={() => {
                                if (currentQuestionIndex === totalQuestions - 1) {
                                    setShowSubmitDialog(true);
                                } else {
                                    handleNext();
                                }
                            }}
                            disabled={loadingMore}
                            title={currentQuestionIndex === totalQuestions - 1 ? t('nav.submit') : t('nav.next')}
                        >
                            {currentQuestionIndex === totalQuestions - 1 ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </Button>
                    </div>
                </main>
            </div>

            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialog.submitTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('dialog.submitDesc')}
                            <br />
                            {t('dialog.submitStat')} {Object.keys(answers).length}/{totalQuestions} {t('sidebar.done').toLowerCase()}.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>{t('dialog.cancel')}</Button>
                        <Button className="bg-[#003366]" onClick={handleSubmit}>{t('dialog.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showClearHighlightDialog} onOpenChange={setShowClearHighlightDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialog.clearHighlightTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('dialog.clearHighlightDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowClearHighlightDialog(false)}>{t('dialog.cancel')}</Button>
                        <Button variant="destructive" onClick={confirmClearHighlights}>{t('dialog.delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showReferenceSheet} onOpenChange={setShowReferenceSheet}>
                <DialogContent className="w-[98vw] max-w-[98vw] h-[98vh] flex flex-col p-0 overflow-hidden sm:max-w-[98vw]">
                    <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b shrink-0">
                        <div className="flex flex-col">
                            <DialogTitle>{t('dialog.referenceTitle')}</DialogTitle>
                            <DialogDescription>{t('dialog.referenceDesc')}</DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-start justify-center">
                        <a href="/bang-exam-p.jpg" target="_blank" rel="noopener noreferrer" className="cursor-pointer" title="Click để mở trong tab mới">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/bang-exam-p.jpg"
                                alt="Exam P Reference Table"
                                className="max-w-4xl w-full h-auto shadow-lg border rounded bg-white hover:opacity-95 transition-opacity"
                            />
                        </a>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialog.exitTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('dialog.exitDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExitDialog(false)}>{t('dialog.cancel')}</Button>
                        <Button variant="destructive" onClick={confirmExit}>{t('dialog.exitConfirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
