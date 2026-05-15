import Link from 'next/link'
import { ArrowRight, Star, Users, Store, UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import WarungCard from '@/components/WarungCard'
import WarungListSkeleton from '@/components/WarungListSkeleton'
import { Suspense } from 'react'
import type { WarungWithRating } from '@/types'

async function TopWarungList() {
  const supabase = await createClient()

  const { data: topWarung } = await supabase
    .from('warung_with_rating')
    .select('*')
    .order('avg_rating', { ascending: false })
    .limit(6)

  const warungList = (topWarung as WarungWithRating[]) || []

  if (warungList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted dark:text-warm/60">Belum ada data warung.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {warungList.map((warung, index) => (
        <WarungCard key={warung.id} warung={warung} priority={index < 3} />
      ))}
    </div>
  )
}

export default function HomePage() {

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full text-primary text-sm font-medium animate-fade-in">
              <UtensilsCrossed className="w-4 h-4" />
              Singosari, Malang
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-brown dark:text-warm tracking-wider leading-none animate-fade-in">
              REKOMENDASI
              <br />
              <span className="text-primary">MIE AYAM</span>
              <br />
              FAVORIT GUE
            </h1>

            {/* Subtitle */}
            <p className="text-muted dark:text-warm/60 text-base sm:text-lg max-w-xl mx-auto animate-slide-up">
              Temukan mie ayam terbaik di Singosari dari rekomendasi tim kami dan
              review komunitas. UMKM lokal yang wajib kamu coba!
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up">
              <Link
                href="/warung"
                className="group flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 animate-pulse-glow"
              >
                Cari Mie Ayam
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/register"
                className="px-8 py-3.5 border-2 border-brown/20 dark:border-warm/20 text-brown dark:text-warm font-medium rounded-xl hover:border-primary hover:text-primary transition-all duration-300"
              >
                Gabung Komunitas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Warung Terpopuler */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brown dark:text-warm tracking-wider">
            WARUNG <span className="text-primary">TERPOPULER</span>
          </h2>
          <p className="mt-3 text-muted dark:text-warm/60 text-sm sm:text-base max-w-lg mx-auto">
            Pilihan terbaik berdasarkan rating dari komunitas kami
          </p>
        </div>

        <Suspense fallback={<WarungListSkeleton count={6} />}>
          <TopWarungList />
        </Suspense>

        <div className="text-center mt-10">
          <Link
            href="/warung"
            className="inline-flex items-center gap-2 px-6 py-3 text-primary font-medium hover:bg-primary/10 rounded-xl transition-all duration-200"
          >
            Lihat Semua Warung
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Kenapa MMA */}
      <section className="bg-brown/5 dark:bg-warm/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brown dark:text-warm tracking-wider">
              KENAPA <span className="text-primary">MMA?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="group bg-white dark:bg-dark/60 rounded-2xl p-8 border border-brown/10 dark:border-warm/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl text-brown dark:text-warm tracking-wide mb-2">
                KONTEN ORIGINAL
              </h3>
              <p className="text-muted dark:text-warm/60 text-sm leading-relaxed">
                Setiap warung kami kunjungi, cicipi, dan ulas sendiri. Bukan asal
                copy-paste, tapi pengalaman langsung dari tim MMA.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-white dark:bg-dark/60 rounded-2xl p-8 border border-brown/10 dark:border-warm/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="w-14 h-14 bg-accent/10 dark:bg-accent/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-display text-xl text-brown dark:text-warm tracking-wide mb-2">
                REVIEW KOMUNITAS
              </h3>
              <p className="text-muted dark:text-warm/60 text-sm leading-relaxed">
                Gabung dan share pengalaman mie ayam favoritmu. Rating dan review
                dari sesama pecinta mie ayam Singosari.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-white dark:bg-dark/60 rounded-2xl p-8 border border-brown/10 dark:border-warm/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Store className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl text-brown dark:text-warm tracking-wide mb-2">
                DUKUNG UMKM LOKAL
              </h3>
              <p className="text-muted dark:text-warm/60 text-sm leading-relaxed">
                Bantu warung mie ayam lokal lebih dikenal. Setiap kunjungan dan
                review kamu berarti besar buat mereka.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-16 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

          <div className="relative space-y-5">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white tracking-wider">
              SIAP CARI MIE AYAM
              <br />
              TERBAIK?
            </h2>
            <p className="text-white/80 max-w-lg mx-auto">
              Daftar sekarang dan mulai eksplor warung mie ayam favorit kamu di
              Singosari. Gratis selamanya!
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-warm transition-all duration-300 hover:shadow-lg"
            >
              Daftar Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
