'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
    warung?: {
        id: string
        nama: string
        alamat: string
        deskripsi: string | null
        maps_embed: string | null
    } | null
    onSuccess: () => void
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
    const supabase = createClient()

    const isEditing = !!warung

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!nama.trim() || !alamat.trim()) {
            setError('Nama dan alamat wajib diisi')
            return
        }

        setLoading(true)

        const warungData = {
            nama: nama.trim(),
            alamat: alamat.trim(),
            deskripsi: deskripsi.trim() || null,
            maps_embed: mapsEmbed.trim() || null,
        }

        let result

        if (isEditing) {
            result = await supabase
                .from('warung')
                .update(warungData)
                .eq('id', warung.id)
        } else {
            result = await supabase.from('warung').insert(warungData).select().single()
        }

        setLoading(false)

        if (result.error) {
            setError('Gagal menyimpan warung. Coba lagi.')
            return
        }

        if (!isEditing) {
            setNama('')
            setAlamat('')
            setDeskripsi('')
            setMapsEmbed('')
        }

        onSuccess()
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
                    onChange={(e) => setMapsEmbed(e.target.value)}
                    placeholder="https://www.google.com/maps/embed?..."
                    className="w-full px-4 py-3 bg-warm/50 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <p className="text-xs text-muted/50 mt-1">
                    Paste src dari iframe Google Maps
                </p>
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
