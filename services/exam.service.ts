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

    async getQuestions(params: { categoryId?: number; limit?: number; start?: number; end?: number; page?: number; seed?: number }): Promise<{ questions: Question[]; total: number }> {
        const queryParams = new URLSearchParams()
        if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString())
        if (params.start) queryParams.append('start', params.start.toString())
        if (params.end) queryParams.append('end', params.end.toString())
        if (params.page) queryParams.append('page', params.page.toString())
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.seed) queryParams.append('seed', params.seed.toString())

        // Append random=true to get shuffled results from API
        // If paging, random order must be consistent? The API handles simple shuffle.
        queryParams.append('random', 'true')

        const res = await fetch(`/api/questions?${queryParams.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch questions')

        const data = await res.json()

        // Handle both new (object) and legacy (array) formats gracefully if needed context switching
        if (Array.isArray(data)) {
            let questions = data;
            if (params.limit && questions.length > params.limit) {
                questions = questions.slice(0, params.limit);
            }
            return { questions, total: questions.length }
        }

        return { questions: data.questions, total: data.total }
    }
}

export const examService = new ExamService()
