'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { revalidateWarungCache } from '@/app/actions/warung'
import AdminWarungForm from '@/components/AdminWarungForm'
import PhotoUpload from '@/components/PhotoUpload'
import Image from 'next/image'
import {
    Plus,
    Pencil,
    Trash2,
    ImageIcon,
    X,
    Loader2,
    Shield,
    Store,
    ChevronDown,
    ChevronUp,
    UtensilsCrossed,
} from 'lucide-react'
import type { Warung, WarungFoto } from '@/types'

type WarungData = {
    id: string
    nama: string
    alamat: string
    deskripsi: string | null
    maps_embed: string | null
}

export default function AdminPanel({ initialWarungs }: { initialWarungs: Warung[] }) {
    const [warungs, setWarungs] = useState<Warung[]>(initialWarungs)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')
    const [editWarung, setEditWarung] = useState<Warung | null>(null)
    const [photoWarungId, setPhotoWarungId] = useState<string | null>(null)
    const [photos, setPhotos] = useState<WarungFoto[]>([])
    const [photosLoading, setPhotosLoading] = useState(false)
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()

    const fetchWarungs = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('warung')
            .select('*')
            .order('created_at', { ascending: false })
        setWarungs((data as Warung[]) || [])
        setLoading(false)
    }

    // Tidak perlu fetch saat mount karena data sudah dari server (initialWarungs)
    // fetchWarungs hanya dipanggil setelah ada perubahan (add/edit/delete)

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus warung ini? Semua foto dan review akan ikut terhapus.'))
            return

        // Optimistic: hapus dari state dulu, baru delete di DB
        setWarungs(prev => prev.filter(w => w.id !== id))
        await supabase.from('warung').delete().eq('id', id)
        
        // Refresh cache untuk pengunjung publik
        await revalidateWarungCache()
        router.refresh()
    }

    const handleEditSuccess = (updated?: WarungData) => {
        if (updated) {
            // Optimistic: langsung update state lokal, tidak perlu fetch ulang
            setWarungs(prev =>
                prev.map(w => w.id === updated.id ? { ...w, ...updated } : w)
            )
            // Refresh cache untuk pengunjung publik
            revalidateWarungCache().then(() => router.refresh())
        }
        setEditWarung(null)
        setActiveTab('list')
    }

    const handleAddSuccess = (created?: WarungData) => {
        if (created) {
            // Prepend ke list lokal
            setWarungs(prev => [created as Warung, ...prev])
            // Refresh cache untuk pengunjung publik
            revalidateWarungCache().then(() => router.refresh())
        }
        setActiveTab('list')
    }

    const fetchPhotos = async (warungId: string) => {
        setPhotosLoading(true)
        const { data } = await supabase
            .from('warung_foto')
            .select('*')
            .eq('warung_id', warungId)
            .order('urutan', { ascending: true })
        setPhotos((data as WarungFoto[]) || [])
        setPhotosLoading(false)
    }

    const handleManagePhotos = async (warungId: string) => {
        if (photoWarungId === warungId) {
            setPhotoWarungId(null)
            setPhotos([])
        } else {
            setPhotoWarungId(warungId)
            await fetchPhotos(warungId)
        }
    }

    const handleDeletePhoto = async (photoId: string) => {
        if (!confirm('Hapus foto ini?')) return
        await supabase.from('warung_foto').delete().eq('id', photoId)
        if (photoWarungId) fetchPhotos(photoWarungId)
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl text-brown dark:text-warm tracking-wider">
                        ADMIN <span className="text-primary">PANEL</span>
                    </h1>
                    <p className="text-sm text-muted dark:text-warm/50">
                        Kelola warung mie ayam di MMA
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => {
                        setActiveTab('list')
                        setEditWarung(null)
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'list'
                            ? 'bg-primary text-white'
                            : 'bg-brown/5 dark:bg-warm/5 text-muted dark:text-warm/60 hover:bg-brown/10 dark:hover:bg-warm/10'
                        }`}
                >
                    <Store className="w-4 h-4" />
                    Daftar Warung
                </button>
                <button
                    onClick={() => {
                        setActiveTab('add')
                        setEditWarung(null)
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'add'
                            ? 'bg-primary text-white'
                            : 'bg-brown/5 dark:bg-warm/5 text-muted dark:text-warm/60 hover:bg-brown/10 dark:hover:bg-warm/10'
                        }`}
                >
                    <Plus className="w-4 h-4" />
                    Tambah Warung
                </button>
            </div>

            {/* Add / Edit Form */}
            {(activeTab === 'add' || editWarung) && (
                <div className="bg-white dark:bg-dark/60 border border-brown/10 dark:border-warm/10 rounded-2xl p-6 mb-8">
                    <h2 className="font-display text-xl text-brown dark:text-warm tracking-wide mb-4">
                        {editWarung ? 'EDIT WARUNG' : 'TAMBAH WARUNG BARU'}
                    </h2>
                    <AdminWarungForm
                        warung={editWarung}
                        onSuccess={editWarung ? handleEditSuccess : handleAddSuccess}
                        onCancel={
                            editWarung
                                ? () => setEditWarung(null)
                                : undefined
                        }
                    />
                </div>
            )}

            {/* Warung List */}
            {activeTab === 'list' && !editWarung && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : warungs.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                                <UtensilsCrossed className="w-8 h-8 text-primary/40" />
                            </div>
                            <p className="text-muted dark:text-warm/50">
                                Belum ada warung. Klik &quot;Tambah Warung&quot; untuk mulai.
                            </p>
                        </div>
                    ) : (
                        warungs.map((w) => (
                            <div
                                key={w.id}
                                className="bg-white dark:bg-dark/60 border border-brown/10 dark:border-warm/10 rounded-2xl overflow-hidden"
                            >
                                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-display text-lg text-brown dark:text-warm tracking-wide truncate">
                                            {w.nama.toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-muted dark:text-warm/50 truncate">
                                            {w.alamat}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleManagePhotos(w.id)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-all"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            Foto
                                            {photoWarungId === w.id ? (
                                                <ChevronUp className="w-3 h-3" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditWarung(w)
                                                setActiveTab('list')
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(w.id)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Hapus
                                        </button>
                                    </div>
                                </div>

                                {/* Photo Management Panel */}
                                {photoWarungId === w.id && (
                                    <div className="border-t border-brown/10 dark:border-warm/10 p-5 space-y-4 bg-brown/2 dark:bg-warm/2">
                                        <h4 className="font-display text-sm text-brown dark:text-warm tracking-wide">
                                            KELOLA FOTO
                                        </h4>

                                        {photosLoading ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            </div>
                                        ) : (
                                            <>
                                                {/* Existing Photos */}
                                                {photos.length > 0 && (
                                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                        {photos.map((photo) => (
                                                            <div
                                                                key={photo.id}
                                                                className="relative aspect-square rounded-lg overflow-hidden group"
                                                            >
                                                                <Image
                                                                    src={photo.foto_url}
                                                                    alt={`Foto ${photo.urutan}`}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="100px"
                                                                />
                                                                {photo.urutan === 0 && (
                                                                    <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                                        Thumb
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeletePhoto(photo.id)}
                                                                    className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Upload New */}
                                                <PhotoUpload
                                                    warungId={w.id}
                                                    onUploadComplete={() => fetchPhotos(w.id)}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
