import { createClient } from '@/lib/supabase/server'
import WarungCard from '@/components/WarungCard'
import WarungSearch from './WarungSearch'
import { UtensilsCrossed } from 'lucide-react'
import type { WarungWithRating } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Daftar Warung',
    description:
        'Temukan semua warung mie ayam di Singosari, Malang. Cari berdasarkan nama dan lihat rating dari komunitas.',
}

type Props = {
    searchParams: Promise<{ q?: string }>
}

export default async function WarungPage({ searchParams }: Props) {
    const { q } = await searchParams
    const supabase = await createClient()

    let query = supabase
        .from('warung_with_rating')
        .select('*')
        .order('avg_rating', { ascending: false })

    if (q) {
        query = query.ilike('nama', `%${q}%`)
    }

    const { data } = await query
    const warungList = (data as WarungWithRating[]) || []

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-brown dark:text-warm tracking-wider">
                    DAFTAR <span className="text-primary">WARUNG</span>
                </h1>
                <p className="mt-3 text-muted dark:text-warm/60 max-w-md mx-auto">
                    Semua warung mie ayam di Singosari, Malang
                </p>
            </div>

            {/* Search */}
            <WarungSearch initialQuery={q || ''} />

            {/* Results */}
            {warungList.length > 0 ? (
                <>
                    <p className="text-sm text-muted dark:text-warm/50 mb-6">
                        {q ? `Hasil pencarian "${q}": ` : ''}
                        {warungList.length} warung ditemukan
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {warungList.map((warung, index) => (
                            <WarungCard key={warung.id} warung={warung} priority={index < 4} />
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                        <UtensilsCrossed className="w-8 h-8 text-primary/50" />
                    </div>
                    <h3 className="font-display text-2xl text-brown dark:text-warm tracking-wide mt-4">
                        {q ? 'TIDAK DITEMUKAN' : 'BELUM ADA WARUNG'}
                    </h3>
                    <p className="mt-2 text-muted dark:text-warm/60">
                        {q
                            ? `Warung dengan nama "${q}" tidak ditemukan. Coba kata kunci lain.`
                            : 'Warung mie ayam akan segera ditambahkan!'}
                    </p>
                </div>
            )}
        </div>
    )
}
