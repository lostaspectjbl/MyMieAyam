'use client'

import { useState, useMemo } from 'react'
import { Upload, X, Loader2, ImageIcon, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type Props = {
    warungId: string
    onUploadComplete: () => void
}

// ─── Konfigurasi kompresi ─────────────────────────────────────────────────────
const MAX_SIZE_PX = 1280   // Sisi terpanjang maksimal (px) — menjaga kualitas
const WEBP_QUALITY = 0.82  // 82% kualitas WebP — titik optimal ukuran vs kualitas
// ─────────────────────────────────────────────────────────────────────────────

type ProcessedFile = {
    blob: Blob
    preview: string   // object URL untuk preview
    originalSize: number
    compressedSize: number
    name: string      // nama file asli (tanpa ekstensi)
}

/**
 * Konversi & kompresi gambar ke WebP menggunakan Canvas API browser.
 * - Resize ke max MAX_SIZE_PX pada sisi terpanjang (aspect ratio tetap)
 * - Export ke WebP dengan WEBP_QUALITY
 */
async function convertToWebP(file: File): Promise<ProcessedFile> {
    return new Promise((resolve, reject) => {
        const img = new window.Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(objectUrl)

            // Hitung dimensi output (resize proporsional)
            let { width, height } = img
            if (width > MAX_SIZE_PX || height > MAX_SIZE_PX) {
                if (width >= height) {
                    height = Math.round((height / width) * MAX_SIZE_PX)
                    width = MAX_SIZE_PX
                } else {
                    width = Math.round((width / height) * MAX_SIZE_PX)
                    height = MAX_SIZE_PX
                }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Canvas 2D context tidak tersedia'))

            // Render gambar ke canvas dengan kualitas tinggi
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Gagal konversi ke WebP'))
                    const preview = URL.createObjectURL(blob)
                    const baseName = file.name.replace(/\.[^.]+$/, '') // hapus ekstensi
                    resolve({
                        blob,
                        preview,
                        originalSize: file.size,
                        compressedSize: blob.size,
                        name: baseName,
                    })
                },
                'image/webp',
                WEBP_QUALITY
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error(`Gagal membaca file: ${file.name}`))
        }

        img.src = objectUrl
    })
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PhotoUpload({ warungId, onUploadComplete }: Props) {
    const [processed, setProcessed] = useState<ProcessedFile[]>([])
    const [converting, setConverting] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const supabase = useMemo(() => createClient(), [])

    const totalSaved = useMemo(() => {
        const orig = processed.reduce((s, f) => s + f.originalSize, 0)
        const comp = processed.reduce((s, f) => s + f.compressedSize, 0)
        return { orig, comp, pct: orig > 0 ? Math.round((1 - comp / orig) * 100) : 0 }
    }, [processed])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        const newFiles = Array.from(e.target.files)
        e.target.value = '' // reset input agar bisa pilih file sama lagi

        setConverting(true)
        setError('')

        const results: ProcessedFile[] = []
        for (const file of newFiles) {
            try {
                const result = await convertToWebP(file)
                results.push(result)
            } catch (err) {
                setError(`Gagal proses ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
        }

        setProcessed((prev) => [...prev, ...results])
        setConverting(false)
    }

    const removeFile = (index: number) => {
        setProcessed((prev) => {
            // Bebaskan object URL untuk mencegah memory leak
            URL.revokeObjectURL(prev[index].preview)
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleUpload = async () => {
        if (processed.length === 0) return

        setUploading(true)
        setError('')

        // Get current max urutan
        const { data: existingFotos } = await supabase
            .from('warung_foto')
            .select('urutan')
            .eq('warung_id', warungId)
            .order('urutan', { ascending: false })
            .limit(1)

        let nextUrutan = existingFotos && existingFotos.length > 0
            ? existingFotos[0].urutan + 1
            : 0

        for (const pf of processed) {
            const fileName = `${warungId}/${Date.now()}-${pf.name}.webp`

            const { error: uploadError } = await supabase.storage
                .from('warung-photos')
                .upload(fileName, pf.blob, {
                    contentType: 'image/webp',
                    cacheControl: '31536000', // cache 1 tahun — WebP sudah optimal
                })

            if (uploadError) {
                setError(`Gagal upload ${pf.name}: ${uploadError.message}`)
                continue
            }

            const { data: { publicUrl } } = supabase.storage
                .from('warung-photos')
                .getPublicUrl(fileName)

            await supabase.from('warung_foto').insert({
                warung_id: warungId,
                foto_url: publicUrl,
                urutan: nextUrutan,
            })

            nextUrutan++
        }

        // Bebaskan semua object URL
        processed.forEach((pf) => URL.revokeObjectURL(pf.preview))
        setProcessed([])
        setUploading(false)
        onUploadComplete()
    }

    return (
        <div className="space-y-4">
            {/* Drop Area */}
            <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-brown/20 dark:border-warm/20 rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                    {converting ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-muted dark:text-warm/50">Mengkonversi ke WebP...</p>
                        </div>
                    ) : (
                        <>
                            <ImageIcon className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                            <p className="text-sm text-muted dark:text-warm/50">
                                Klik untuk pilih foto, atau drag &amp; drop
                            </p>
                            <p className="text-xs text-muted/40 dark:text-warm/30 mt-1">
                                JPG, PNG, HEIC, WebP — otomatis dikonversi ke WebP &amp; dikompres
                            </p>
                        </>
                    )}
                </div>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={converting || uploading}
                    className="hidden"
                />
            </label>

            {/* Ringkasan kompresi */}
            {processed.length > 0 && totalSaved.pct > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/8 border border-green-500/20 rounded-xl text-xs text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                        <strong>{processed.length} foto</strong> dikonversi ke WebP —
                        ukuran berkurang <strong>{totalSaved.pct}%</strong> ({formatSize(totalSaved.orig)} → {formatSize(totalSaved.comp)})
                    </span>
                </div>
            )}

            {/* Previews */}
            {processed.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {processed.map((pf, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                            <Image
                                src={pf.preview}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                                unoptimized // sudah dioptimasi manual
                            />
                            {/* Info ukuran */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 text-center leading-tight">
                                {formatSize(pf.compressedSize)}
                                {pf.originalSize > pf.compressedSize && (
                                    <span className="text-green-400 ml-1">
                                        -{Math.round((1 - pf.compressedSize / pf.originalSize) * 100)}%
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                type="button"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <p className="text-red-500 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
                    {error}
                </p>
            )}

            {/* Upload Button */}
            {processed.length > 0 && (
                <button
                    onClick={handleUpload}
                    disabled={uploading || converting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted text-white font-medium rounded-xl transition-all"
                    type="button"
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'Mengupload...' : `Upload ${processed.length} Foto`}
                </button>
            )}
        </div>
    )
}
