import Link from 'next/link'
import Image from 'next/image'
import { MapPin, MessageCircle, UtensilsCrossed } from 'lucide-react'
import StarRating from './StarRating'
import type { WarungWithRating } from '@/types'

type WarungCardProps = {
    warung: WarungWithRating
}

export default function WarungCard({ warung }: WarungCardProps) {
    return (
        <Link href={`/warung/${warung.id}`} className="group block">
            <div className="bg-white dark:bg-dark/60 rounded-2xl overflow-hidden border border-brown/10 dark:border-warm/10 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] overflow-hidden bg-brown/5 dark:bg-warm/5">
                    {warung.foto_thumbnail ? (
                        <Image
                            src={warung.foto_thumbnail}
                            alt={warung.nama}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <UtensilsCrossed className="w-10 h-10 text-brown/20 dark:text-warm/20" />
                        </div>
                    )}

                    {/* Rating Badge */}
                    {warung.avg_rating > 0 && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <span className="text-accent">★</span>
                            {warung.avg_rating.toFixed(1)}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                    <h3 className="font-display text-xl text-brown dark:text-warm tracking-wide group-hover:text-primary transition-colors line-clamp-1">
                        {warung.nama.toUpperCase()}
                    </h3>

                    <div className="flex items-start gap-1.5 text-muted dark:text-warm/50">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <p className="text-xs leading-relaxed line-clamp-2">
                            {warung.alamat}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <StarRating rating={warung.avg_rating} size="sm" />
                        <div className="flex items-center gap-1 text-muted dark:text-warm/50 text-xs">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{warung.total_reviews} review</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
