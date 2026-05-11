'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StarRating from './StarRating'

type Props = {
    warungId: string
    userId: string
    onReviewSubmitted: () => void
}

export default function ReviewForm({
    warungId,
    userId,
    onReviewSubmitted,
}: Props) {
    const [rating, setRating] = useState(0)
    const [komentar, setKomentar] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (rating === 0) {
            setError('Pilih rating terlebih dahulu')
            return
        }

        setLoading(true)

        const { error: submitError } = await supabase.from('reviews').insert({
            warung_id: warungId,
            user_id: userId,
            rating,
            komentar: komentar.trim() || null,
        })

        setLoading(false)

        if (submitError) {
            if (submitError.code === '23505') {
                setError('Kamu sudah pernah review warung ini')
            } else {
                setError('Gagal mengirim review. Coba lagi nanti.')
            }
            return
        }

        setSuccess(true)
        onReviewSubmitted()
    }

    if (success) {
        return (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                <span className="text-3xl">🎉</span>
                <p className="mt-2 text-green-700 dark:text-green-400 font-medium">
                    Review berhasil dikirim!
                </p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Terima kasih sudah berbagi pengalaman kamu.
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

            <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
                {loading ? 'Mengirim...' : 'Kirim Review'}
            </button>
        </form>
    )
}
