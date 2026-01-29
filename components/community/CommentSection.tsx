'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { Send, Loader2, Trash2, Reply, X, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { motion } from 'framer-motion'

interface Author {
    id: string | number
    fullName: string | null | undefined
    avatarUrl: string | null | undefined
}

interface CommentReply {
    id: number
    content: string
    createdAt: string
    author: Author
}

interface Comment {
    id: number
    content: string
    createdAt: string
    author: Author
    replies?: CommentReply[]
}

interface CommentSectionProps {
    postId: number | null
    isOpen: boolean
    onClose: () => void
    currentUser: Author | null
}

export default function CommentSection({
    postId,
    isOpen,
    onClose,
    currentUser,
}: CommentSectionProps) {
    const locale = useLocale()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null)
    const [editingComment, setEditingComment] = useState<{ id: number; content: string; parentId?: number } | null>(null)

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments()
        }
    }, [isOpen, postId])

    const fetchComments = async () => {
        if (!postId) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/community/posts/${postId}/comments`)
            if (res.ok) {
                const data = await res.json()
                setComments(data)
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !postId || !currentUser) return

        setIsSending(true)
        try {
            const res = await fetch(`/api/community/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    parentId: replyingTo?.id || null
                }),
            })

            if (res.ok) {
                const comment = await res.json()
                if (replyingTo) {
                    // Add reply to parent comment
                    setComments(prev => prev.map(c =>
                        c.id === replyingTo.id
                            ? { ...c, replies: [...(c.replies || []), comment] }
                            : c
                    ))
                } else {
                    // Add new top-level comment
                    setComments(prev => [...prev, { ...comment, replies: [] }])
                }
                setNewComment('')
                setReplyingTo(null)
            }
        } catch (error) {
            console.error('Failed to add comment:', error)
        } finally {
            setIsSending(false)
        }
    }

    const handleDelete = async (commentId: number, parentId?: number) => {
        if (!postId) return

        try {
            const res = await fetch(
                `/api/community/posts/${postId}/comments?commentId=${commentId}`,
                { method: 'DELETE' }
            )

            if (res.ok) {
                if (parentId) {
                    // Remove reply from parent
                    setComments(prev => prev.map(c =>
                        c.id === parentId
                            ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }
                            : c
                    ))
                } else {
                    // Remove top-level comment
                    setComments(prev => prev.filter(c => c.id !== commentId))
                }
            }
        } catch (error) {
            console.error('Failed to delete comment:', error)
        }
    }

    const isAuthor = (authorId: string | number) => {
        return currentUser && String(currentUser.id) === String(authorId)
    }

    const handleEdit = async () => {
        if (!editingComment || !postId) return

        try {
            const res = await fetch(`/api/community/posts/${postId}/comments`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commentId: editingComment.id,
                    content: editingComment.content
                }),
            })

            if (res.ok) {
                const updated = await res.json()
                if (editingComment.parentId) {
                    // Update reply
                    setComments(prev => prev.map(c =>
                        c.id === editingComment.parentId
                            ? { ...c, replies: (c.replies || []).map(r => r.id === updated.id ? { ...r, content: updated.content } : r) }
                            : c
                    ))
                } else {
                    // Update top-level comment
                    setComments(prev => prev.map(c =>
                        c.id === updated.id ? { ...c, content: updated.content } : c
                    ))
                }
                setEditingComment(null)
            }
        } catch (error) {
            console.error('Failed to edit comment:', error)
        }
    }

    const renderComment = (comment: CommentReply | Comment, isReply = false, parentId?: number) => (
        <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}
        >
            <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={comment.author.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                    {comment.author.fullName?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-muted rounded-xl px-3 py-2">
                    <p className="font-medium text-sm">
                        {comment.author.fullName || 'Anonymous'}
                    </p>
                    <p className="text-sm">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 ml-2">
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: locale === 'vi' ? vi : enUS,
                        })}
                    </span>
                    {!isReply && (
                        <button
                            onClick={() => setReplyingTo({
                                id: comment.id,
                                name: comment.author.fullName || 'Anonymous'
                            })}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                            <Reply className="h-3 w-3" />
                            {locale === 'vi' ? 'Trả lời' : 'Reply'}
                        </button>
                    )}
                    {isAuthor(comment.author.id) && (
                        <>
                            <button
                                onClick={() => setEditingComment({
                                    id: comment.id,
                                    content: comment.content,
                                    parentId: parentId
                                })}
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                                <Pencil className="h-3 w-3" />
                                {locale === 'vi' ? 'Sửa' : 'Edit'}
                            </button>
                            <button
                                onClick={() => handleDelete(comment.id, parentId)}
                                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                            >
                                <Trash2 className="h-3 w-3" />
                                {locale === 'vi' ? 'Xóa' : 'Delete'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    )

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>
                        {locale === 'vi' ? 'Bình luận' : 'Comments'}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-120px)] mt-4 px-2">
                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                {locale === 'vi' ? 'Chưa có bình luận nào' : 'No comments yet'}
                            </p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="space-y-2">
                                    {renderComment(comment)}
                                    {/* Replies */}
                                    {comment.replies?.map((reply) =>
                                        renderComment(reply, true, comment.id)
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Reply indicator */}
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg mb-2">
                            <span className="text-sm text-muted-foreground">
                                {locale === 'vi' ? 'Đang trả lời' : 'Replying to'} <strong>{replyingTo.name}</strong>
                            </span>
                            <button onClick={() => setReplyingTo(null)}>
                                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>
                        </div>
                    )}

                    {/* Edit indicator */}
                    {editingComment && (
                        <div className="bg-muted px-3 py-2 rounded-lg mb-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {locale === 'vi' ? 'Đang sửa bình luận' : 'Editing comment'}
                                </span>
                                <button onClick={() => setEditingComment(null)}>
                                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={editingComment.content}
                                    onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                    className="flex-1"
                                />
                                <Button size="sm" onClick={handleEdit} disabled={!editingComment.content.trim()}>
                                    {locale === 'vi' ? 'Lưu' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    {currentUser ? (
                        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t mt-2">
                            <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={
                                    replyingTo
                                        ? (locale === 'vi' ? 'Viết trả lời...' : 'Write a reply...')
                                        : (locale === 'vi' ? 'Viết bình luận...' : 'Write a comment...')
                                }
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={!newComment.trim() || isSending}>
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                    ) : (
                        <p className="text-center text-muted-foreground py-4 border-t">
                            {locale === 'vi' ? 'Đăng nhập để bình luận' : 'Sign in to comment'}
                        </p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
