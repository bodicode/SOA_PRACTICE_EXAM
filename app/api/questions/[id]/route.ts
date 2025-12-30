import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const {
            categoryId,
            content,
            options,
            correctOption,
            explanation
        } = body

        const question = await prisma.question.update({
            where: { id: parseInt(id) },
            data: {
                categoryId: categoryId ? parseInt(categoryId) : null,
                content,
                options,
                correctOption,
                explanation
            }
        })

        return NextResponse.json(question)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update question' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.question.delete({
            where: { id: parseInt(id) }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete question' },
            { status: 500 }
        )
    }
}
