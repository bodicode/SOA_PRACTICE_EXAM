import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

import { getCachedQuestions } from '@/lib/questions'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get('categoryId')
        const search = searchParams.get('search')
        const pageParam = searchParams.get('page')
        const limitParam = searchParams.get('limit')

        // Fetch base data (cached)
        let allQuestions = await getCachedQuestions(categoryId ? parseInt(categoryId) : undefined)

        // Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            allQuestions = allQuestions.filter(q =>
                q.content.toLowerCase().includes(lowerSearch) ||
                (q.explanation && q.explanation.toLowerCase().includes(lowerSearch))
            )
        }

        // 2. Handle Range Selection (start/end) vs Pagination
        // If start/end is provided, we slice FIRST (defining the "Exam Pool").
        // Then we shuffle that pool.
        // Then we paginate that pool if needed (or return all if no page param, or respect limit).

        let processedQuestions = allQuestions;
        const startParam = searchParams.get('start')
        const endParam = searchParams.get('end')

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

        // 3. Handle Randomization (on the potentially sliced pool)
        const random = searchParams.get('random') === 'true'
        const seedParam = searchParams.get('seed')

        if (random) {
            const seed = seedParam ? parseInt(seedParam) : Date.now();

            // Simple LCG
            let currentSeed = seed;
            const nextRandom = () => {
                currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
                return currentSeed / 4294967296;
            }

            const shuffled = [...processedQuestions]
            const randomFunc = seedParam ? nextRandom : Math.random;

            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(randomFunc() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            processedQuestions = shuffled
        }

        const total = processedQuestions.length

        // 4. Pagination / Limit (for View)
        if (pageParam || limitParam) {
            const page = parseInt(pageParam || '1')
            const limit = parseInt(limitParam || '20')

            // If explicit page is requested, use it. 
            // If only limit is requested (and maybe start/end was used), we might just want "limit" items from the top.
            // But if start/end was used, we already sliced.

            // Case A: Page is set -> Standard Pagination
            if (pageParam) {
                const skip = (page - 1) * limit
                processedQuestions = processedQuestions.slice(skip, skip + limit)
            }
            // Case B: Only Limit is set -> Take top N
            // (Only if we haven't already restricted by start/end? Or just apply on top?)
            // Usually limit implies "Take N".
            else if (limitParam) {
                processedQuestions = processedQuestions.slice(0, limit)
            }
        } else {
            // Legacy "take"
            const takeParam = searchParams.get('take')
            if (takeParam) {
                const take = parseInt(takeParam)
                if (!isNaN(take) && take > 0) {
                    processedQuestions = processedQuestions.slice(0, take)
                }
            }
        }



        return NextResponse.json({
            questions: processedQuestions,
            total,
            page: pageParam ? parseInt(pageParam) : 1,
            totalPages: limitParam ? Math.ceil(total / parseInt(limitParam)) : 1
        })

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
