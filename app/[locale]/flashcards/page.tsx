'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Shuffle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FlashCard from '@/components/FlashCard'
import { useTranslations } from 'next-intl'

interface FormulaCardData {
    id: number
    name: string
    category: string
    formula: string
    explanation?: string
    example?: string
    difficulty: number
}

export default function FlashcardsPage() {
    const t = useTranslations('flashcards')

    const [allCards, setAllCards] = useState<FormulaCardData[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [activeCategory, setActiveCategory] = useState('all')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch all flashcards once on mount
    useEffect(() => {
        const fetchCards = async () => {
            try {
                const res = await fetch('/api/flashcards?category=all')
                const data = await res.json()
                setAllCards(data.cards || [])
                setCategories(data.categories || [])
            } catch (error) {
                console.error('Failed to fetch flashcards:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCards()
    }, [])

    // Filter cards by category (client-side)
    const cards = activeCategory === 'all'
        ? allCards
        : allCards.filter(c => c.category === activeCategory)

    // Reset index when category changes
    useEffect(() => {
        setCurrentIndex(0)
        setIsFlipped(false)
    }, [activeCategory])

    const currentCard = cards[currentIndex]

    // Navigation
    const goToNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setIsFlipped(false)
        }
    }

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            setIsFlipped(false)
        }
    }

    const shuffleCards = () => {
        const shuffled = [...allCards].sort(() => Math.random() - 0.5)
        setAllCards(shuffled)
        setCurrentIndex(0)
        setIsFlipped(false)
    }

    const resetDeck = () => {
        setCurrentIndex(0)
        setIsFlipped(false)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-6 md:p-10">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <div className="h-9 w-64 bg-muted rounded-lg animate-pulse mb-2" />
                        <div className="h-5 w-96 bg-muted/60 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-9 w-20 bg-muted rounded-lg animate-pulse" />
                        ))}
                    </div>
                    <div className="w-full max-w-lg mx-auto aspect-4/3 rounded-2xl bg-muted animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-primary" />
                        {t('title') || 'Formula Flashcards'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('subtitle') || 'Master Exam P formulas'}
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="mb-6">
                    <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted">
                            <TabsTrigger value="all" className="data-[state=active]:bg-card">
                                {t('all') || 'All'}
                            </TabsTrigger>
                            {categories.map(cat => (
                                <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-card">
                                    {cat}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Flashcard */}
                {currentCard ? (
                    <div className="mb-6">
                        <FlashCard
                            name={currentCard.name}
                            formula={currentCard.formula}
                            explanation={currentCard.explanation}
                            example={currentCard.example}
                            difficulty={currentCard.difficulty}
                            isFlipped={isFlipped}
                            onFlip={() => setIsFlipped(!isFlipped)}
                        />
                    </div>
                ) : (
                    <div className="p-12 text-center rounded-2xl border border-border bg-card">
                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            {t('noCards') || 'No flashcards available'}
                        </h3>
                        <p className="text-muted-foreground">
                            {t('noCardsHint') || 'Try selecting a different category'}
                        </p>
                    </div>
                )}

                {/* Navigation */}
                {cards.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={shuffleCards}
                                title={t('shuffle') || 'Shuffle'}
                            >
                                <Shuffle className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={resetDeck}
                                title={t('reset') || 'Reset'}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={goToPrev}
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <span className="text-sm font-medium text-muted-foreground min-w-[60px] text-center">
                                {currentIndex + 1} / {cards.length}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={goToNext}
                                disabled={currentIndex === cards.length - 1}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="w-[88px]" />
                    </div>
                )}

                {/* Hint */}
                <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>{t('hint') || 'Click the card to flip'}</p>
                </div>
            </div>
        </div>
    )
}
