'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ProgressChartProps {
    data: {
        date: string
        score: number
        total: number
        percentage: number
        fullDate: string
    }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-md rounded-lg text-sm">
                <p className="font-semibold text-gray-700 mb-1">{label}</p>
                <div className="text-blue-600 font-bold">
                    {payload[0].value}%
                    <span className="text-xs font-normal text-gray-500 ml-1">
                        {payload[0].payload.total > 0 ? `(${payload[0].payload.score}/${payload[0].payload.total} câu)` : `(${payload[0].payload.score} điểm)`}
                    </span>
                </div>
            </div>
        )
    }
    return null
}

export default function ProgressChart({ data }: ProgressChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="h-[350px] flex items-center justify-center bg-gray-50 border-dashed">
                <div className="text-center text-gray-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Chưa có dữ liệu biểu đồ</p>
                </div>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Biểu đồ tăng trưởng
                </CardTitle>
                <CardDescription>Theo dõi sự tiến bộ của bạn qua từng bài thi</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                domain={[0, 100]}
                                unit="%"
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="percentage"
                                stroke="#2563EB"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
