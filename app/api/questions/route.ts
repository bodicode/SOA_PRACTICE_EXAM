import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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
            take: 1000 // Increased limit for larger question banks
        })

        return NextResponse.json(questions)
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
