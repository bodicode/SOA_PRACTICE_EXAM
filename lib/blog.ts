import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

export interface BlogPost {
    slug: string
    title: string
    description: string
    date: string
    author: string
    tags: string[]
    readingTime: string
    locale: string
    content: string
    coverImage?: string
    featured?: boolean
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export function getBlogPosts(locale: string = 'vi'): BlogPost[] {
    const dir = path.join(BLOG_DIR, locale)
    if (!fs.existsSync(dir)) return []

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'))

    return files
        .map(filename => {
            const slug = filename.replace('.mdx', '')
            const raw = fs.readFileSync(path.join(dir, filename), 'utf-8')
            const { data, content } = matter(raw)
            return {
                slug,
                locale,
                content,
                title: data.title || '',
                description: data.description || '',
                date: data.date || new Date().toISOString(),
                author: data.author || 'SOA Exam Practice Team',
                tags: data.tags || [],
                coverImage: data.coverImage,
                featured: data.featured || false,
                readingTime: readingTime(content).text,
            }
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getBlogPost(slug: string, locale: string = 'vi'): BlogPost | null {
    try {
        const filePath = path.join(BLOG_DIR, locale, `${slug}.mdx`)
        if (!fs.existsSync(filePath)) return null
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data, content } = matter(raw)
        return {
            slug, locale, content,
            title: data.title || '',
            description: data.description || '',
            date: data.date || new Date().toISOString(),
            author: data.author || 'SOA Exam Practice Team',
            tags: data.tags || [],
            coverImage: data.coverImage,
            featured: data.featured || false,
            readingTime: readingTime(content).text,
        }
    } catch {
        return null
    }
}
