import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCachedCategories } from '@/lib/categories'

export async function GET() {
    try {
        const categories = await getCachedCategories();
        return NextResponse.json(categories)
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

        revalidateTag('categories-cache', { expire: 0 })

        return NextResponse.json(category)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        )
    }
}
