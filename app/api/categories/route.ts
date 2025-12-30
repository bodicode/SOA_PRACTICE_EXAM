import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                parent: true,
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: { id: 'asc' }
        })

        const formattedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            parentId: cat.parentId,
            parentName: cat.parent?.name,
            questionsCount: cat._count.questions
        }))

        return NextResponse.json(formattedCategories)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, parentId } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            )
        }

        const category = await prisma.category.create({
            data: {
                name,
                parentId: parentId ? parseInt(parentId) : null
            }
        })

        return NextResponse.json(category)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        )
    }
}
