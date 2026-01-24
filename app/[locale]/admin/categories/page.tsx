'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Category {
    id: number
    name: string
    parentId: number | null
    parentName?: string
    questionsCount: number
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({ name: '', parentId: '' })

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories')
            if (res.ok) {
                const data = await res.json()
                setCategories(data)
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
            const method = editingCategory ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    parentId: formData.parentId || null
                })
            })

            if (res.ok) {
                await fetchCategories()
                setIsDialogOpen(false)
                resetForm()
            } else {
                alert('Có lỗi xảy ra, vui lòng thử lại')
            }
        } catch (error) {
            console.error('Error submitting form:', error)
        }
    }

    const resetForm = () => {
        setEditingCategory(null)
        setFormData({ name: '', parentId: '' })
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({ name: category.name, parentId: category.parentId?.toString() || '' })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
            try {
                const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
                if (res.ok) {
                    fetchCategories()
                } else {
                    const data = await res.json()
                    alert(data.error || 'Không thể xóa danh mục')
                }
            } catch (error) {
                console.error('Error deleting category:', error)
            }
        }
    }

    const openCreateDialog = () => {
        resetForm()
        setIsDialogOpen(true)
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản Lý Danh Mục</h1>
                    <p className="text-gray-600 mt-1">Tạo và quản lý các danh mục đề thi</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Thêm Danh Mục
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</DialogTitle>
                            <DialogDescription>
                                {editingCategory ? 'Cập nhật thông tin danh mục' : 'Nhập thông tin cho danh mục mới'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên danh mục</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="VD: Exam P - Probability"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parentId">Danh mục cha (tùy chọn)</Label>
                                    <select
                                        id="parentId"
                                        value={formData.parentId}
                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Không có --</option>
                                        {categories
                                            .filter(c => c.id !== editingCategory?.id)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Hủy
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    {editingCategory ? 'Cập Nhật' : 'Tạo Mới'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Categories Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Danh Sách Danh Mục ({categories.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tên Danh Mục</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Danh Mục Cha</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Số Câu Hỏi</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-600">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => (
                                        <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-500">#{category.id}</td>
                                            <td className="py-3 px-4 font-medium text-gray-900">{category.name}</td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {category.parentName || '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {category.questionsCount} câu
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(category)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(category.id)}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                >
                                                    Xóa
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-500">
                                                Chưa có danh mục nào. Hãy tạo danh mục mới!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
