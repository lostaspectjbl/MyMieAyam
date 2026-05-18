'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        })

        setLoading(false)

        if (resetError) {
            setError(resetError.message || 'Gagal mengirim email reset.')
            return
        }

        setSent(true)
    }

    if (sent) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl text-brown dark:text-warm tracking-wider">
                            EMAIL <span className="text-primary">TERKIRIM</span>
                        </h1>
                        <p className="mt-3 text-muted dark:text-warm/60 text-sm leading-relaxed max-w-sm mx-auto">
                            Kami telah mengirim link reset password ke <strong className="text-brown dark:text-warm">{email}</strong>. 
                            Cek inbox atau folder spam kamu.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-dark/60 border border-brown/10 dark:border-warm/10 rounded-2xl p-8 space-y-4 shadow-sm">
                        <div className="flex items-start gap-3 text-sm text-muted dark:text-warm/60">
                            <Mail className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                            <p>Klik link di email untuk mengatur password baru. Link akan kadaluarsa dalam 1 jam.</p>
                        </div>

                        <div className="pt-2 space-y-3">
                            <button
                                onClick={() => { setSent(false); setEmail('') }}
                                className="w-full px-4 py-3 text-sm font-medium text-primary border border-primary/20 hover:bg-primary/5 rounded-xl transition-all"
                            >
                                Kirim ulang ke email lain
                            </button>
                            <Link
                                href="/auth/login"
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Kembali ke Login
                            </Link>
                        </div>
                    </div>
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
                        <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl text-brown dark:text-warm tracking-wider">
                        LUPA <span className="text-primary">PASSWORD</span>
                    </h1>
                    <p className="mt-2 text-muted dark:text-warm/60 text-sm">
                        Masukkan email akun kamu, kami akan kirimkan link reset password
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleReset}
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
                            <Mail className="w-4 h-4" />
                        )}
                        {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                    </button>
                </form>

                {/* Back to Login */}
                <p className="text-center text-sm text-muted dark:text-warm/60">
                    Ingat password?{' '}
                    <Link
                        href="/auth/login"
                        className="text-primary font-medium hover:underline"
                    >
                        Kembali ke Login
                    </Link>
                </p>
            </div>
        </div>
    )
}
