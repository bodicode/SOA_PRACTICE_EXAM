'use strict';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HelpCircle, BarChart2, Flame, TrendingUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useProgressStore } from '@/stores/progressStore';
import { useUserStore } from '@/stores/userStore';
import { useTranslations } from 'next-intl';

export function HomeProgress() {
    const { user } = useUserStore();
    const { getData, isLoading, fetchProgress } = useProgressStore();
    const t = useTranslations('progress');

    // UI State
    const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null);

    // Derived state from store data
    // Use selectedCategory if present (passed as number), otherwise undefined
    const activeCategoryId = selectedCategory ?? undefined;
    const data = getData(activeCategoryId);

    // Check loading using function
    const isCategoryLoading = isLoading(activeCategoryId);

    const stats = data?.stats;
    const performanceData = data?.performance || [];

    React.useEffect(() => {
        if (user?.id) {
            const numericId = Number(user.id);
            if (!isNaN(numericId)) {
                // Prefetch all categories to ensure smooth tab switching
                // The store handles caching, so subsequent calls are cheap
                fetchProgress(numericId, undefined);
                fetchProgress(numericId, 1);
                fetchProgress(numericId, 2);
            }
        }
    }, [user?.id, fetchProgress]); // removed activeCategoryId dependency to avoid refetching on tab change if already cached


    if (isCategoryLoading && !data) return (
        <section className="py-12 bg-gray-50 flex justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-64 w-full max-w-4xl bg-gray-200 rounded"></div>
            </div>
        </section>
    );

    if (!user) return null;

    return (
        <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <Button
                            variant={selectedCategory === null ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                            className={selectedCategory === null ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-gray-600 hover:text-gray-900"}
                        >
                            {t('overview')}
                        </Button>
                        <Button
                            variant={selectedCategory === 1 ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedCategory(1)}
                            className={selectedCategory === 1 ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-gray-600 hover:text-gray-900"}
                        >
                            Exam P
                        </Button>
                        <Button
                            variant={selectedCategory === 2 ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedCategory(2)}
                            className={selectedCategory === 2 ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-gray-600 hover:text-gray-900"}
                        >
                            Exam FM
                        </Button>
                    </div>

                    <Button variant="ghost" className="text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50 hidden md:flex">
                        {t('viewAll')}
                    </Button>
                </div>

                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Questions Answered */}
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <HelpCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-gray-600 font-medium">{t('questionsAnswered')}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-3xl font-bold text-gray-900">{stats?.totalQuestions || 0}</span>
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                <TrendingUp className="w-3 h-3" />
                                <span>{t('latestUpdate')}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Average Score */}
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <BarChart2 className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className="text-gray-600 font-medium">{t('averageScore')}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-3xl font-bold text-gray-900">{stats?.averageScore ? Number(stats.averageScore).toFixed(1) : 0}</span>
                                <span className="text-sm text-gray-500 ml-1">/ 10</span>
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${(stats?.averageScore || 0) >= 7 ? 'bg-green-50 text-green-700' :
                                (stats?.averageScore || 0) >= 5 ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-red-50 text-red-700'
                                }`}>
                                <TrendingUp className="w-3 h-3" />
                                <span>
                                    {(stats?.averageScore || 0) >= 8 ? t('feedback.excellent') :
                                        (stats?.averageScore || 0) >= 7 ? t('feedback.good') :
                                            (stats?.averageScore || 0) >= 5 ? t('feedback.pass') :
                                                (stats?.averageScore || 0) > 0 ? t('feedback.improve') :
                                                    t('feedback.noData')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Study Streak */}
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                                    <Flame className="w-6 h-6 text-orange-600" />
                                </div>
                                <span className="text-gray-600 font-medium">{t('studyStreak')}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-3xl font-bold text-gray-900">{stats?.studyStreak || 0} {t('days')}</span>
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                <CheckCircleIcon className="w-3 h-3" />
                                <span>{t('keepItUp')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="mt-8">
                    {/* Performance Chart */}
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-gray-500 text-sm font-medium uppercase tracking-wider">{t('performance')}</CardTitle>
                                <div className="text-xl font-bold text-gray-900 mt-1">{t('last7Days')}</div>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                                {t('daily')} <ChevronDown className="w-3 h-3" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis hide domain={[0, 10]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            formatter={(value: any) => [`${Number(value).toFixed(1)}/10`, "Điểm trung bình"]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    )
}
