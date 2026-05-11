'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type Props = {
    warungId: string
    onUploadComplete: () => void
}

export default function PhotoUpload({ warungId, onUploadComplete }: Props) {
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return

        const newFiles = Array.from(e.target.files)
        setFiles((prev) => [...prev, ...newFiles])

        newFiles.forEach((file) => {
            const reader = new FileReader()
            reader.onload = (ev) => {
                setPreviews((prev) => [...prev, ev.target?.result as string])
            }
            reader.readAsDataURL(file)
        })
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
        setPreviews((prev) => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) return

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

        for (const file of files) {
            const fileName = `${warungId}/${Date.now()}-${file.name}`

            const { error: uploadError } = await supabase.storage
                .from('warung-photos')
                .upload(fileName, file)

            if (uploadError) {
                setError(`Gagal upload ${file.name}: ${uploadError.message}`)
                continue
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from('warung-photos').getPublicUrl(fileName)

            await supabase.from('warung_foto').insert({
                warung_id: warungId,
                foto_url: publicUrl,
                urutan: nextUrutan,
            })

            nextUrutan++
        }

        setFiles([])
        setPreviews([])
        setUploading(false)
        onUploadComplete()
    }

    return (
        <div className="space-y-4">
            {/* Drop Area */}
            <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-brown/20 dark:border-warm/20 rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                    <p className="text-sm text-muted dark:text-warm/50">
                        Klik untuk pilih foto, atau drag & drop
                    </p>
                    <p className="text-xs text-muted/40 dark:text-warm/30 mt-1">
                        JPG, PNG, WebP (max 5MB per foto)
                    </p>
                </div>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>

            {/* Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                            <Image
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
            {files.length > 0 && (
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted text-white font-medium rounded-xl transition-all"
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'Mengupload...' : `Upload ${files.length} Foto`}
                </button>
            )}
        </div>
    )
}
