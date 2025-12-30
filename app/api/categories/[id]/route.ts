import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, parentId } = body

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: {
                name,
                parentId: parentId ? parseInt(parentId) : null
            }
        })

        return NextResponse.json(category)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update category' },
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

        // Check if category has questions
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: { _count: { select: { questions: true } } }
        })

        if (category && category._count.questions > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with questions' },
                { status: 400 }
            )
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        )
    }
}
