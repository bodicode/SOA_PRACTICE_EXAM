'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, DollarSign, Users, TrendingUp, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Donation {
    id: number
    donorName: string | null
    donorEmail: string | null
    amount: number
    method: string
    message: string | null
    status: string
    createdAt: string
    user: { fullName: string | null; email: string } | null
}

interface DonationStats {
    totalConfirmedAmount: number
    totalConfirmedCount: number
    pendingCount: number
}

export default function AdminDonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([])
    const [stats, setStats] = useState<DonationStats>({ totalConfirmedAmount: 0, totalConfirmedCount: 0, pendingCount: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchDonations = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/donations?page=${page}&status=${statusFilter}&limit=15`)
            const data = await res.json()
            setDonations(data.donations || [])
            setStats(data.stats || { totalConfirmedAmount: 0, totalConfirmedCount: 0, pendingCount: 0 })
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (error) {
            console.error('Error fetching donations:', error)
        } finally {
            setIsLoading(false)
        }
    }, [page, statusFilter])

    useEffect(() => {
        fetchDonations()
    }, [fetchDonations])

    const updateStatus = async (id: number, status: string) => {
        try {
            await fetch(`/api/donations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            fetchDonations()
        } catch (error) {
            console.error('Error updating donation:', error)
        }
    }

    const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + 'đ'

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        }
        const icons: Record<string, React.ReactNode> = {
            pending: <Clock className="w-3 h-3" />,
            confirmed: <CheckCircle className="w-3 h-3" />,
            rejected: <XCircle className="w-3 h-3" />,
        }
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
                {icons[status]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    const methodBadge = (method: string) => {
        return method === 'bank'
            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">🏦 Bank</span>
            : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">📱 Momo</span>
    }

    return (
        <div className="p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Quản lý Donations</h1>
                <p className="text-muted-foreground">Theo dõi và xác nhận các khoản ủng hộ</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Tổng đã xác nhận</p>
                        <p className="text-xl font-bold text-green-600">{formatVND(stats.totalConfirmedAmount)}</p>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Lượt ủng hộ đã xác nhận</p>
                        <p className="text-xl font-bold">{stats.totalConfirmedCount}</p>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Đang chờ xác nhận</p>
                        <p className="text-xl font-bold text-yellow-600">{stats.pendingCount}</p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-6">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {['all', 'pending', 'confirmed', 'rejected'].map(s => (
                    <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setPage(1) }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s
                                ? 'bg-blue-600 text-white'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        {s === 'all' ? 'Tất cả' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground">Đang tải...</div>
                ) : donations.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">Chưa có donation nào</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Người ủng hộ</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Số tiền</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Phương thức</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Lời nhắn</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Trạng thái</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Ngày</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {donations.map(donation => (
                                    <tr key={donation.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-sm">{donation.donorName || donation.user?.fullName || 'Ẩn danh'}</p>
                                                <p className="text-xs text-muted-foreground">{donation.donorEmail || donation.user?.email || ''}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-sm">{formatVND(donation.amount)}</td>
                                        <td className="px-4 py-3">{methodBadge(donation.method)}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                                            {donation.message || '—'}
                                        </td>
                                        <td className="px-4 py-3">{statusBadge(donation.status)}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(donation.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            {donation.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                                        onClick={() => updateStatus(donation.id, 'confirmed')}
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                        Xác nhận
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => updateStatus(donation.id, 'rejected')}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 mr-1" />
                                                        Từ chối
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Trước
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Trang {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Sau
                    </Button>
                </div>
            )}
        </div>
    )
}
