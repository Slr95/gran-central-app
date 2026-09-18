'use client'

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { createUploadSignature } from '@/app/admin/productos/actions'
import type { ProductImageInput } from '@/lib/validations/product'

export function ImageUploader({
  images,
  onChange,
}: {
  images: ProductImageInput[]
  onChange: (images: ProductImageInput[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const { timestamp, signature, apiKey, cloudName, folder } = await createUploadSignature()
      const uploaded: ProductImageInput[] = []

      for (const file of Array.from(files)) {
        const body = new FormData()
        body.append('file', file)
        body.append('api_key', apiKey)
        body.append('timestamp', String(timestamp))
        body.append('signature', signature)
        body.append('folder', folder)

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body,
        })

        if (!response.ok) {
          const detail = await response.json().catch(() => null)
          throw new Error(detail?.error?.message ?? 'Cloudinary rechazó la subida')
        }

        const result = await response.json()
        uploaded.push({ url: result.secure_url, publicId: result.public_id, alt: null })
      }

      onChange([...images, ...uploaded])
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div key={image.url} className="group relative size-28 overflow-hidden rounded-lg border border-brand-200">
            <Image src={image.url} alt={image.alt ?? ''} fill sizes="112px" className="object-cover" />

            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Principal
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" onClick={() => move(index, -1)} className="p-1 text-white">
                <ArrowLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                className="p-1 text-white"
              >
                <X className="size-3.5" />
              </button>
              <button type="button" onClick={() => move(index, 1)} className="p-1 text-white">
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex size-28 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-brand-200 text-muted hover:border-brand-400 hover:text-brand-600 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          <span className="text-xs">{uploading ? 'Subiendo…' : 'Agregar'}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <p className="mt-2 text-xs text-muted">
        La primera imagen es la que se ve en la grilla y en la preview de WhatsApp. Usá el hover para
        reordenar o quitar.
      </p>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
