import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WarungCard from '@/components/WarungCard'
import FavoritRemoveButton from './FavoritRemoveButton'
import { Heart } from 'lucide-react'
import type { WarungWithRating } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Favorit Saya',
    description: 'Daftar warung mie ayam favorit kamu di MMA.',
}

export default async function FavoritPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    // Fetch user's favorites with warung data
    const { data: favorits } = await supabase
        .from('favorit')
        .select('id, warung_id')
        .eq('user_id', user.id)

    let warungList: WarungWithRating[] = []

    if (favorits && favorits.length > 0) {
        const warungIds = favorits.map((f) => f.warung_id)
        const { data: warungs } = await supabase
            .from('warung_with_rating')
            .select('*')
            .in('id', warungIds)

        warungList = (warungs as WarungWithRating[]) || []
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-500/10 rounded-2xl mb-4">
                    <Heart className="w-7 h-7 text-red-500 fill-red-500" />
                </div>
                <h1 className="font-display text-4xl sm:text-5xl text-brown dark:text-warm tracking-wider">
                    WARUNG <span className="text-primary">FAVORIT</span>
                </h1>
                <p className="mt-2 text-muted dark:text-warm/60">
                    Warung mie ayam yang kamu simpan
                </p>
            </div>

            {warungList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {warungList.map((warung) => {
                        const favoritId = favorits?.find(
                            (f) => f.warung_id === warung.id
                        )?.id
                        return (
                            <div key={warung.id} className="relative">
                                <WarungCard warung={warung} />
                                {favoritId && <FavoritRemoveButton favoritId={favoritId} />}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20">
                    <span className="text-6xl">💔</span>
                    <h3 className="font-display text-2xl text-brown dark:text-warm tracking-wide mt-4">
                        BELUM ADA FAVORIT
                    </h3>
                    <p className="mt-2 text-muted dark:text-warm/60 max-w-md mx-auto">
                        Kamu belum menyimpan warung apapun. Eksplor warung mie ayam dan klik
                        tombol ❤️ untuk menyimpannya!
                    </p>
                    <Link
                        href="/warung"
                        className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all"
                    >
                        Eksplor Warung
                    </Link>
                </div>
            )}
        </div>
    )
}
