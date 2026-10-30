'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import type { WarungFoto } from '@/types'

type Props = {
    fotos: WarungFoto[]
}

export default function PhotoGallery({ fotos }: Props) {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (!lightboxOpen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setLightboxOpen(false)
            } else if (event.key === 'ArrowRight') {
                setCurrentIndex((prev) => (prev + 1) % fotos.length)
            } else if (event.key === 'ArrowLeft') {
                setCurrentIndex(
                    (prev) => (prev - 1 + fotos.length) % fotos.length
                )
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [lightboxOpen, fotos.length])

    if (fotos.length === 0) {
        return (
        <div className="aspect-video bg-brown/5 dark:bg-warm/5 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-brown/8 dark:bg-warm/8 rounded-2xl mb-2">
                        <Camera className="w-7 h-7 text-muted/40 dark:text-warm/20" />
                    </div>
                    <p className="mt-2 text-muted dark:text-warm/50 text-sm">
                        Belum ada foto
                    </p>
                </div>
            </div>
        )
    }

    const openLightbox = (index: number) => {
        setCurrentIndex(index)
        setLightboxOpen(true)
    }

    const closeLightbox = () => {
        setLightboxOpen(false)
    }

    const goNext = () => {
        setCurrentIndex((prev) => (prev + 1) % fotos.length)
    }

    const goPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + fotos.length) % fotos.length)
    }

    return (
        <>
            {/* Gallery Grid */}
            <div
                className={`grid gap-2 rounded-2xl overflow-hidden ${fotos.length === 1
                        ? 'grid-cols-1'
                        : fotos.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-2 md:grid-cols-3'
                    }`}
            >
                {fotos.map((foto, index) => (
                    <button
                        key={foto.id}
                        onClick={() => openLightbox(index)}
                        type="button"
                        aria-label={`Buka foto ${index + 1}`}
                        className={`relative overflow-hidden group ${index === 0 && fotos.length > 2
                                ? 'col-span-2 row-span-2 aspect-[4/3]'
                                : 'aspect-square'
                            }`}
                    >
                        <Image
                            src={foto.foto_url}
                            alt={`Foto ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Galeri foto"
                >
                    {/* Close */}
                    <button
                        onClick={closeLightbox}
                        type="button"
                        aria-label="Tutup galeri"
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Counter */}
                    <div className="absolute top-4 left-4 text-white/70 text-sm z-10">
                        {currentIndex + 1} / {fotos.length}
                    </div>

                    {/* Navigation */}
                    {fotos.length > 1 && (
                        <>
                            <button
                                onClick={goPrev}
                                type="button"
                                aria-label="Foto sebelumnya"
                                className="absolute left-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={goNext}
                                type="button"
                                aria-label="Foto berikutnya"
                                className="absolute right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Image */}
                    <div className="relative w-full h-full max-w-4xl max-h-[80vh] mx-8">
                        <Image
                            src={fotos[currentIndex].foto_url}
                            alt={`Foto ${currentIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                        />
                    </div>
                </div>
            )}
        </>
    )
}
