'use client'

import { useState, useEffect, useMemo } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
    warungId: string
    userId?: string
}

export default function FavoriteButton({ warungId, userId }: Props) {
    const [isFavorited, setIsFavorited] = useState(false)
    const [loading, setLoading] = useState(true)
    const [animating, setAnimating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (!userId) return

        let cancelled = false

        const checkFavorit = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('favorit')
                    .select('id')
                    .eq('warung_id', warungId)
                    .eq('user_id', userId)
                    .maybeSingle()

                if (fetchError) {
                    console.error('Gagal memeriksa favorit:', fetchError)
                }
                if (!cancelled) setIsFavorited(!!data)
            } catch (err) {
                console.error('Gagal memeriksa favorit:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void checkFavorit()

        return () => {
            cancelled = true
        }
    }, [warungId, userId, supabase])

    const toggleFavorit = async () => {
        if (!userId || loading || saving) return

        const nextFavorited = !isFavorited
        setSaving(true)
        setError('')
        setAnimating(true)
        setTimeout(() => setAnimating(false), 300)
        setIsFavorited(nextFavorited)

        try {
            const { error: toggleError } = nextFavorited
                ? await supabase
                      .from('favorit')
                      .insert({ warung_id: warungId, user_id: userId })
                : await supabase
                      .from('favorit')
                      .delete()
                      .eq('warung_id', warungId)
                      .eq('user_id', userId)

            if (toggleError) {
                throw toggleError
            }
        } catch (err) {
            console.error('Gagal memperbarui favorit:', err)
            setIsFavorited(!nextFavorited)
            setError('Gagal memperbarui favorit. Coba lagi.')
        } finally {
            setSaving(false)
        }
    }

    if (!userId) return null

    return (
        <div className="inline-flex flex-col items-start gap-1">
            <button
                suppressHydrationWarning
                onClick={toggleFavorit}
                disabled={loading || saving}
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${isFavorited
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                        : 'bg-brown/5 dark:bg-warm/10 text-muted dark:text-warm/60 border border-brown/10 dark:border-warm/10 hover:border-red-500/30 hover:text-red-500'
                    } ${animating ? 'scale-110' : 'scale-100'} disabled:cursor-wait`}
                aria-label={isFavorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            >
                <Heart
                    className={`w-5 h-5 transition-all ${isFavorited ? 'fill-red-500 text-red-500' : ''
                        } ${animating ? 'scale-125' : ''}`}
                />
                <span className="text-sm">
                    {isFavorited ? 'Difavoritkan' : 'Favoritkan'}
                </span>
            </button>
            {error && (
                <span className="text-xs text-red-500" role="alert">
                    {error}
                </span>
            )}
        </div>
    )
}
