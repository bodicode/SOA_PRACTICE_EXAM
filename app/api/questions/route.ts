import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get('categoryId')
        const search = searchParams.get('search')

        const where: Prisma.QuestionWhereInput = {}

        if (categoryId) {
            where.categoryId = parseInt(categoryId)
        }

        if (search) {
            where.content = { contains: search, mode: 'insensitive' }
        }

        const questions = await prisma.question.findMany({
            where,
            orderBy: { id: 'asc' },
            include: {
                category: true
            },
            take: 1000
        })

        const pdfWhere: Prisma.PdfRegionQuestionWhereInput = {}
        if (categoryId) pdfWhere.categoryId = parseInt(categoryId)
        if (search) pdfWhere.textContent = { contains: search, mode: 'insensitive' }

        const pdfQuestions = await prisma.pdfRegionQuestion.findMany({
            where: pdfWhere,
            take: 1000
        })

        const mappedPdfQuestions = pdfQuestions.map(q => {
            let options: string[] = []
            if (Array.isArray(q.options)) {
                // Assuming options are like [{ text: "Option A" }, ...] or just strings
                options = q.options.map((o: any) => typeof o === 'string' ? o : o.text || JSON.stringify(o))
            }

            // Map correctOption (A/B/C/D) to index
            let correctOptionIndex = 0
            if (q.correctAnswer && Array.isArray(q.options)) {
                // Try to match label if exists, or just ABC order
                const label = q.correctAnswer.trim().toUpperCase()
                // Common labels: A, B, C, D...
                const labels = ['A', 'B', 'C', 'D', 'E']
                correctOptionIndex = labels.indexOf(label)
                if (correctOptionIndex === -1) {
                    // Fallback: try to find index in options if they have id matching answer
                }
            }

            return {
                id: q.id,
                categoryId: q.categoryId,
                content: q.textContent || '',
                options: options,
                correctOption: correctOptionIndex === -1 ? 0 : correctOptionIndex,
                explanation: q.solutionText || ''
            }
        })

        const allQuestions = [...questions, ...mappedPdfQuestions]

        // Sort questions by the number prefix in content (e.g. "1. Question..." -> 1)
        // This ensures the slice matches the user's mental model of "Question 1 to 10"
        allQuestions.sort((a, b) => {
            const getNum = (str: string) => {
                const match = str.match(/^(\d+)\./);
                return match ? parseInt(match[1]) : 999999;
            }
            return getNum(a.content) - getNum(b.content);
        })

        // Handle Range Selection (start/end)
        const startParam = searchParams.get('start')
        const endParam = searchParams.get('end')

        let processedQuestions = allQuestions;

        if (startParam || endParam) {
            const start = parseInt(startParam || '1')
            const end = parseInt(endParam || allQuestions.length.toString())

            // Adjust to 0-based index
            const startIndex = Math.max(0, start - 1)
            const endIndex = Math.min(allQuestions.length, end)

            if (startIndex < endIndex) {
                processedQuestions = allQuestions.slice(startIndex, endIndex)
            }
        }

        const random = searchParams.get('random') === 'true'
        if (random) {
            // Fisher-Yates shuffle
            for (let i = processedQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [processedQuestions[i], processedQuestions[j]] = [processedQuestions[j], processedQuestions[i]];
            }
        }

        const takeParam = searchParams.get('take');
        if (takeParam) {
            const take = parseInt(takeParam);
            if (!isNaN(take) && take > 0) {
                processedQuestions = processedQuestions.slice(0, take);
            }
        }

        return NextResponse.json(processedQuestions)
    } catch (error) {
        console.error('Fetch questions error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            categoryId,
            content,
            options,
            correctOption,
            explanation
        } = body

        if (!content || !options || !correctOption) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const question = await prisma.question.create({
            data: {
                categoryId: categoryId ? parseInt(categoryId) : null,
                content,
                options,
                correctOption,
                explanation,
                sourceType: 'manual',
                isPublic: true
            }
        })

        return NextResponse.json(question)
    } catch (error) {
        console.error('Create question error:', error)
        return NextResponse.json(
            { error: 'Failed to create question' },
            { status: 500 }
        )
    }
}
