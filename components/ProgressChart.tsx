'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ProgressChartProps {
    data: {
        date: string
        score: number
        total: number
        percentage: number // kept for backward compatibility if needed, but we focus on score/scale10 usually
        scale10?: number
        fullDate: string
    }[]
}

import { useTranslations } from 'next-intl'

const CustomTooltip = ({ active, payload, label }: any) => {
    const t = useTranslations('progress.charts')
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-md rounded-lg text-sm">
                <p className="font-semibold text-gray-700 mb-1">{label}</p>
                <div className="text-blue-600 font-bold">
                    {payload[0].value}/10
                    <span className="text-xs font-normal text-gray-500 ml-1">
                        ({t('tooltipCorrect')} {payload[0].payload.score}/{payload[0].payload.total} {t('tooltipQuestions')}) - {payload[0].payload.mode}
                    </span>
                </div>
            </div>
        )
    }
    return null
}

export default function ProgressChart({ data }: ProgressChartProps) {
    const t = useTranslations('progress.charts')
    if (!data || data.length === 0) {
        return (
            <Card className="h-full flex items-center justify-center bg-muted/30 border-dashed border-none shadow-none">
                <div className="text-center text-muted-foreground">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{t('noData')}</p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="border-none shadow-md bg-card h-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-foreground">
                            {t('scoreTracking')}
                        </CardTitle>
                        <CardDescription className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                            {t('target')}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                dy={10}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                domain={[0, 10]}
                                unit=""
                                ticks={[0, 2.5, 5, 7.5, 10]}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={7} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Target', position: 'insideBottomRight', fill: '#EF4444', fontSize: 10 }} />
                            <Area
                                type="monotone"
                                dataKey="scale10"
                                stroke="#2563EB"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563EB' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
