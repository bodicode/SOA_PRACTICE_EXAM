export interface Category {
    id: number
    name: string
    parentId: number | null
    parentName?: string
    questionsCount: number
}

export interface Question {
    id: number | string
    content: string
    options: string[]
    correctOption: number
    explanation?: string
    categoryId: number
}

class ExamService {
    async getCategories(): Promise<Category[]> {
        const res = await fetch('/api/categories')
        if (!res.ok) throw new Error('Failed to fetch categories')
        return res.json()
    }

    async getQuestions(params: { categoryId?: number; limit?: number }): Promise<Question[]> {
        const queryParams = new URLSearchParams()
        if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString())

        // Note: The /api/questions endpoint currently fetches all matching questions.
        // We might need to handle 'limit' either in the API or client-side for now,
        // or update the API to support it. 
        // For now, we'll fetch and slice client-side if the API doesn't support limit.

        // Append random=true to get shuffled results from API
        queryParams.append('random', 'true')

        const res = await fetch(`/api/questions?${queryParams.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch questions')

        const questions = await res.json()

        if (params.limit && questions.length > params.limit) {
            return questions.slice(0, params.limit);
        }

        return questions
    }
}

export const examService = new ExamService()
