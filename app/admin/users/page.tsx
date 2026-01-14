'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1) // Reset to page 1 on search
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/admin/users?page=${page}&limit=10&search=${debouncedSearch}`)
                if (res.ok) {
                    const data = await res.json()
                    setUsers(data.users)
                    setTotal(data.total)
                    setTotalPages(data.totalPages)
                }
            } catch (error) {
                console.error("Failed to fetch users", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [page, debouncedSearch])

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
                    <p className="text-gray-500 mt-1">Danh sách tất cả người dùng trong hệ thống (Tổng: {total})</p>
                </div>
                {/* Add User Button (Future) */}
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Avatar</TableHead>
                                    <TableHead>Thông tin</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Hoạt động gần nhất</TableHead>
                                    <TableHead>Ngày tham gia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <div className="flex justify-center items-center w-full">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            Không tìm thấy người dùng nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-gray-50/50">
                                            <TableCell>
                                                <Avatar className="h-10 w-10 border border-gray-100">
                                                    <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                                                    <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{user.fullName || "User"}</span>
                                                    <span className="text-sm text-gray-500">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? "bg-purple-100 text-purple-700 hover:bg-purple-100 border-0" : "bg-blue-50 text-blue-700 hover:bg-blue-50 border-0"}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                {user.lastStudyDate ? new Date(user.lastStudyDate).toLocaleDateString('vi-VN') : 'Chưa hoạt động'}
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-600">
                                Trang {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
