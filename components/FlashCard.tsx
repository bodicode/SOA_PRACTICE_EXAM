'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface FlashCardProps {
    name: string
    formula: string
    explanation?: string
    example?: string
    difficulty: number
    onCorrect?: () => void
    onWrong?: () => void
    isFlipped?: boolean
    onFlip?: () => void
}

export default function FlashCard({
    name,
    formula,
    explanation,
    example,
    difficulty,
    onCorrect,
    onWrong,
    isFlipped: controlledFlipped,
    onFlip
}: FlashCardProps) {
    const [internalFlipped, setInternalFlipped] = useState(false)
    const formulaRef = useRef<HTMLDivElement>(null)

    // Use controlled or internal state
    const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped

    // Render LaTeX formula with KaTeX
    useEffect(() => {
        if (formulaRef.current && formula) {
            try {
                katex.render(formula, formulaRef.current, {
                    displayMode: true,
                    throwOnError: false,
                    trust: true
                })
            } catch (e) {
                console.error('KaTeX render error:', e)
                formulaRef.current.textContent = formula
            }
        }
    }, [formula, isFlipped])

    const handleFlip = () => {
        if (onFlip) {
            onFlip()
        } else {
            setInternalFlipped(!internalFlipped)
        }
    }

    const getDifficultyBadge = () => {
        switch (difficulty) {
            case 1:
                return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Easy</span>
            case 2:
                return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Medium</span>
            case 3:
                return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Hard</span>
            default:
                return null
        }
    }

    return (
        <div className="perspective-1000 w-full max-w-lg mx-auto">
            <div
                className={cn(
                    "relative w-full aspect-[4/3] cursor-pointer transition-transform duration-500 transform-style-3d",
                    isFlipped && "rotate-y-180"
                )}
                onClick={handleFlip}
            >
                {/* Front Side */}
                <div className={cn(
                    "absolute inset-0 backface-hidden rounded-2xl shadow-xl border border-border",
                    "bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700",
                    "flex flex-col items-center justify-center p-6 text-white"
                )}>
                    <div className="absolute top-4 right-4">
                        {getDifficultyBadge()}
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">{name}</h2>
                        <p className="text-white/80 text-sm">Click to reveal formula</p>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-white/30"></div>
                            <div className="w-2 h-2 rounded-full bg-white/30"></div>
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                    </div>
                </div>

                {/* Back Side */}
                <div className={cn(
                    "absolute inset-0 backface-hidden rounded-2xl shadow-xl border border-border rotate-y-180",
                    "bg-card text-foreground",
                    "flex flex-col p-6 overflow-y-auto"
                )}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-primary">{name}</h3>
                        {getDifficultyBadge()}
                    </div>

                    {/* Formula */}
                    <div className="bg-muted/50 rounded-lg p-4 mb-4 shrink-0">
                        <div
                            ref={formulaRef}
                            className="text-center text-lg md:text-xl overflow-x-auto"
                        />
                    </div>

                    {/* Explanation */}
                    {explanation && (
                        <div className="mb-3 flex-shrink-0">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Explanation:</h4>
                            <p className="text-sm">{explanation}</p>
                        </div>
                    )}

                    {/* Example */}
                    {example && (
                        <div className="flex-shrink-0">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Example:</h4>
                            <p className="text-sm text-muted-foreground">{example}</p>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center mt-auto pt-2">
                        Click to flip back
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            {(onCorrect || onWrong) && isFlipped && (
                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onWrong?.()
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 font-medium transition-colors"
                    >
                        <span>✗</span>
                        <span>Need Practice</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onCorrect?.()
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 font-medium transition-colors"
                    >
                        <span>✓</span>
                        <span>Got It!</span>
                    </button>
                </div>
            )}
        </div>
    )
}
