import { MapPin, MessageCircle } from 'lucide-react'

export default function WarungCardSkeleton() {
    return (
        <div className="bg-white dark:bg-dark/60 rounded-2xl overflow-hidden border border-brown/10 dark:border-warm/10 shadow-sm animate-pulse">
            {/* Thumbnail Skeleton */}
            <div className="relative aspect-[4/3] bg-brown/10 dark:bg-warm/10"></div>

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-6 bg-brown/10 dark:bg-warm/10 rounded-md w-3/4"></div>

                {/* Address */}
                <div className="flex items-start gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brown/20 dark:text-warm/20" />
                    <div className="space-y-1.5 flex-1">
                        <div className="h-3 bg-brown/10 dark:bg-warm/10 rounded w-full"></div>
                        <div className="h-3 bg-brown/10 dark:bg-warm/10 rounded w-4/5"></div>
                    </div>
                </div>

                {/* Bottom row (Rating & Reviews) */}
                <div className="flex items-center justify-between pt-3">
                    <div className="h-4 bg-brown/10 dark:bg-warm/10 rounded w-16"></div>
                    <div className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-brown/20 dark:text-warm/20" />
                        <div className="h-3 bg-brown/10 dark:bg-warm/10 rounded w-12"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
