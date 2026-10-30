'use client'

import { useMemo, useState } from 'react'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StarRating from './StarRating'

type ReviewFormReview = {
    id: string
    rating: number
    komentar: string | null
}

type Props = {
    warungId: string
    userId: string
    onReviewSubmitted: () => void
    initialReview?: ReviewFormReview
    onCancel?: () => void
}

export default function ReviewForm({
    warungId,
    userId,
    onReviewSubmitted,
    initialReview,
    onCancel,
}: Props) {
    const isEditing = !!initialReview
    const [rating, setRating] = useState(initialReview?.rating ?? 0)
    const [komentar, setKomentar] = useState(initialReview?.komentar ?? '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (rating === 0) {
            setError('Pilih rating terlebih dahulu')
            return
        }

        setLoading(true)

        try {
            const payload = {
                rating,
                komentar: komentar.trim() || null,
            }

            const { data: savedRows, error: submitError } = initialReview
                ? await supabase
                      .from('reviews')
                      .update(payload)
                      .eq('id', initialReview.id)
                      .eq('user_id', userId)
                      .select('id')
                : await supabase
                      .from('reviews')
                      .insert({
                          ...payload,
                          warung_id: warungId,
                          user_id: userId,
                      })
                      .select('id')

            if (submitError) {
                if (submitError.code === '23505') {
                    setError('Kamu sudah pernah review warung ini')
                } else {
                    setError(
                        isEditing
                            ? 'Gagal memperbarui review. Coba lagi nanti.'
                            : 'Gagal mengirim review. Coba lagi nanti.'
                    )
                }
                return
            }

            if (!savedRows?.length) {
                setError(
                    isEditing
                        ? 'Review tidak ditemukan atau kamu tidak berhak mengubahnya.'
                        : 'Review gagal disimpan. Coba lagi.'
                )
                return
            }

            setSuccess(true)
            onReviewSubmitted()
        } catch (err) {
            console.error('Gagal menyimpan review:', err)
            setError(
                isEditing
                    ? 'Gagal memperbarui review. Periksa koneksi lalu coba lagi.'
                    : 'Gagal mengirim review. Periksa koneksi lalu coba lagi.'
            )
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/15 rounded-full mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-green-700 dark:text-green-400 font-medium">
                    {isEditing
                        ? 'Review berhasil diperbarui!'
                        : 'Review berhasil dikirim!'}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    {isEditing
                        ? 'Perubahan review kamu sudah disimpan.'
                        : 'Terima kasih sudah berbagi pengalaman kamu.'}
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-brown dark:text-warm mb-2">
                    Rating
                </label>
                <StarRating rating={rating} interactive onRate={setRating} size="lg" />
            </div>

            <div>
                <label
                    htmlFor="komentar"
                    className="block text-sm font-medium text-brown dark:text-warm mb-2"
                >
                    Komentar{' '}
                    <span className="text-muted dark:text-warm/40">(opsional)</span>
                </label>
                <textarea
                    id="komentar"
                    value={komentar}
                    onChange={(e) => setKomentar(e.target.value)}
                    placeholder="Ceritakan pengalaman kamu makan di sini..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white dark:bg-dark/60 border border-brown/15 dark:border-warm/15 rounded-xl text-brown dark:text-warm placeholder:text-muted/50 dark:placeholder:text-warm/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
            </div>

            {error && (
                <p className="text-red-500 text-sm bg-red-500/10 px-4 py-2.5 rounded-lg">
                    {error}
                </p>
            )}

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={loading || rating === 0}
                    className="flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    {loading
                        ? isEditing
                            ? 'Menyimpan...'
                            : 'Mengirim...'
                        : isEditing
                          ? 'Simpan Perubahan'
                          : 'Kirim Review'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-5 py-3 border border-brown/15 dark:border-warm/15 text-muted dark:text-warm/60 font-medium rounded-xl hover:bg-brown/5 dark:hover:bg-warm/5 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Batal
                    </button>
                )}
            </div>
        </form>
    )
}
