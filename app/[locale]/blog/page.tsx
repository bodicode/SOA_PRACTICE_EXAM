import { getBlogPosts } from '@/lib/blog'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Calendar, Clock, Tag, ArrowRight, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Blog Luyện Thi SOA | Kinh Nghiệm Thi Exam P, FM — SOA Exam Practice',
    description: 'Chia sẻ kinh nghiệm, chiến lược và mẹo luyện thi SOA Actuarial. Tips thi đỗ Exam P, Exam FM từ cộng đồng actuarial Việt Nam.',
    keywords: ['blog SOA', 'kinh nghiệm thi Exam P', 'luyện thi actuarial', 'mẹo thi Exam FM', 'actuary Việt Nam'],
    alternates: { canonical: '/vi/blog' },
    openGraph: {
        title: 'Blog Luyện Thi SOA — Kinh Nghiệm & Chiến Lược',
        description: 'Chia sẻ kinh nghiệm, chiến lược và mẹo luyện thi SOA Actuarial từ cộng đồng actuarial Việt Nam.',
        type: 'website',
    }
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const posts = getBlogPosts(locale)
    const featured = posts.filter(p => p.featured)
    const regular = posts.filter(p => !p.featured)

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="bg-blue-600 text-white py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                        <BookOpen className="w-4 h-4" />
                        Blog Actuarial Việt Nam
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Kinh Nghiệm & Chiến Lược Thi SOA
                    </h1>
                    <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                        Hướng dẫn chi tiết, lộ trình học và mẹo thực chiến từ cộng đồng actuarial Việt Nam
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Featured Posts */}
                {featured.length > 0 && (
                    <section className="mb-14">
                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-600 rounded-full inline-block" />
                            Bài Viết Nổi Bật
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {featured.map(post => (
                                <article
                                    key={post.slug}
                                    className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                                    <div className="p-6">
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {post.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                                    <Tag className="w-2.5 h-2.5" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <h2 className="font-bold text-lg text-foreground mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                                            <Link href={`/${locale}/blog/${post.slug}`}>
                                                {post.title}
                                            </Link>
                                        </h2>
                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.description}</p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(post.date).toLocaleDateString('vi-VN')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {post.readingTime}
                                                </span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-500" />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {/* Other Posts */}
                {regular.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-gray-300 rounded-full inline-block" />
                            Tất Cả Bài Viết
                        </h2>
                        <div className="space-y-5">
                            {regular.map(post => (
                                <article
                                    key={post.slug}
                                    className="group flex items-start gap-4 bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {post.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors mb-1">
                                            <Link href={`/${locale}/blog/${post.slug}`} className="hover:underline">
                                                {post.title}
                                            </Link>
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{post.description}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                                            <span>·</span>
                                            <span>{post.readingTime}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {posts.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Chưa có bài viết nào.</p>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-14 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-bold text-foreground mb-2">Sẵn Sàng Luyện Thi?</h3>
                    <p className="text-muted-foreground mb-5">Thực hành ngay với 1000+ câu hỏi SOA được tuyển chọn kỹ lưỡng</p>
                    <Link
                        href={`/${locale}/practice`}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                    >
                        Bắt Đầu Luyện Thi Miễn Phí
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
