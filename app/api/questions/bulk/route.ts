import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface BulkQuestionInput {
    categoryId: number
    content: string
    options: { key: string; text: string }[]
    correctOption: string
    explanation?: string
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { questions, categoryId } = body as {
            questions: BulkQuestionInput[]
            categoryId: number
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json(
                { error: 'No questions provided' },
                { status: 400 }
            )
        }

        if (!categoryId) {
            return NextResponse.json(
                { error: 'Category ID is required' },
                { status: 400 }
            )
        }

        // Prepare data for bulk insert
        const questionsData = questions.map(q => ({
            categoryId: categoryId,
            content: q.content || '',
            options: q.options || [],
            correctOption: q.correctOption || 'A',
            explanation: q.explanation || '',
            sourceType: 'pdf_import',
            isPublic: true
        }))

        // Use createMany for bulk insert (much faster than individual creates)
        const result = await prisma.question.createMany({
            data: questionsData,
            skipDuplicates: true
        })

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `Successfully created ${result.count} questions`
        })

    } catch (error) {
        console.error('Bulk create questions error:', error)
        return NextResponse.json(
            { error: 'Failed to create questions in bulk' },
            { status: 500 }
        )
    }
}
