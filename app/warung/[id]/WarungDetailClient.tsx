'use client'

import { useState } from 'react'
import ReviewForm from '@/components/ReviewForm'
import ReviewList from '@/components/ReviewList'
import FavoriteButton from '@/components/FavoriteButton'
import { CheckCircle2 } from 'lucide-react'

type Props = {
    warungId: string
    userId?: string
    hasReviewed: boolean
}

export default function WarungDetailClient({
    warungId,
    userId,
    hasReviewed,
}: Props) {
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <>
            {/* Favorite + Review Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
                <FavoriteButton warungId={warungId} userId={userId} />
            </div>

            {/* Reviews Section */}
            <section className="space-y-6">
                <h2 className="font-display text-2xl sm:text-3xl text-brown dark:text-warm tracking-wider">
                    REVIEW <span className="text-primary">KOMUNITAS</span>
                </h2>

                {/* Review Form */}
                {userId && !hasReviewed ? (
                    <div className="bg-brown/5 dark:bg-warm/5 border border-brown/10 dark:border-warm/10 rounded-2xl p-6">
                        <h3 className="font-display text-lg text-brown dark:text-warm tracking-wide mb-4">
                            TULIS REVIEW
                        </h3>
                        <ReviewForm
                            warungId={warungId}
                            userId={userId}
                            onReviewSubmitted={() => setRefreshKey((k) => k + 1)}
                        />
                    </div>
                ) : userId && hasReviewed ? (
                    <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/20 rounded-xl px-5 py-3 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Kamu sudah memberikan review untuk warung ini
                    </div>
                ) : null}

                {/* Review List */}
                <ReviewList warungId={warungId} refreshKey={refreshKey} />
            </section>
        </>
    )
}
