'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { Heart, MessageCircle, MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'

interface Author {
    id: number | string
    fullName: string | null
    avatarUrl: string | null
}

interface Reaction {
    id: number
    type: string
    userId: number
}

interface Post {
    id: number
    content: string
    imageUrl: string | null
    createdAt: string
    author: Author
    reactions: Reaction[]
    _count: { comments: number }
    currentUserReaction: string | null
}

interface PostCardProps {
    post: Post
    currentUserId?: number | string
    onReact: (postId: number, type: string) => void
    onDelete: (postId: number) => void
    onEdit: (postId: number, content: string) => void
    onOpenComments: (postId: number) => void
}

const REACTIONS = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' },
]

export default function PostCard({
    post,
    currentUserId,
    onReact,
    onDelete,
    onEdit,
    onOpenComments,
}: PostCardProps) {
    const locale = useLocale()
    const [showReactions, setShowReactions] = useState(false)

    const userReaction = post.currentUserReaction
        ? { type: post.currentUserReaction }
        : null
    const isAuthor = String(currentUserId) === String(post.author.id)

    const reactionCounts = REACTIONS.reduce((acc, { type }) => {
        acc[type] = post.reactions.filter(r => r.type === type).length
        return acc
    }, {} as Record<string, number>)

    const totalReactions = post.reactions.length
    const topReactions = REACTIONS
        .filter(r => reactionCounts[r.type] > 0)
        .slice(0, 3)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 shadow-sm"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author.avatarUrl || undefined} />
                        <AvatarFallback>
                            {post.author.fullName?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-foreground">
                            {post.author.fullName || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.createdAt), {
                                addSuffix: true,
                                locale: locale === 'vi' ? vi : enUS,
                            })}
                        </p>
                    </div>
                </div>

                {isAuthor && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => onEdit(post.id, post.content)}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                {locale === 'vi' ? 'Sửa bài' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(post.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {locale === 'vi' ? 'Xóa bài' : 'Delete'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Content */}
            <p className="text-foreground whitespace-pre-wrap mb-3">{post.content}</p>

            {/* Image */}
            {post.imageUrl && (
                <div className="relative w-full mb-3 rounded-lg overflow-hidden">
                    <Image
                        src={post.imageUrl}
                        alt="Post image"
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain"
                    />
                </div>
            )}



            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Reaction Button */}
                <div
                    className="relative"
                    onMouseEnter={() => setShowReactions(true)}
                    onMouseLeave={() => setShowReactions(false)}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className={userReaction ? 'text-primary' : ''}
                        onClick={() => onReact(post.id, userReaction ? '' : 'like')}
                    >
                        {userReaction ? (
                            <span className="text-lg mr-1">
                                {REACTIONS.find(r => r.type === userReaction.type)?.emoji}
                            </span>
                        ) : (
                            <Heart className="h-4 w-4 mr-1" />
                        )}
                        {totalReactions > 0 && (
                            <span className="mr-1">{totalReactions}</span>
                        )}
                    </Button>

                    {/* Reaction Picker */}
                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-full left-0 mb-2 flex gap-1 bg-card border border-border rounded-full px-2 py-1 shadow-lg"
                            >
                                {REACTIONS.map(reaction => (
                                    <button
                                        key={reaction.type}
                                        className="text-xl hover:scale-125 transition-transform p-1"
                                        onClick={() => {
                                            onReact(post.id, reaction.type)
                                            setShowReactions(false)
                                        }}
                                        title={reaction.label}
                                    >
                                        {reaction.emoji}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Comment Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenComments(post.id)}
                >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post._count.comments > 0 && (
                        <span className="mr-1">{post._count.comments}</span>
                    )}
                </Button>
            </div>
        </motion.div>
    )
}
