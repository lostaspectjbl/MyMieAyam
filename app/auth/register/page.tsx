'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    UserPlus,
    Mail,
    Lock,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle,
} from 'lucide-react'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Password tidak cocok')
            return
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter')
            return
        }

        setLoading(true)

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        setLoading(false)

        if (authError) {
            setError(authError.message || 'Gagal mendaftar. Coba lagi.')
            return
        }

        setSuccess(true)
    }

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="font-display text-3xl text-brown dark:text-warm tracking-wider">
                        REGISTRASI <span className="text-green-500">BERHASIL!</span>
                    </h1>
                    <p className="text-muted dark:text-warm/60">
                        Cek email kamu untuk verifikasi akun. Setelah verifikasi, kamu bisa
                        login dan mulai review warung mie ayam favoritmu.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all"
                    >
                        Ke Halaman Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                        <UserPlus className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl text-brown dark:text-warm tracking-wider">
                        GABUNG <span className="text-primary">MMA</span>
                    </h1>
                    <p className="mt-2 text-muted dark:text-warm/60 text-sm">
                        Daftar gratis dan mulai eksplor mie ayam terbaik
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleRegister}
                    className="bg-white dark:bg-dark/60 border border-brown/10 dark:border-warm/10 rounded-2xl p-8 space-y-5 shadow-sm"
                >
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-brown dark:text-warm mb-1.5"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted/50" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="nama@email.com"
                                className="w-full pl-11 pr-4 py-3 bg-brown/5 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-brown dark:text-warm mb-1.5"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted/50" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Minimal 6 karakter"
                                className="w-full pl-11 pr-11 py-3 bg-brown/5 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-muted transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4.5 h-4.5" />
                                ) : (
                                    <Eye className="w-4.5 h-4.5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-brown dark:text-warm mb-1.5"
                        >
                            Konfirmasi Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted/50" />
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Ulangi password"
                                className="w-full pl-11 pr-4 py-3 bg-brown/5 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm bg-red-500/10 px-4 py-2.5 rounded-lg">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <UserPlus className="w-4 h-4" />
                        )}
                        {loading ? 'Memproses...' : 'Daftar'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-sm text-muted dark:text-warm/60">
                    Sudah punya akun?{' '}
                    <Link
                        href="/auth/login"
                        className="text-primary font-medium hover:underline"
                    >
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </div>
    )
}
