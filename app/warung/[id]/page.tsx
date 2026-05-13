import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PhotoGallery from '@/components/PhotoGallery'
import StarRating from '@/components/StarRating'
import WarungDetailClient from './WarungDetailClient'
import { MapPin, MessageCircle, Star } from 'lucide-react'
import type { WarungWithRating, WarungFoto } from '@/types'
import type { Metadata } from 'next'

// Ekstrak URL src dari HTML <iframe> jika data disimpan sebagai kode embed lengkap
function getMapsEmbedUrl(raw: string): string {
    if (!raw) return ''
    const trimmed = raw.trim()
    if (trimmed.startsWith('<iframe') || trimmed.includes('src=')) {
        const match = trimmed.match(/src=["']([^"']+)["']/)
        if (match) return match[1]
    }
    return trimmed
}

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()
    const { data: warung } = await supabase
        .from('warung_with_rating')
        .select('nama, alamat')
        .eq('id', id)
        .single()

    if (!warung) return { title: 'Warung Tidak Ditemukan' }

    return {
        title: warung.nama,
        description: `Review dan info warung mie ayam ${warung.nama} di ${warung.alamat}`,
    }
}

export default async function WarungDetailPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch warung data
    const { data: warung } = await supabase
        .from('warung_with_rating')
        .select('*')
        .eq('id', id)
        .single()

    if (!warung) notFound()

    const warungData = warung as WarungWithRating

    // Fetch photos
    const { data: fotos } = await supabase
        .from('warung_foto')
        .select('*')
        .eq('warung_id', id)
        .order('urutan', { ascending: true })

    const fotoList = (fotos as WarungFoto[]) || []

    // Check user session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Check if user already reviewed
    let hasReviewed = false
    if (user) {
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('warung_id', id)
            .eq('user_id', user.id)
            .single()
        hasReviewed = !!existingReview
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            {/* Photo Gallery */}
            <PhotoGallery fotos={fotoList} />

            {/* Warung Info */}
            <div className="mt-8 space-y-6">
                {/* Header */}
                <div className="space-y-3">
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-brown dark:text-warm tracking-wider">
                        {warungData.nama.toUpperCase()}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 text-muted dark:text-warm/60">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{warungData.alamat}</span>
                        </div>

                        {warungData.avg_rating > 0 && (
                            <div className="flex items-center gap-2">
                                <StarRating rating={warungData.avg_rating} size="sm" />
                                <span className="text-sm font-medium text-brown dark:text-warm">
                                    {warungData.avg_rating.toFixed(1)}
                                </span>
                                <span className="text-sm text-muted dark:text-warm/50 flex items-center gap-1">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    {warungData.total_reviews} review
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {warungData.deskripsi && (
                    <div className="bg-brown/5 dark:bg-warm/5 rounded-2xl p-6">
                        <h2 className="font-display text-lg text-brown dark:text-warm tracking-wide mb-2">
                            TENTANG WARUNG
                        </h2>
                        <p className="text-muted dark:text-warm/60 leading-relaxed">
                            {warungData.deskripsi}
                        </p>
                    </div>
                )}

                {/* Google Maps */}
                {warungData.maps_embed && (
                    <div className="space-y-3">
                        <h2 className="font-display text-lg text-brown dark:text-warm tracking-wide flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            LOKASI
                        </h2>
                        <div className="rounded-2xl overflow-hidden border border-brown/10 dark:border-warm/10">
                            <iframe
                                src={getMapsEmbedUrl(warungData.maps_embed)}
                                width="100%"
                                height="300"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title={`Lokasi ${warungData.nama}`}
                            />
                        </div>
                    </div>
                )}

                {/* Divider */}
                <hr className="border-brown/10 dark:border-warm/10" />

                {/* Client Components (Favorite + Reviews) */}
                <WarungDetailClient
                    warungId={id}
                    userId={user?.id}
                    hasReviewed={hasReviewed}
                />
            </div>
        </div>
    )
}
