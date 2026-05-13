'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import {
    Menu,
    X,
    Sun,
    Moon,
    LogOut,
    Heart,
    Shield,
    UtensilsCrossed,
} from 'lucide-react'
import type { Profile } from '@/types'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    // useMemo agar satu instance stabil sepanjang lifecycle Navbar
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        setMounted(true)

        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                if (profileData) setProfile(profileData)
            }
        }

        getUser()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user)
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                if (profileData) setProfile(profileData)
            } else {
                setUser(null)
                setProfile(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/')
        router.refresh()
    }

    const navLinks = [
        { href: '/', label: 'Beranda' },
        { href: '/warung', label: 'Warung' },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass bg-warm/80 dark:bg-dark/80 border-b border-brown/10 dark:border-warm/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo - kiri */}
                    <div className="flex md:flex-1 items-center justify-start">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display text-2xl text-primary tracking-wide">
                            MMA
                        </span>
                    </Link>
                    </div>

                    {/* Desktop Navigation - selalu center */}
                    <div className="hidden md:flex flex-1 items-center justify-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-brown dark:text-warm/90 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}

                        {user && (
                            <Link
                                href="/favorit"
                                className="px-4 py-2 rounded-lg text-sm font-medium text-brown dark:text-warm/90 hover:bg-primary/10 hover:text-primary transition-all duration-200 flex items-center gap-1.5"
                            >
                                <Heart className="w-4 h-4" />
                                Favorit
                            </Link>
                        )}

                        {profile?.is_admin && (
                            <Link
                                href="/admin"
                                className="px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 flex items-center gap-1.5"
                            >
                                <Shield className="w-4 h-4" />
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Right Section - kanan */}
                    <div className="hidden md:flex flex-1 items-center justify-end gap-3">
                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-5 h-5 text-accent" />
                                ) : (
                                    <Moon className="w-5 h-5 text-brown" />
                                )}
                            </button>
                        )}

                        {user ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-brown dark:text-warm/90">
                                    {profile?.username || user.email?.split('@')[0]}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center justify-end gap-2">
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-5 h-5 text-accent" />
                                ) : (
                                    <Moon className="w-5 h-5 text-brown" />
                                )}
                            </button>
                        )}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? (
                                <X className="w-6 h-6 text-brown dark:text-warm" />
                            ) : (
                                <Menu className="w-6 h-6 text-brown dark:text-warm" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'
                        }`}
                >
                    <div className="flex flex-col gap-1 pt-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-brown dark:text-warm/90 hover:bg-primary/10 hover:text-primary transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}

                        {user && (
                            <Link
                                href="/favorit"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-brown dark:text-warm/90 hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-1.5"
                            >
                                <Heart className="w-4 h-4" />
                                Favorit
                            </Link>
                        )}

                        {profile?.is_admin && (
                            <Link
                                href="/admin"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all flex items-center gap-1.5"
                            >
                                <Shield className="w-4 h-4" />
                                Admin
                            </Link>
                        )}

                        <div className="border-t border-brown/10 dark:border-warm/10 mt-2 pt-2">
                            {user ? (
                                <div className="flex flex-col gap-2">
                                    <span className="px-4 text-sm font-medium text-muted">
                                        {profile?.username || user.email?.split('@')[0]}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="mx-4 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/auth/login"
                                    onClick={() => setIsOpen(false)}
                                    className="mx-4 block text-center px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
