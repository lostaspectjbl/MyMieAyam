'use client'

import { useState, useMemo } from 'react'
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
    Star,
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
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')
    const [editWarung, setEditWarung] = useState<Warung | null>(null)
    const [photoWarungId, setPhotoWarungId] = useState<string | null>(null)
    const [photos, setPhotos] = useState<WarungFoto[]>([])
    const [photosLoading, setPhotosLoading] = useState(false)
    const [photosError, setPhotosError] = useState('')
    const [actionError, setActionError] = useState('')
    const [thumbLoading, setThumbLoading] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    const refreshPublicCache = () => {
        setTimeout(() => {
            void revalidateWarungCache().catch((err) => {
                console.error('Gagal memperbarui cache warung:', err)
            })
        }, 0)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus warung ini? Semua foto dan review akan ikut terhapus.'))
            return

        setActionError('')

        const { data: fotos, error: fetchError } = await supabase
            .from('warung_foto')
            .select('foto_url')
            .eq('warung_id', id)

        if (fetchError) {
            setActionError('Gagal mengambil data foto: ' + fetchError.message)
            return
        }

        const { error: deleteError } = await supabase
            .from('warung')
            .delete()
            .eq('id', id)

        if (deleteError) {
            setActionError('Gagal menghapus warung: ' + deleteError.message)
            return
        }

        setWarungs(prev => prev.filter(w => w.id !== id))
        if (photoWarungId === id) {
            setPhotoWarungId(null)
            setPhotos([])
            setPhotosError('')
        }

        if (fotos && fotos.length > 0) {
            const paths = fotos
                .map(f => {
                    const parts = f.foto_url.split('/warung-photos/')
                    return parts.length === 2 ? parts[1] : null
                })
                .filter(Boolean) as string[]

            if (paths.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('warung-photos')
                    .remove(paths)

                if (storageError) {
                    console.error('Gagal menghapus file foto:', storageError)
                    setActionError(
                        'Warung terhapus, tetapi sebagian file foto gagal dihapus.'
                    )
                }
            }
        }

        refreshPublicCache()
    }

    const handleEditSuccess = (updated?: WarungData) => {
        if (updated) {
            // Optimistic: langsung update state lokal, tidak perlu fetch ulang
            setWarungs(prev =>
                prev.map(w => w.id === updated.id ? { ...w, ...updated } : w)
            )
            refreshPublicCache()
        }
        setEditWarung(null)
        setActiveTab('list')
    }

    const handleAddSuccess = (created?: WarungData) => {
        if (created) {
            // Prepend ke list lokal
            setWarungs(prev => [created as Warung, ...prev])
            refreshPublicCache()
        }
        setActiveTab('list')
    }

    const fetchPhotos = async (warungId: string) => {
        setPhotosLoading(true)
        setPhotosError('')
        const { data, error } = await supabase
            .from('warung_foto')
            .select('*')
            .eq('warung_id', warungId)
            .order('urutan', { ascending: true })

        if (error) {
            console.error('Gagal memuat foto:', error)
            setPhotosError('Gagal memuat foto: ' + error.message)
            setPhotos([])
        } else {
            setPhotos((data as WarungFoto[]) || [])
        }
        setPhotosLoading(false)
    }

    const handleManagePhotos = async (warungId: string) => {
        if (photoWarungId === warungId) {
            setPhotoWarungId(null)
            setPhotos([])
            setPhotosError('')
        } else {
            setPhotoWarungId(warungId)
            await fetchPhotos(warungId)
        }
    }

    const handleDeletePhoto = async (photoId: string) => {
        if (!confirm('Hapus foto ini?')) return

        setActionError('')
        const photoToDelete = photos.find(p => p.id === photoId)

        const { error: deleteError } = await supabase
            .from('warung_foto')
            .delete()
            .eq('id', photoId)

        if (deleteError) {
            setActionError('Gagal menghapus foto: ' + deleteError.message)
            return
        }

        if (photoToDelete) {
            const parts = photoToDelete.foto_url.split('/warung-photos/')
            if (parts.length === 2) {
                const { error: storageError } = await supabase.storage
                    .from('warung-photos')
                    .remove([parts[1]])

                if (storageError) {
                    console.error('Gagal menghapus file foto:', storageError)
                    setActionError(
                        'Foto terhapus, tetapi file di storage gagal dihapus.'
                    )
                }
            }
        }

        if (photoWarungId) await fetchPhotos(photoWarungId)
        refreshPublicCache()
    }

    const handleSetThumbnail = async (photo: WarungFoto) => {
        const currentThumb = photos[0]
        if (!currentThumb || currentThumb.id === photo.id || thumbLoading) return

        setThumbLoading(photo.id)
        setPhotosError('')

        const previousThumbOrder = currentThumb.urutan
        let currentMoved = false

        try {
            const { data: moved, error: moveError } = await supabase
                .from('warung_foto')
                .update({ urutan: photo.urutan })
                .eq('id', currentThumb.id)
                .select('id')

            if (moveError || !moved?.length) {
                setPhotosError(
                    'Gagal memindahkan thumbnail: ' +
                    (moveError?.message ?? 'akses ditolak')
                )
                return
            }

            currentMoved = true

            const { data: promoted, error: promoteError } = await supabase
                .from('warung_foto')
                .update({ urutan: 0 })
                .eq('id', photo.id)
                .select('id')

            if (promoteError || !promoted?.length) {
                await supabase
                    .from('warung_foto')
                    .update({ urutan: previousThumbOrder })
                    .eq('id', currentThumb.id)

                currentMoved = false
                setPhotosError(
                    'Gagal menjadikan thumbnail: ' +
                    (promoteError?.message ?? 'akses ditolak')
                )
                return
            }

            currentMoved = false
            await fetchPhotos(photo.warung_id)
            refreshPublicCache()
        } catch (err) {
            console.error('Gagal mengatur thumbnail:', err)
            if (currentMoved) {
                await supabase
                    .from('warung_foto')
                    .update({ urutan: previousThumbOrder })
                    .eq('id', currentThumb.id)
            }
            setPhotosError('Gagal mengatur thumbnail. Coba lagi.')
        } finally {
            setThumbLoading(null)
        }
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

            {actionError && (
                <p
                    className="mb-6 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                    role="alert"
                >
                    {actionError}
                </p>
            )}

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
                    {warungs.length === 0 ? (
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

                                        {photosError && (
                                            <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
                                                {photosError}
                                            </p>
                                        )}

                                        {photosLoading ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            </div>
                                        ) : (
                                            <>
                                                {/* Existing Photos */}
                                                {photos.length > 0 && (
                                                    <>
                                                        {photos.length > 1 && (
                                                            <p className="text-xs text-muted dark:text-warm/40">
                                                                Klik tombol Thumbnail pada foto untuk menjadikannya foto utama.
                                                            </p>
                                                        )}
                                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                            {photos.map((photo, index) => (
                                                                <div
                                                                    key={photo.id}
                                                                    className="relative aspect-square rounded-lg overflow-hidden group"
                                                                >
                                                                    <Image
                                                                        src={photo.foto_url}
                                                                        alt={`Foto ${index + 1}`}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="100px"
                                                                    />
                                                                    {index === 0 && (
                                                                        <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                                            Thumbnail
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDeletePhoto(photo.id)}
                                                                        className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        type="button"
                                                                        aria-label={`Hapus foto ${index + 1}`}
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                    {index !== 0 && (
                                                                        <button
                                                                            onClick={() => handleSetThumbnail(photo)}
                                                                            disabled={thumbLoading !== null}
                                                                            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/65 text-white text-[10px] py-1 transition-opacity disabled:cursor-wait disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                                                                            type="button"
                                                                            aria-label={`Jadikan foto ${index + 1} sebagai thumbnail`}
                                                                        >
                                                                            {thumbLoading === photo.id ? (
                                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                            ) : (
                                                                                <Star className="w-3 h-3" />
                                                                            )}
                                                                            Thumbnail
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {/* Upload New */}
                                        <PhotoUpload
                                            warungId={w.id}
                                            onUploadComplete={() => {
                                                void fetchPhotos(w.id)
                                                refreshPublicCache()
                                            }}
                                        />
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
