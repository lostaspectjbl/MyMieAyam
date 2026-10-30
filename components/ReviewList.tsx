'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StarRating from './StarRating'
import ReviewForm from './ReviewForm'
import { User as UserIcon, Loader2, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import type { ReviewWithProfile } from '@/types'

type Props = {
    warungId: string
    refreshKey?: number
    currentUserId?: string
    isAdmin?: boolean
}

export default function ReviewList({
    warungId,
    refreshKey,
    currentUserId,
    isAdmin = false,
}: Props) {
    const [reviews, setReviews] = useState<ReviewWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [actionError, setActionError] = useState('')
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    const loadReviews = useCallback(async () => {
        const { data: reviewsData, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('warung_id', warungId)
            .order('created_at', { ascending: false })

        if (error) {
            return { reviews: [] as ReviewWithProfile[], error }
        }

        if (!reviewsData || reviewsData.length === 0) {
            return { reviews: [] as ReviewWithProfile[], error: null }
        }

        const userIds = [...new Set(reviewsData.map((r) => r.user_id))]

        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds)

        if (profilesError) {
            console.error('Error fetching review profiles:', profilesError)
        }

        const merged = reviewsData.map((review) => {
            const userProfile = profilesData?.find((p) => p.id === review.user_id)
            return {
                ...review,
                profiles: userProfile ? {
                    username: userProfile.username,
                    avatar_url: userProfile.avatar_url
                } : null
            }
        })

        return { reviews: merged as ReviewWithProfile[], error: null }
    }, [supabase, warungId])

    const fetchReviews = useCallback(async () => {
        const result = await loadReviews()

        if (result.error) {
            console.error('Error fetching reviews:', result.error)
            setLoading(false)
            return
        }

        setReviews(result.reviews)
        setLoading(false)
    }, [loadReviews])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            const result = await loadReviews()
            if (cancelled) return

            if (result.error) {
                console.error('Error fetching reviews:', result.error)
                setLoading(false)
                return
            }

            setReviews(result.reviews)
            setLoading(false)
        }

        void load()

        return () => {
            cancelled = true
        }
    }, [loadReviews, refreshKey])

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel(`reviews-${warungId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reviews',
                    filter: `warung_id=eq.${warungId}`,
                },
                () => {
                    void fetchReviews()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, warungId, fetchReviews])

    const handleDelete = async (review: ReviewWithProfile) => {
        if (deletingId) return
        if (!confirm('Hapus review ini?')) return

        setDeletingId(review.id)
        setActionError('')

        try {
            const deleteQuery = isAdmin
                ? supabase.from('reviews').delete().eq('id', review.id)
                : supabase
                      .from('reviews')
                      .delete()
                      .eq('id', review.id)
                      .eq('user_id', currentUserId ?? '')

            const { data: deletedRows, error } = await deleteQuery.select('id')

            if (error) throw error
            if (!deletedRows?.length) {
                setActionError(
                    'Review tidak ditemukan atau kamu tidak berhak menghapusnya.'
                )
                return
            }

            if (editingId === review.id) setEditingId(null)
            await fetchReviews()
            router.refresh()
        } catch (err) {
            console.error('Gagal menghapus review:', err)
            setActionError('Gagal menghapus review. Coba lagi.')
        } finally {
            setDeletingId(null)
        }
    }

    const handleReviewUpdated = () => {
        setEditingId(null)
        void fetchReviews()
        router.refresh()
    }

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        )
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brown/5 dark:bg-warm/5 rounded-2xl mb-3">
                <MessageSquare className="w-7 h-7 text-muted/40 dark:text-warm/20" />
            </div>
            <p className="text-muted dark:text-warm/50">
                Belum ada review. Jadilah yang pertama!
            </p>
        </div>
        )
    }

    return (
        <div className="space-y-4">
            {actionError && (
                <p
                    className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                    role="alert"
                >
                    {actionError}
                </p>
            )}

            {reviews.map((review) => {
                const isOwner = !!currentUserId && review.user_id === currentUserId
                const canDelete = isOwner || isAdmin
                const isEditing = editingId === review.id

                return (
                    <div
                        key={review.id}
                        className="bg-white dark:bg-dark/60 border border-brown/10 dark:border-warm/10 rounded-xl p-5 space-y-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                                    <UserIcon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-brown dark:text-warm truncate">
                                        {review.profiles?.username || 'Anonim'}
                                    </p>
                                    <p className="text-xs text-muted dark:text-warm/40">
                                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <StarRating rating={review.rating} size="sm" />
                                {isOwner && (
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(review.id)}
                                        disabled={isEditing || deletingId === review.id}
                                        className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                        title="Edit review"
                                        aria-label="Edit review"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(review)}
                                        disabled={deletingId === review.id}
                                        className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:cursor-wait disabled:opacity-50"
                                        title="Hapus review"
                                        aria-label="Hapus review"
                                    >
                                        {deletingId === review.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="pl-0 sm:pl-12">
                                <ReviewForm
                                    key={review.id}
                                    warungId={warungId}
                                    userId={review.user_id}
                                    initialReview={review}
                                    onReviewSubmitted={handleReviewUpdated}
                                    onCancel={() => setEditingId(null)}
                                />
                            </div>
                        ) : (
                            review.komentar && (
                                <p className="text-sm text-brown/80 dark:text-warm/70 leading-relaxed pl-12">
                                    {review.komentar}
                                </p>
                            )
                        )}
                    </div>
                )
            })}
        </div>
    )
}
