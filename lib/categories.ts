import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

export interface CategoryData {
    id: number
    name: string
    parentId: number | null
    parentName?: string
    questionsCount: number
}

// Internal fetcher
async function fetchCategoriesCore(): Promise<CategoryData[]> {
    const categories = await prisma.category.findMany({
        include: {
            parent: true,
            _count: {
                select: {
                    questions: true,
                    pdfQuestions: true
                }
            }
        },
        orderBy: { id: 'asc' }
    })

    const formattedCategories = categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        parentName: cat.parent?.name,
        questionsCount: cat._count.questions + cat._count.pdfQuestions
    }))

    return formattedCategories
}

// Cached version
export const getCachedCategories = unstable_cache(
    async () => fetchCategoriesCore(),
    ['categories-list-full'],
    {
        revalidate: 3600, // Cache for 1 hour
        tags: ['categories-cache']
    }
)
