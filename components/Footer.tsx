import Link from 'next/link'
import { UtensilsCrossed, MapPin, Mail, Heart } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-dark border-t border-brown/15 dark:border-warm/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                                <UtensilsCrossed className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-display text-2xl text-brown dark:text-warm tracking-wide">
                                MMA
                            </span>
                        </div>
                        <p className="text-muted dark:text-warm/60 text-sm leading-relaxed">
                            Rekomendasi Mie Ayam Favorit Gue. Platform direktori & review mie
                            ayam lokal di Singosari, Malang.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="space-y-4">
                        <h4 className="font-display text-lg text-brown dark:text-warm tracking-wide">
                            NAVIGASI
                        </h4>
                        <div className="flex flex-col gap-2">
                            <Link
                                href="/"
                                className="text-muted dark:text-warm/60 hover:text-primary text-sm transition-colors"
                            >
                                Beranda
                            </Link>
                            <Link
                                href="/warung"
                                className="text-muted dark:text-warm/60 hover:text-primary text-sm transition-colors"
                            >
                                Daftar Warung
                            </Link>
                            <Link
                                href="/auth/login"
                                className="text-muted dark:text-warm/60 hover:text-primary text-sm transition-colors"
                            >
                                Login
                            </Link>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h4 className="font-display text-lg text-brown dark:text-warm tracking-wide">
                            KONTAK
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-2 text-muted dark:text-warm/60 text-sm">
                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>Singosari, Malang, Jawa Timur</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted dark:text-warm/60 text-sm">
                                <Mail className="w-4 h-4 shrink-0" />
                                <span>hello@mymieayam.id</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-brown/10 dark:border-warm/10 mt-8 pt-8 text-center">
                    <p className="text-muted/60 dark:text-warm/40 text-sm inline-flex items-center justify-center gap-1.5 flex-wrap">
                        © {new Date().getFullYear()} My MieAyam (MMA). Dibuat dengan
                        <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 inline" />
                        untuk UMKM lokal.
                    </p>
                </div>
            </div>
        </footer>
    )
}
