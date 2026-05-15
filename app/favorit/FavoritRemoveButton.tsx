'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
    favoritId: string
}

export default function FavoritRemoveButton({ favoritId }: Props) {
    const router = useRouter()
    const supabase = createClient()

    const handleRemove = async () => {
        await supabase.from('favorit').delete().eq('id', favoritId)
        router.refresh()
    }

    return (
        <button
            onClick={handleRemove}
            className="absolute top-3 left-3 z-10 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
            title="Hapus dari favorit"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
