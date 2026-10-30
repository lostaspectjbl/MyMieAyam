'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
    favoritId: string
}

export default function FavoritRemoveButton({ favoritId }: Props) {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [removing, setRemoving] = useState(false)
    const [error, setError] = useState('')

    const handleRemove = async () => {
        if (removing) return

        setRemoving(true)
        setError('')

        try {
            const { error: deleteError } = await supabase
                .from('favorit')
                .delete()
                .eq('id', favoritId)

            if (deleteError) throw deleteError
            router.refresh()
        } catch (err) {
            console.error('Gagal menghapus favorit:', err)
            setError('Gagal menghapus favorit. Coba lagi.')
        } finally {
            setRemoving(false)
        }
    }

    return (
        <button
            onClick={handleRemove}
            disabled={removing}
            className="absolute top-3 left-3 z-10 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110 disabled:cursor-wait disabled:opacity-70"
            title={error || 'Hapus dari favorit'}
            aria-label="Hapus dari favorit"
        >
            {removing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
            {error && (
                <span className="sr-only" role="alert">
                    {error}
                </span>
            )}
        </button>
    )
}
