'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'

type StarRatingProps = {
    rating: number
    interactive?: boolean
    onRate?: (rating: number) => void
    size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({
    rating,
    interactive = false,
    onRate,
    size = 'md',
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0)

    const sizeMap = {
        sm: 'w-3.5 h-3.5',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    }

    const iconSize = sizeMap[size]

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = interactive
                    ? star <= (hoverRating || rating)
                    : star <= Math.round(rating)

                return (
                    <button
                        key={star}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onRate?.(star)}
                        onMouseEnter={() => interactive && setHoverRating(star)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        className={`${interactive
                                ? 'cursor-pointer hover:scale-110 transition-transform'
                                : 'cursor-default'
                            }`}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                        <Star
                            className={`${iconSize} transition-colors duration-150 ${filled
                                    ? 'fill-accent text-accent'
                                    : 'fill-transparent text-muted/40'
                                }`}
                        />
                    </button>
                )
            })}
        </div>
    )
}
