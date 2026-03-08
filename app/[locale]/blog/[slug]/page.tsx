import { getBlogPost, getBlogPosts } from '@/lib/blog'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Calendar, Clock, User, ArrowLeft, Tag, BookOpen } from 'lucide-react'

interface Props {
    params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams({ params }: { params: { locale: string } }) {
    const { locale } = params
    const posts = getBlogPosts(locale)
    return posts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, slug } = await params
    const post = getBlogPost(slug, locale)
    if (!post) return {}
    return {
        title: post.title,
        description: post.description,
        keywords: post.tags,
        authors: [{ name: post.author }],
        openGraph: {
            title: post.title,
            description: post.description,
            type: 'article',
            publishedTime: post.date,
            authors: [post.author],
            tags: post.tags,
            siteName: 'SOA Exam Practice',
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
        },
        alternates: { canonical: `/${locale}/blog/${slug}` },
    }
}

// Custom MDX components
const mdxComponents = {
    h2: (props: any) => (
        <h2 {...props} className="text-2xl font-bold text-foreground mt-10 mb-4 pb-2 border-b border-border" />
    ),
    h3: (props: any) => (
        <h3 {...props} className="text-xl font-semibold text-foreground mt-8 mb-3" />
    ),
    p: (props: any) => (
        <p {...props} className="text-foreground/80 leading-relaxed my-4" />
    ),
    ul: (props: any) => (
        <ul {...props} className="my-4 space-y-2 list-none pl-0" />
    ),
    li: (props: any) => (
        <li {...props} className="flex items-start gap-2 text-foreground/80">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>{props.children}</span>
        </li>
    ),
    ol: (props: any) => (
        <ol {...props} className="my-4 space-y-2 list-decimal pl-6 text-foreground/80" />
    ),
    blockquote: (props: any) => (
        <blockquote {...props} className="my-6 border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg italic text-foreground/70" />
    ),
    table: (props: any) => (
        <div className="my-6 overflow-x-auto rounded-xl border border-border">
            <table {...props} className="w-full text-sm border-collapse" />
        </div>
    ),
    thead: (props: any) => <thead {...props} className="bg-muted" />,
    tbody: (props: any) => <tbody {...props} />,
    tr: (props: any) => <tr {...props} className="border-t border-border" />,
    th: (props: any) => (
        <th {...props} className="px-4 py-3 text-left font-semibold text-foreground" />
    ),
    td: (props: any) => (
        <td {...props} className="px-4 py-3 text-foreground/80" />
    ),
    code: (props: any) => (
        <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400" />
    ),
    pre: (props: any) => (
        <pre {...props} className="my-6 bg-slate-900 text-slate-100 rounded-xl p-5 overflow-x-auto text-sm leading-relaxed" />
    ),
    a: (props: any) => (
        <a {...props} className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 transition-colors" />
    ),
    hr: () => <hr className="my-8 border-t border-border" />,
    strong: (props: any) => (
        <strong {...props} className="font-semibold text-foreground" />
    ),
}


export default async function BlogPostPage({ params }: Props) {
    const { locale, slug } = await params
    const post = getBlogPost(slug, locale)
    if (!post) notFound()

    const allPosts = getBlogPosts(locale)
    const related = allPosts
        .filter(p => p.slug !== slug && p.tags.some(t => post.tags.includes(t)))
        .slice(0, 3)

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        author: { '@type': 'Organization', name: post.author },
        datePublished: post.date,
        keywords: post.tags.join(', '),
        publisher: { '@type': 'Organization', name: 'SOA Exam Practice' },
        inLanguage: locale === 'vi' ? 'vi-VN' : 'en-US',
    }

    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `/${locale}` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `/${locale}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: `/${locale}/blog/${slug}` },
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                    <Link href={`/${locale}`} className="hover:text-foreground transition-colors">Trang chủ</Link>
                    <span>/</span>
                    <Link href={`/${locale}/blog`} className="hover:text-foreground transition-colors">Blog</Link>
                    <span>/</span>
                    <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
                </nav>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-6">
                    {post.title}
                </h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
                    <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {post.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {post.readingTime}
                    </span>
                </div>

                {/* CTA Banner */}
                <div className="bg-blue-600 text-white rounded-2xl p-5 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-bold">🎯 Luyện thi thực chiến với 1000+ câu hỏi SOA</p>
                        <p className="text-blue-100 text-sm mt-0.5">Theo dõi tiến độ, thi thử timed — miễn phí</p>
                    </div>
                    <Link
                        href={`/${locale}/practice`}
                        className="shrink-0 bg-white text-blue-700 hover:bg-blue-50 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                    >
                        Bắt đầu ngay →
                    </Link>
                </div>

                {/* Content */}
                <article className="text-base">
                    <MDXRemote
                        source={post.content}
                        components={mdxComponents}
                        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
                    />
                </article>

                {/* Back link */}
                <div className="mt-12 pt-8 border-t border-border">
                    <Link
                        href={`/${locale}/blog`}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Xem tất cả bài viết
                    </Link>
                </div>

                {/* Related Posts */}
                {related.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            Bài Viết Liên Quan
                        </h2>
                        <div className="grid gap-4">
                            {related.map(p => (
                                <Link
                                    key={p.slug}
                                    href={`/${locale}/blog/${p.slug}`}
                                    className="group flex items-center justify-between p-4 rounded-xl border border-border hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
                                >
                                    <div>
                                        <p className="font-medium text-foreground group-hover:text-blue-600 transition-colors">{p.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{p.readingTime}</p>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
