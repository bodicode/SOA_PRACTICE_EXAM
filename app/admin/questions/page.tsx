'use client'

import { useState, useEffect, useRef } from 'react' // Added useRef
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import MathRender from '@/components/MathRender'

interface Option {
    key: string
    text: string
}

interface Question {
    id: number
    categoryId: number
    content: string
    options: Option[]
    correctOption: string
    explanation: string
}

interface Category {
    id: number
    name: string
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

    // PDF Import States
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [importedQuestions, setImportedQuestions] = useState<Question[]>([])
    const [importCategoryId, setImportCategoryId] = useState<string>('')
    const questionFileRef = useRef<HTMLInputElement>(null)
    const solutionFileRef = useRef<HTMLInputElement>(null)
    const [isParsing, setIsParsing] = useState(false)

    const [formData, setFormData] = useState({
        categoryId: '',
        content: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        optionE: '',
        correctOption: 'A',
        explanation: '',
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('')

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catsRes, qsRes] = await Promise.all([
                    fetch('/api/categories'),
                    fetch('/api/questions')
                ])

                if (catsRes.ok) {
                    const catsData = await catsRes.json()
                    setCategories(catsData)
                }

                if (qsRes.ok) {
                    const qsData = await qsRes.json()
                    setQuestions(qsData)
                }
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const reloadQuestions = async () => {
        try {
            const res = await fetch('/api/questions')
            if (res.ok) {
                const data = await res.json()
                setQuestions(data)
            }
        } catch (error) {
            console.error('Failed to reload questions:', error)
        }
    }

    const handleFileUpload = async () => {
        const questionFile = questionFileRef.current?.files?.[0]
        if (!questionFile) {
            alert('Vui lòng chọn file câu hỏi')
            return
        }

        setIsParsing(true)
        const formData = new FormData()
        formData.append('questionFile', questionFile)

        // Add solution file if provided
        const solutionFile = solutionFileRef.current?.files?.[0]
        if (solutionFile) {
            formData.append('solutionFile', solutionFile)
            console.log('Solution file added:', solutionFile.name)
        } else {
            console.log('No solution file selected')
        }

        try {
            console.log('Sending to API with files:', questionFile.name, solutionFile?.name || 'none')
            const res = await fetch('/api/admin/parse-pdf', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                setImportedQuestions(data.questions)
            } else {
                alert('Lỗi khi đọc file PDF')
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('Có lỗi xảy ra khi tải file')
        } finally {
            setIsParsing(false)
        }
    }

    const saveImportedQuestions = async () => {
        if (!importCategoryId) {
            alert('Vui lòng chọn danh mục cho bộ câu hỏi nhập vào')
            return
        }

        try {
            // Use bulk API for efficient batch insert
            const res = await fetch('/api/questions/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: parseInt(importCategoryId),
                    questions: importedQuestions.map(q => ({
                        content: q.content,
                        options: q.options,
                        correctOption: q.correctOption || 'A'
                    }))
                })
            })

            if (res.ok) {
                const data = await res.json()
                alert(`Đã nhập thành công ${data.count} câu hỏi!`)
                setIsImportDialogOpen(false)
                setImportedQuestions([])
                setImportCategoryId('')
                reloadQuestions()
            } else {
                alert('Lỗi khi lưu câu hỏi')
            }
        } catch (error) {
            console.error('Import error:', error)
            alert('Có lỗi xảy ra khi lưu câu hỏi')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const options: Option[] = [
            { key: 'A', text: formData.optionA },
            { key: 'B', text: formData.optionB },
            { key: 'C', text: formData.optionC },
            { key: 'D', text: formData.optionD },
            { key: 'E', text: formData.optionE },
        ].filter(o => o.text.trim())

        try {
            const url = editingQuestion ? `/api/questions/${editingQuestion.id}` : '/api/questions'
            const method = editingQuestion ? 'PUT' : 'POST'

            const payload = {
                categoryId: parseInt(formData.categoryId),
                content: formData.content,
                options,
                correctOption: formData.correctOption,
                explanation: formData.explanation,
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                await reloadQuestions()
                setIsDialogOpen(false)
                resetForm()
            } else {
                alert('Có lỗi xảy ra. Kiểm tra lại dữ liệu.')
            }
        } catch (error) {
            console.error('Error saving question:', error)
        }
    }

    const resetForm = () => {
        setEditingQuestion(null)
        setFormData({
            categoryId: '',
            content: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            optionE: '',
            correctOption: 'A',
            explanation: '',
        })
    }

