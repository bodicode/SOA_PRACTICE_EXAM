import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import type { Prisma } from '@prisma/client'

// Type definition for the unified question structure
export interface UnifiedQuestion {
    id: number | string
    categoryId: number | null
    content: string
    options: string[]
    correctOption: number
    explanation: string
    imageUrl?: string
}



// Internal function to fetch all questions (manual + pdf)
async function fetchAllQuestionsCore(categoryId?: number) {
    const where: Prisma.QuestionWhereInput = {}
    if (categoryId) {
        where.categoryId = categoryId
    }

    // Fetch Manual Questions
    const questions = await prisma.question.findMany({
        where,
        orderBy: { id: 'asc' },
        include: {
            category: true
        },
        take: 1000 // Keep a safety limit? or remove if we want ALL
    })

    // Fetch PDF Questions
    const pdfWhere: Prisma.PdfRegionQuestionWhereInput = {}
    if (categoryId) pdfWhere.categoryId = categoryId

    const pdfQuestions = await prisma.pdfRegionQuestion.findMany({
        where: pdfWhere,
        take: 1000
    })

    // Map PDF Questions to Unified format
    const mappedPdfQuestions = pdfQuestions.map(q => {
        let options: string[] = []
        if (Array.isArray(q.options)) {
            options = q.options.map((o: any) => typeof o === 'string' ? o : o.text || JSON.stringify(o))
        }

        // Map correctOption (A/B/C/D) to index
        let correctOptionIndex = 0
        if (q.correctAnswer) {
            const label = q.correctAnswer.trim().toUpperCase()
            const labels = ['A', 'B', 'C', 'D', 'E']
            const idx = labels.indexOf(label)
            if (idx !== -1) correctOptionIndex = idx
        }

        return {
            id: q.id, // Keep original ID (string/int collision handled by caller?) 
            // actually DB might have string ID for pdf, int for question.
            // UnifiedQuestion.id is number | string.
            categoryId: q.categoryId,
            content: q.textContent || '',
            options: options,
            correctOption: correctOptionIndex,
            explanation: q.solutionText || '',
            imageUrl: (q as any).imageUrl || undefined
        } as UnifiedQuestion
    })

    const mappedManualQuestions = questions.map(q => {
        let correctOption = 0
        if (typeof q.correctOption === 'number') {
            correctOption = q.correctOption
        } else if (typeof q.correctOption === 'string') {
            // Check if it's a digit
            if (/^\d+$/.test(q.correctOption)) {
                correctOption = parseInt(q.correctOption)
            } else {
                // Try to map A,B,C,D
                const labels = ['A', 'B', 'C', 'D', 'E']
                const idx = labels.indexOf((q.correctOption as string).toUpperCase())
                if (idx !== -1) correctOption = idx
            }
        }

        return {
            id: q.id,
            categoryId: q.categoryId,
            content: q.content,
            options: q.options as string[], // Assuming stored as array
            correctOption,
            explanation: q.explanation || '',
            imageUrl: (q as any).imageUrl || undefined
        } as UnifiedQuestion
    })

    const allQuestions = [...mappedManualQuestions, ...mappedPdfQuestions]

    // Sort by number prefix (e.g. "1. Question")
    allQuestions.sort((a, b) => {
        const getNum = (str: string) => {
            const match = str.match(/^(\d+)\./);
            return match ? parseInt(match[1]) : 999999;
        }
        return getNum(a.content) - getNum(b.content);
    })

    return allQuestions
}

// Cached version
export const getCachedQuestions = unstable_cache(
    async (categoryId?: number) => {
        return fetchAllQuestionsCore(categoryId)
    },
    ['questions-cache-full'],
    { revalidate: 3600 } // Cache for 1 hour
)
