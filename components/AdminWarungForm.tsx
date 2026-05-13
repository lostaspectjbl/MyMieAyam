'use client'

import { useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Singleton — dibuat sekali per halaman, tidak per mount komponen
const supabase = createClient()

type WarungData = {
    id: string
    nama: string
    alamat: string
    deskripsi: string | null
    maps_embed: string | null
}

type Props = {
    warung?: WarungData | null
    onSuccess: (updated?: WarungData) => void
    onCancel?: () => void
}

export default function AdminWarungForm({
    warung,
    onSuccess,
    onCancel,
}: Props) {
    const [nama, setNama] = useState(warung?.nama || '')
    const [alamat, setAlamat] = useState(warung?.alamat || '')
    const [deskripsi, setDeskripsi] = useState(warung?.deskripsi || '')
    const [mapsEmbed, setMapsEmbed] = useState(warung?.maps_embed || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [mapsError, setMapsError] = useState('')

    const isEditing = !!warung

    // Validasi URL Google Maps Embed
    const validateMapsUrl = (url: string) => {
        if (!url) {
            setMapsError('')
            return true
        }
        const isValid = url.includes('google.com/maps/embed') || url.includes('maps.google.com/maps')
        setMapsError(isValid ? '' : 'URL harus berupa Google Maps Embed. Lihat panduan di bawah.')
        return isValid
    }

    // Auto-extract src dari HTML <iframe> jika user paste kode embed lengkap
    const handleMapsInput = (raw: string) => {
        let value = raw.trim()
        // Deteksi jika paste HTML iframe
        if (value.startsWith('<iframe') || value.includes('src=')) {
            const match = value.match(/src=["']([^"']+)["']/)
            if (match) value = match[1]
        }
        setMapsEmbed(value)
        validateMapsUrl(value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!nama.trim() || !alamat.trim()) {
            setError('Nama dan alamat wajib diisi')
            return
        }

        if (mapsEmbed && !validateMapsUrl(mapsEmbed)) return

        setLoading(true)

        const warungData = {
            nama: nama.trim(),
            alamat: alamat.trim(),
            deskripsi: deskripsi.trim() || null,
            maps_embed: mapsEmbed.trim() || null,
        }

        if (isEditing) {
            // Pakai .select().single() agar dapat data kembali sekaligus (lebih cepat)
            const { data, error: err } = await supabase
                .from('warung')
                .update(warungData)
                .eq('id', warung.id)
                .select()
                .single()

            setLoading(false)

            if (err) {
                setError('Gagal menyimpan perubahan. Coba lagi.')
                return
            }

            // Kirim data yang sudah diupdate ke parent → tidak perlu fetch ulang
            onSuccess(data as WarungData)
        } else {
            const { data, error: err } = await supabase
                .from('warung')
                .insert(warungData)
                .select()
                .single()

            setLoading(false)

            if (err) {
                setError('Gagal menambah warung. Coba lagi.')
                return
            }

            setNama('')
            setAlamat('')
            setDeskripsi('')
            setMapsEmbed('')

            onSuccess(data as WarungData)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-brown dark:text-warm mb-1.5">
                    Nama Warung <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Mie Ayam Pak Budi"
                    required
                    className="w-full px-4 py-3 bg-warm/50 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-brown dark:text-warm mb-1.5">
                    Alamat <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Jl. Raya Singosari No. 10"
                    required
                    className="w-full px-4 py-3 bg-warm/50 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-brown dark:text-warm mb-1.5">
                    Deskripsi
                </label>
                <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Deskripsi warung..."
                    rows={3}
                    className="w-full px-4 py-3 bg-warm/50 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-brown dark:text-warm mb-1.5">
                    Google Maps Embed URL
                </label>
                <input
                    type="text"
                    value={mapsEmbed}
                    onChange={(e) => {
                        handleMapsInput(e.target.value)
                    }}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className={`w-full px-4 py-3 bg-warm/50 dark:bg-dark/40 border rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                        mapsError
                            ? 'border-red-400 dark:border-red-500'
                            : 'border-brown/10 dark:border-warm/10'
                    }`}
                />
                {mapsError ? (
                    <p className="text-xs text-red-500 mt-1.5">{mapsError}</p>
                ) : (
                    <div className="mt-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            Cara mendapatkan URL Embed:
                        </p>
                        <ol className="list-decimal list-inside space-y-0.5 text-blue-500/80 dark:text-blue-400/80">
                            <li>Buka <strong>Google Maps</strong> → cari lokasi warung</li>
                            <li>Klik <strong>Share</strong> → pilih tab <strong>Embed a map</strong></li>
                            <li>Klik <strong>Copy HTML</strong> → ambil hanya bagian <code className="bg-blue-500/10 px-1 rounded">src="..."</code></li>
                            <li>Paste URL-nya di sini (dimulai dengan <code className="bg-blue-500/10 px-1 rounded">https://www.google.com/maps/embed</code>)</li>
                        </ol>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-red-500 text-sm bg-red-500/10 px-4 py-2.5 rounded-lg">
                    {error}
                </p>
            )}

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-white font-medium rounded-xl transition-all"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Simpan Perubahan' : 'Tambah Warung'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 border border-brown/15 dark:border-warm/15 text-muted dark:text-warm/60 font-medium rounded-xl hover:bg-brown/5 dark:hover:bg-warm/5 transition-all"
                    >
                        Batal
                    </button>
                )}
            </div>
        </form>
    )
}