    const handleEdit = (question: Question) => {
        setEditingQuestion(question)

        // Helper to get option text safely
        const getOpt = (key: string) => question.options.find(o => o.key === key)?.text || ''

        setFormData({
            categoryId: question.categoryId.toString(),
            content: question.content,
            optionA: getOpt('A'),
            optionB: getOpt('B'),
            optionC: getOpt('C'),
            optionD: getOpt('D'),
            optionE: getOpt('E'),
            correctOption: question.correctOption,
            explanation: question.explanation || '',
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
            try {
                const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
                if (res.ok) {
                    reloadQuestions()
                } else {
                    alert('Không thể xóa câu hỏi')
                }
            } catch (error) {
                console.error('Error deleting question:', error)
            }
        }
    }

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !filterCategory || q.categoryId === parseInt(filterCategory)
        return matchesSearch && matchesCategory
    })

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản Lý Câu Hỏi</h1>
                    <p className="text-gray-600 mt-1">Tạo và quản lý ngân hàng câu hỏi</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Import PDF
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Nhập câu hỏi từ PDF</DialogTitle>
                                <DialogDescription>Chọn file PDF đề thi để hệ thống tự động nhận diện câu hỏi.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>File PDF Câu Hỏi <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="file"
                                            accept=".pdf"
                                            ref={questionFileRef}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>File PDF Đáp Án (tùy chọn)</Label>
                                        <Input
                                            type="file"
                                            accept=".pdf"
                                            ref={solutionFileRef}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1 space-y-2">
                                        <Label>Chọn danh mục lưu</Label>
                                        <select
                                            value={importCategoryId}
                                            onChange={(e) => setImportCategoryId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button
                                        onClick={handleFileUpload}
                                        disabled={isParsing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isParsing ? 'Đang xử lý...' : 'Phân Tích PDF'}
                                    </Button>
                                </div>

                                {isParsing && <div className="text-center py-4 text-blue-600">Đang phân tích file PDF...</div>}

                                {importedQuestions.length > 0 && (
                                    <div className="border rounded-md p-4 bg-gray-50">
                                        <h3 className="font-medium mb-3">Kết quả đọc được ({importedQuestions.length} câu):</h3>
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                            {importedQuestions.map((q, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded border">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="font-medium text-sm text-gray-700">Câu {q.id}:</div>
                                                        <div className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700">
                                                            Đáp án: {q.correctOption}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm mb-2"><MathRender text={q.content} /></div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                                        {q.options.map(o => (
                                                            <div
                                                                key={o.key}
                                                                className={o.key === q.correctOption ? 'font-semibold text-green-700' : ''}
                                                            >
                                                                {o.key}. <MathRender text={o.text} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Hủy</Button>
                                <Button
                                    onClick={saveImportedQuestions}
                                    disabled={importedQuestions.length === 0 || !importCategoryId}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Lưu {importedQuestions.length} Câu Hỏi
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Thêm Câu Hỏi
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingQuestion ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}</DialogTitle>
                                <DialogDescription>
                                    Hỗ trợ LaTeX: Dùng $...$ cho công thức inline
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="categoryId">Danh mục</Label>
                                            <select
                                                id="categoryId"
                                                value={formData.categoryId}
                                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">-- Chọn danh mục --</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="content">Nội dung câu hỏi</Label>
                                        <Textarea
                                            id="content"
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="VD: Tính xác suất $P(X > 2)$ với $X \sim N(0,1)$"
                                            rows={4}
                                            required
                                        />
                                        {formData.content && (
                                            <div className="p-3 bg-gray-50 rounded-md border">
                                                <p className="text-xs text-gray-500 mb-1">Xem trước:</p>
                                                <MathRender text={formData.content} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Các đáp án</Label>
                                        {['A', 'B', 'C', 'D', 'E'].map((key) => (
                                            <div key={key} className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${formData.correctOption === key ? 'bg-green-500 text-white' : 'bg-gray-200'
                                                    }`}>
                                                    {key}
                                                </span>
                                                <Input
                                                    value={formData[`option${key}` as keyof typeof formData] as string}
                                                    onChange={(e) => setFormData({ ...formData, [`option${key}`]: e.target.value })}
                                                    placeholder={`Đáp án ${key}`}
                                                    className="flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, correctOption: key })}
                                                    className={`px-3 py-1 rounded text-sm ${formData.correctOption === key
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {formData.correctOption === key ? '✓ Đáp án đúng' : 'Chọn'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="explanation">Lời giải (tùy chọn)</Label>
                                        <Textarea
                                            id="explanation"
                                            value={formData.explanation}
                                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                            placeholder="Giải thích đáp án đúng..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Hủy
                                    </Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                        {editingQuestion ? 'Cập Nhật' : 'Tạo Mới'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <Input
                    placeholder="Tìm kiếm câu hỏi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tất cả danh mục</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Đang tải dữ liệu...</div>
                ) : filteredQuestions.map((question) => (
                    <Card key={question.id} className="border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                            {categories.find(c => c.id === question.categoryId)?.name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            #{question.id}
                                        </span>
                                    </div>
                                    <div className="text-gray-900 mb-4">
                                        <MathRender text={question.content} />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        {question.options.map((opt) => (
                                            <div
                                                key={opt.key}
                                                className={`px-3 py-2 rounded-lg text-sm ${opt.key === question.correctOption
                                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                                    : 'bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                <span className="font-medium">{opt.key}.</span>{' '}
                                                <MathRender text={opt.text} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(question)}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(question.id)}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        Xóa
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!isLoading && filteredQuestions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    Không tìm thấy câu hỏi nào
                </div>
            )}
        </div>
    )
}
