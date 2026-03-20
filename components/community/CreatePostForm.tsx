'use client'

import { useState, useRef } from 'react'
import { useLocale } from 'next-intl'
import { ImagePlus, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface CreatePostFormProps {
    user: {
        id: string | number
        fullName: string | null | undefined
        avatarUrl: string | null | undefined
    } | null
    onPostCreated: () => void
}

export default function CreatePostForm({ user, onPostCreated }: CreatePostFormProps) {
    const locale = useLocale()
    const [content, setContent] = useState('')
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const supabase = createClient()
            // Sanitize filename: remove special chars, keep extension
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

            const { data, error } = await supabase.storage
                .from('community-images')
                .upload(fileName, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('community-images')
                .getPublicUrl(data.path)

            setImageUrl(publicUrl)
        } catch (error) {
            console.error('Upload failed:', error)
            alert(locale === 'vi' ? 'Tải ảnh thất bại' : 'Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async () => {
        if (!content.trim() || !user) return

        setIsPosting(true)
        try {
            const res = await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, imageUrl }),
            })

            if (!res.ok) throw new Error('Failed to create post')

            setContent('')
            setImageUrl(null)
            onPostCreated()
        } catch (error) {
            console.error('Post failed:', error)
            alert(locale === 'vi' ? 'Đăng bài thất bại' : 'Failed to create post')
        } finally {
            setIsPosting(false)
        }
    }

    if (!user) {
        return (
            <div className="bg-card border border-border rounded-xl p-4 text-center text-muted-foreground">
                {locale === 'vi'
                    ? 'Đăng nhập để đăng bài và tương tác'
                    : 'Sign in to post and interact'}
            </div>
        )
    }

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback>
                        {user.fullName?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={
                            locale === 'vi'
                                ? 'Chia sẻ kinh nghiệm, hỏi đáp...'
                                : "Share your experience, ask questions..."
                        }
                        className="min-h-[80px] resize-none border-none focus-visible:ring-0 p-0 text-base"
                    />

                    {/* Image Preview */}
                    {imageUrl && (
                        <div className="relative mt-3 w-full rounded-lg overflow-hidden">
                            <Image
                                src={imageUrl}
                                alt="Preview"
                                width={800}
                                height={600}
                                className="w-full h-auto object-contain"
                            />
                            <button
                                onClick={() => setImageUrl(null)}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <ImagePlus className="h-4 w-4 mr-1" />
                            )}
                            {locale === 'vi' ? 'Thêm ảnh' : 'Add image'}
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!content.trim() || isPosting}
                        >
                            {isPosting ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-1" />
                            )}
                            {locale === 'vi' ? 'Đăng' : 'Post'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
