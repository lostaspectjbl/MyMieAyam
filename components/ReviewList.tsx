'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StarRating from './StarRating'
import { User as UserIcon, Loader2 } from 'lucide-react'
import type { ReviewWithProfile } from '@/types'

type Props = {
    warungId: string
    refreshKey?: number
}

export default function ReviewList({ warungId, refreshKey }: Props) {
    const [reviews, setReviews] = useState<ReviewWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchReviews = async () => {
        const { data } = await supabase
            .from('reviews')
            .select('*, profiles(username, avatar_url)')
            .eq('warung_id', warungId)
            .order('created_at', { ascending: false })

        if (data) {
            setReviews(data as unknown as ReviewWithProfile[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchReviews()
    }, [warungId, refreshKey])

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel(`reviews-${warungId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reviews',
                    filter: `warung_id=eq.${warungId}`,
                },
                () => {
                    fetchReviews()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [warungId])

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
                <span className="text-4xl">💬</span>
                <p className="mt-3 text-muted dark:text-warm/50">
                    Belum ada review. Jadilah yang pertama!
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className="bg-white dark:bg-dark/60 border border-brown/10 dark:border-warm/10 rounded-xl p-5 space-y-3"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-brown dark:text-warm">
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
                        <StarRating rating={review.rating} size="sm" />
                    </div>

                    {review.komentar && (
                        <p className="text-sm text-brown/80 dark:text-warm/70 leading-relaxed pl-12">
                            {review.komentar}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}
