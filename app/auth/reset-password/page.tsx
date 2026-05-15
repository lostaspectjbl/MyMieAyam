'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2, Eye, EyeOff, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [sessionReady, setSessionReady] = useState(false)
    const [sessionError, setSessionError] = useState(false)
    const router = useRouter()
    const supabase = React.useMemo(() => createClient(), [])

    useEffect(() => {
        let isMounted = true

        // Cek session saat ini secepatnya
        const checkInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session && isMounted) {
                setSessionReady(true)
            }
        }
        checkInitialSession()

        // Supabase SSR menangani token dari URL hash secara otomatis
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
                if (isMounted) setSessionReady(true)
            }
        })

        // Timeout jika tidak ada event recovery atau lambat
        const timeout = setTimeout(() => {
            if (isMounted) {
                setSessionReady((prevReady) => {
                    if (!prevReady) {
                        supabase.auth.getUser().then(({ data: { user } }) => {
                            if (isMounted) {
                                if (user) setSessionReady(true)
                                else setSessionError(true)
                            }
                        })
                    }
                    return prevReady
                })
            }
        }, 3000)

        return () => {
            isMounted = false
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [supabase])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Password minimal 6 karakter.')
            return
        }

        if (password !== confirmPassword) {
            setError('Password dan konfirmasi tidak cocok.')
            return
        }

        setLoading(true)

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            })

            if (updateError) {
                setError(updateError.message || 'Gagal mengubah password. Coba lagi.')
                return
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/')
                router.refresh()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan sistem.')
        } finally {
            setLoading(false)
        }
    }

    // Session error — link invalid/expired
    if (sessionError) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-2xl mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl text-brown dark:text-warm tracking-wider">
                            LINK <span className="text-red-500">KADALUARSA</span>
                        </h1>
                        <p className="mt-3 text-muted dark:text-warm/60 text-sm leading-relaxed max-w-sm mx-auto">
                            Link reset password sudah tidak valid atau sudah kadaluarsa. Silakan minta link reset baru.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/auth/forgot-password"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25"
                        >
                            Minta Link Reset Baru
                        </Link>
                        <Link
                            href="/auth/login"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary border border-primary/20 hover:bg-primary/5 rounded-xl transition-all"
                        >
                            Kembali ke Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Loading session
    if (!sessionReady) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <p className="text-muted dark:text-warm/60 text-sm">Memverifikasi link reset...</p>
                </div>
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl text-brown dark:text-warm tracking-wider">
                            PASSWORD <span className="text-primary">DIUBAH</span>
                        </h1>
                        <p className="mt-3 text-muted dark:text-warm/60 text-sm">
                            Password berhasil diubah! Mengalihkan ke halaman utama...
                        </p>
                        <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto mt-4" />
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
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl text-brown dark:text-warm tracking-wider">
                        RESET <span className="text-primary">PASSWORD</span>
                    </h1>
                    <p className="mt-2 text-muted dark:text-warm/60 text-sm">
                        Masukkan password baru untuk akun kamu
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleReset}
                    className="bg-white dark:bg-dark/60 border border-brown/10 dark:border-warm/10 rounded-2xl p-8 space-y-5 shadow-sm"
                >
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-brown dark:text-warm mb-1.5"
                        >
                            Password Baru
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted/50" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Minimal 6 karakter"
                                className="w-full pl-11 pr-11 py-3 bg-warm/50 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                            htmlFor="confirm-password"
                            className="block text-sm font-medium text-brown dark:text-warm mb-1.5"
                        >
                            Konfirmasi Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted/50" />
                            <input
                                id="confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Ketik ulang password baru"
                                className="w-full pl-11 pr-11 py-3 bg-warm/50 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-muted transition-colors"
                            >
                                {showConfirm ? (
                                    <EyeOff className="w-4.5 h-4.5" />
                                ) : (
                                    <Eye className="w-4.5 h-4.5" />
                                )}
                            </button>
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
                            <ShieldCheck className="w-4 h-4" />
                        )}
                        {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </button>
                </form>
            </div>
        </div>
    )
}
