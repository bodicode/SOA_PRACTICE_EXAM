'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Users, X } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import PostCard from '@/components/community/PostCard'
import CreatePostForm from '@/components/community/CreatePostForm'
import CommentSection from '@/components/community/CommentSection'
import { motion } from 'framer-motion'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface Author {
    id: string | number
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

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

export default function CommunityPage() {
    const t = useTranslations('community')
    const { user } = useUserStore()
    const [posts, setPosts] = useState<Post[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [openCommentPostId, setOpenCommentPostId] = useState<number | null>(null)

    const fetchPosts = useCallback(async (page = 1, append = false) => {
        if (page === 1) setIsLoading(true)
        else setIsLoadingMore(true)

        try {
            const res = await fetch(`/api/community/posts?page=${page}&limit=10`)
            if (res.ok) {
                const data = await res.json()
                if (append) {
                    setPosts(prev => [...prev, ...data.posts])
                } else {
                    setPosts(data.posts)
                }
                setPagination(data.pagination)
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error)
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    const handleReact = async (postId: number, type: string) => {
        if (!user) return

        // Optimistic update
        setPosts(prev => prev.map(post => {
            if (post.id !== postId) return post

            const hadReaction = post.currentUserReaction !== null
            let newReactions = [...post.reactions]

            if (type === '') {
                // Remove reaction - filter out one reaction (approximate)
                if (hadReaction) {
                    newReactions = newReactions.slice(0, -1)
                }
            } else if (!hadReaction) {
                // Add new reaction
                newReactions.push({
                    id: Date.now(),
                    type,
                    userId: 0, // Placeholder
                })
            }

            return {
                ...post,
                reactions: newReactions,
                currentUserReaction: type === '' ? null : type
            }
        }))

        // API call in background
        try {
            if (type === '') {
                await fetch(`/api/community/posts/${postId}/reactions`, {
                    method: 'DELETE',
                })
            } else {
                await fetch(`/api/community/posts/${postId}/reactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type }),
                })
            }
        } catch (error) {
            console.error('Failed to react:', error)
            // Revert on error
            fetchPosts()
        }
    }

    const [deletePostId, setDeletePostId] = useState<number | null>(null)

    const handleDelete = (postId: number) => {
        setDeletePostId(postId)
    }

    const confirmDelete = async () => {
        if (!deletePostId) return

        try {
            const res = await fetch(`/api/community/posts/${deletePostId}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== deletePostId))
                setDeletePostId(null)
            }
        } catch (error) {
            console.error('Failed to delete:', error)
        }
    }

    const [editingPost, setEditingPost] = useState<{ id: number; content: string } | null>(null)

    const handleEditStart = (postId: number, content: string) => {
        setEditingPost({ id: postId, content })
    }

    const handleEditSave = async () => {
        if (!editingPost) return

        try {
            const res = await fetch(`/api/community/posts/${editingPost.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editingPost.content }),
            })
            if (res.ok) {
                const updated = await res.json()
                setPosts(prev => prev.map(p =>
                    p.id === updated.id ? { ...p, content: updated.content } : p
                ))
                setEditingPost(null)
            }
        } catch (error) {
            console.error('Failed to edit:', error)
        }
    }

    const loadMore = () => {
        if (pagination && pagination.page < pagination.totalPages) {
            fetchPosts(pagination.page + 1, true)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('title')}</span>
                    </div>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </motion.div>

                {/* Create Post Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <CreatePostForm
                        user={user ? {
                            id: user.id,
                            fullName: user.fullName,
                            avatarUrl: user.avatarUrl,
                        } : null}
                        onPostCreated={() => fetchPosts()}
                    />
                </motion.div>

                {/* Posts Feed */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : posts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 text-muted-foreground"
                    >
                        <p>{t('noPosts')}</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <PostCard
                                    post={post}
                                    currentUserId={user?.id}
                                    onReact={handleReact}
                                    onDelete={handleDelete}
                                    onEdit={handleEditStart}
                                    onOpenComments={(id) => setOpenCommentPostId(id)}
                                />
                            </motion.div>
                        ))}

                        {/* Load More */}
                        {pagination && pagination.page < pagination.totalPages && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : null}
                                    {t('loadMore')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog open={deletePostId !== null} onOpenChange={() => setDeletePostId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
                            <DialogDescription>
                                {t('deleteConfirmDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletePostId(null)}>
                                {t('cancel')}
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                {t('delete')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Post Dialog */}
                {editingPost && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-background rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">
                                    {t('editPost')}
                                </h3>
                                <button onClick={() => setEditingPost(null)}>
                                    <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                                </button>
                            </div>
                            <Textarea
                                value={editingPost.content}
                                onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                                className="min-h-[150px] mb-4"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingPost(null)}>
                                    {t('cancel')}
                                </Button>
                                <Button onClick={handleEditSave} disabled={!editingPost.content.trim()}>
                                    {t('save')}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Comment Section Sheet */}
                <CommentSection
                    postId={openCommentPostId}
                    isOpen={openCommentPostId !== null}
                    onClose={() => setOpenCommentPostId(null)}
                    currentUser={user ? {
                        id: user.id,
                        fullName: user.fullName,
                        avatarUrl: user.avatarUrl,
                    } : null}
                />
            </div>
        </div>
    )
}
