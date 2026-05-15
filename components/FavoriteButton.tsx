'use client'

import { useState, useEffect } from 'react'
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
    const supabase = createClient()

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const checkFavorit = async () => {
            const { data } = await supabase
                .from('favorit')
                .select('id')
                .eq('warung_id', warungId)
                .eq('user_id', userId)
                .single()

            setIsFavorited(!!data)
            setLoading(false)
        }

        checkFavorit()
    }, [warungId, userId])

    const toggleFavorit = async () => {
        if (!userId || loading) return

        setAnimating(true)
        setTimeout(() => setAnimating(false), 300)

        if (isFavorited) {
            setIsFavorited(false)
            await supabase
                .from('favorit')
                .delete()
                .eq('warung_id', warungId)
                .eq('user_id', userId)
        } else {
            setIsFavorited(true)
            await supabase
                .from('favorit')
                .insert({ warung_id: warungId, user_id: userId })
        }
    }

    if (!userId) return null

    return (
        <button
            suppressHydrationWarning
            onClick={toggleFavorit}
            disabled={loading}
            className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${isFavorited
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                    : 'bg-brown/5 dark:bg-warm/10 text-muted dark:text-warm/60 border border-brown/10 dark:border-warm/10 hover:border-red-500/30 hover:text-red-500'
                } ${animating ? 'scale-110' : 'scale-100'}`}
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
    )
}
