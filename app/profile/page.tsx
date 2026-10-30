'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
    User,
    Calendar,
    Heart,
    MessageSquare,
    Settings,
    Loader2,
    Star,
    UtensilsCrossed,
    Camera,
    Save,
    X,
    Pencil,
    Trash2
} from 'lucide-react'
import type { Profile, WarungWithRating } from '@/types'
import WarungCard from '@/components/WarungCard'
import ReviewForm from '@/components/ReviewForm'

type ReviewWithWarung = {
    id: string
    rating: number
    komentar: string | null
    created_at: string
    warung: {
        id: string
        nama: string
    }
}

export default function ProfilePage() {
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [favorites, setFavorites] = useState<WarungWithRating[]>([])
    const [reviews, setReviews] = useState<ReviewWithWarung[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'favorit' | 'review'>('favorit')

    // Edit State
    const [isEditing, setIsEditing] = useState(false)
    const [editUsername, setEditUsername] = useState('')
    const [editBio, setEditBio] = useState('')
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [editError, setEditError] = useState('')
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
    const [reviewActionError, setReviewActionError] = useState('')

    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    const fetchProfileData = useCallback(async (userId: string) => {
        // Fetch Profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (profileData) {
            setProfile(profileData)
            setEditUsername(profileData.username || '')
            setEditBio(profileData.bio || '')
        }

        // Fetch Favorites
        // Catatan: warung_with_rating adalah VIEW (tanpa foreign key), jadi tidak bisa
        // di-embed lewat PostgREST. Ambil favorit lalu query warung secara terpisah.
        const { data: favData } = await supabase
            .from('favorit')
            .select('warung_id')
            .eq('user_id', userId)

        if (favData && favData.length > 0) {
            const warungIds = favData.map((f) => f.warung_id)
            const { data: warungData } = await supabase
                .from('warung_with_rating')
                .select('*')
                .in('id', warungIds)

            setFavorites((warungData as WarungWithRating[]) || [])
        } else {
            setFavorites([])
        }

        // Fetch Reviews
        const { data: revData } = await supabase
            .from('reviews')
            .select(`
                id, rating, komentar, created_at,
                warung:warung_id (id, nama)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (revData) {
            // Note: Since warung is a single relation in this context (but Supabase might return array depending on foreign key setup), we handle it.
            const formattedRevs = revData.map(r => ({
                ...r,
                warung: Array.isArray(r.warung) ? r.warung[0] : r.warung
            })) as ReviewWithWarung[]
            setReviews(formattedRevs)
        }
    }, [supabase])

    useEffect(() => {
        let cancelled = false

        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (cancelled) return

                if (!user) {
                    router.push('/auth/login')
                    return
                }

                setUser(user)
                await fetchProfileData(user.id)
            } catch (err) {
                console.error('Gagal memuat profil:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void checkAuth()

        return () => {
            cancelled = true
        }
    }, [router, supabase, fetchProfileData])

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        setEditError('')

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: editUsername,
                    bio: editBio
                })
                .eq('id', user.id)

            if (error) {
                setEditError(`Gagal menyimpan: ${error.message}. (Pastikan kolom 'bio' sudah dibuat di database)`)
                return
            }

            setProfile(prev => prev ? { ...prev, username: editUsername, bio: editBio } : null)
            setIsEditing(false)
        } catch (err) {
            console.error('Gagal menyimpan profil:', err)
            setEditError('Gagal menyimpan profil. Periksa koneksi lalu coba lagi.')
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return
        const file = e.target.files[0]
        e.target.value = ''

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            setEditError('Format foto harus JPG, PNG, WebP, atau GIF.')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setEditError('Ukuran foto maksimal 5 MB.')
            return
        }

        setUploading(true)
        setEditError('')

        const fileExt =
            file.name.split('.').pop()?.toLowerCase() ||
            file.type.split('/')[1] ||
            'jpg'
        const uniqueId =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        const fileName = `${user.id}-${uniqueId}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) {
                setEditError(`Gagal upload foto: ${uploadError.message}. (Pastikan bucket 'avatars' sudah ada dan public)`)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) {
                setEditError(`Gagal update avatar: ${updateError.message}`)
                await supabase.storage.from('avatars').remove([filePath])
                return
            }

            const oldAvatarPath = profile?.avatar_url?.split('/avatars/')[1]
            if (oldAvatarPath && oldAvatarPath !== filePath) {
                const { error: removeError } = await supabase.storage
                    .from('avatars')
                    .remove([oldAvatarPath])

                if (removeError) {
                    console.error('Gagal menghapus avatar lama:', removeError)
                }
            }

            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
        } catch (err) {
            console.error('Gagal upload avatar:', err)
            setEditError('Gagal upload avatar. Periksa koneksi lalu coba lagi.')
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteReview = async (review: ReviewWithWarung) => {
        if (!user || deletingReviewId) return
        if (!confirm('Hapus review ini?')) return

        setDeletingReviewId(review.id)
        setReviewActionError('')

        try {
            const { data: deletedRows, error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', review.id)
                .eq('user_id', user.id)
                .select('id')

            if (error) throw error
            if (!deletedRows?.length) {
                setReviewActionError(
                    'Review tidak ditemukan atau kamu tidak berhak menghapusnya.'
                )
                return
            }

            setReviews(prev => prev.filter(r => r.id !== review.id))
            if (editingReviewId === review.id) setEditingReviewId(null)
            router.refresh()
        } catch (err) {
            console.error('Gagal menghapus review:', err)
            setReviewActionError('Gagal menghapus review. Coba lagi.')
        } finally {
            setDeletingReviewId(null)
        }
    }

    const handleReviewUpdated = () => {
        setEditingReviewId(null)
        if (user) void fetchProfileData(user.id)
        router.refresh()
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted dark:text-warm/60">Memuat profil...</p>
            </div>
        )
    }

    if (!profile || !user) return null

    const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            {/* Header Section */}
            <div className="bg-white dark:bg-dark/60 rounded-3xl p-8 border border-brown/10 dark:border-warm/10 shadow-sm relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                
                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden bg-brown/5 dark:bg-warm/5 border-4 border-white dark:border-dark shadow-lg">
                            {profile.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile.username || 'Avatar'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-display text-5xl">
                                    {(profile.username || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        
                        {/* Avatar Upload Overlay (Only in Edit Mode) */}
                        {isEditing && (
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-3xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                {uploading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Camera className="w-8 h-8 mb-1" />
                                        <span className="text-xs font-medium">Ubah Foto</span>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden" 
                                    onChange={handleAvatarUpload}
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        {!isEditing ? (
                            <>
                                <div>
                                    <h1 className="font-display text-3xl sm:text-4xl text-brown dark:text-warm tracking-wide">
                                        {profile.username || user.email?.split('@')[0]}
                                    </h1>
                                    <p className="text-muted dark:text-warm/60 mt-1 flex items-center justify-center md:justify-start gap-1.5 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        Bergabung sejak {joinDate}
                                    </p>
                                </div>

                                {profile.bio && (
                                    <p className="text-brown/80 dark:text-warm/80 text-sm md:text-base max-w-lg mx-auto md:mx-0 bg-brown/5 dark:bg-warm/5 p-4 rounded-xl border border-brown/10 dark:border-warm/5">
                                        &ldquo;{profile.bio}&rdquo;
                                    </p>
                                )}
                                
                                <div className="pt-2 flex items-center justify-center md:justify-start gap-4">
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-brown/5 dark:bg-warm/10 hover:bg-brown/10 dark:hover:bg-warm/20 text-brown dark:text-warm font-medium rounded-xl transition-colors text-sm"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Edit Profil
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-4 w-full max-w-md mx-auto md:mx-0 text-left">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-display text-2xl text-brown dark:text-warm tracking-wide">
                                        Edit <span className="text-primary">Profil</span>
                                    </h2>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditing(false)}
                                        className="p-2 text-muted hover:text-brown dark:hover:text-warm transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                {editError && (
                                    <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl">
                                        {editError}
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium text-brown dark:text-warm mb-1.5">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted/50" />
                                        <input
                                            type="text"
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                            placeholder="Nama tampilan Anda"
                                            className="w-full pl-10 pr-4 py-2.5 bg-brown/5 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-brown dark:text-warm mb-1.5">Bio</label>
                                    <textarea
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        placeholder="Ceritakan sedikit tentang selera mie ayam Anda..."
                                        rows={3}
                                        className="w-full p-3 bg-brown/5 dark:bg-dark/40 border border-brown/10 dark:border-warm/10 rounded-xl text-brown dark:text-warm focus:ring-2 focus:ring-primary/30 outline-none transition-all resize-none"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-3 pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-70"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                    
                    {/* Stats */}
                    {!isEditing && (
                        <div className="shrink-0 flex md:flex-col gap-4 justify-center">
                            <div className="bg-brown/5 dark:bg-warm/5 px-6 py-4 rounded-2xl text-center border border-brown/10 dark:border-warm/10 min-w-[100px]">
                                <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                <span className="block font-display text-2xl text-brown dark:text-warm leading-none">{favorites.length}</span>
                                <span className="text-xs text-muted dark:text-warm/60 uppercase tracking-wider mt-1 block">Favorit</span>
                            </div>
                            <div className="bg-brown/5 dark:bg-warm/5 px-6 py-4 rounded-2xl text-center border border-brown/10 dark:border-warm/10 min-w-[100px]">
                                <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
                                <span className="block font-display text-2xl text-brown dark:text-warm leading-none">{reviews.length}</span>
                                <span className="text-xs text-muted dark:text-warm/60 uppercase tracking-wider mt-1 block">Review</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="mt-12">
                <div className="flex items-center gap-2 border-b border-brown/10 dark:border-warm/10 pb-4 mb-8">
                    <button
                        onClick={() => setActiveTab('favorit')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                            activeTab === 'favorit' 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'text-muted hover:text-brown dark:text-warm/60 dark:hover:text-warm hover:bg-brown/5 dark:hover:bg-warm/5'
                        }`}
                    >
                        <Heart className="w-4 h-4" />
                        Warung Favorit
                    </button>
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                            activeTab === 'review' 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'text-muted hover:text-brown dark:text-warm/60 dark:hover:text-warm hover:bg-brown/5 dark:hover:bg-warm/5'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Review Saya
                    </button>
                </div>

                {/* Tab Panels */}
                <div className="min-h-[300px]">
                    {activeTab === 'favorit' && (
                        <div className="animate-fade-in">
                            {favorites.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {favorites.map((warung) => (
                                        <WarungCard key={warung.id} warung={warung} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white dark:bg-dark/40 rounded-3xl border border-brown/10 dark:border-warm/10 border-dashed">
                                    <Heart className="w-12 h-12 text-muted/30 dark:text-warm/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-brown dark:text-warm mb-2">Belum ada warung favorit</h3>
                                    <p className="text-muted dark:text-warm/60 mb-6">Mulai simpan warung mie ayam kesukaanmu untuk diakses lebih cepat.</p>
                                    <Link href="/warung" className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-sm">
                                        <UtensilsCrossed className="w-4 h-4" />
                                        Cari Mie Ayam
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'review' && (
                        <div className="animate-fade-in">
                            {reviewActionError && (
                                <p
                                    className="mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                                    role="alert"
                                >
                                    {reviewActionError}
                                </p>
                            )}

                            {reviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="bg-white dark:bg-dark/60 p-6 rounded-2xl border border-brown/10 dark:border-warm/10 shadow-sm">
                                            <div className="flex justify-between items-start gap-3 mb-4">
                                                <div className="min-w-0">
                                                    <Link href={`/warung/${review.warung.id}`} className="font-display text-xl text-brown dark:text-warm hover:text-primary transition-colors tracking-wide block truncate">
                                                        {review.warung.nama}
                                                    </Link>
                                                    <div className="text-xs text-muted dark:text-warm/50 mt-1">
                                                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">{review.rating.toFixed(1)}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingReviewId(review.id)}
                                                        disabled={editingReviewId === review.id || deletingReviewId === review.id}
                                                        className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Edit review"
                                                        aria-label="Edit review"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReview(review)}
                                                        disabled={deletingReviewId === review.id}
                                                        className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:cursor-wait disabled:opacity-50"
                                                        title="Hapus review"
                                                        aria-label="Hapus review"
                                                    >
                                                        {deletingReviewId === review.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {editingReviewId === review.id ? (
                                                <ReviewForm
                                                    key={review.id}
                                                    warungId={review.warung.id}
                                                    userId={user.id}
                                                    initialReview={review}
                                                    onReviewSubmitted={handleReviewUpdated}
                                                    onCancel={() => setEditingReviewId(null)}
                                                />
                                            ) : (
                                                <p className="text-brown/80 dark:text-warm/80 text-sm leading-relaxed">
                                                    {review.komentar || <span className="italic text-muted">Tanpa komentar</span>}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white dark:bg-dark/40 rounded-3xl border border-brown/10 dark:border-warm/10 border-dashed">
                                    <MessageSquare className="w-12 h-12 text-muted/30 dark:text-warm/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-brown dark:text-warm mb-2">Belum ada review</h3>
                                    <p className="text-muted dark:text-warm/60 mb-6">Bantu komunitas dengan memberikan review pada warung yang pernah kamu kunjungi.</p>
                                    <Link href="/warung" className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-sm">
                                        <Star className="w-4 h-4" />
                                        Beri Review Pertamamu
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
