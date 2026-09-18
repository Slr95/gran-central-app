'use client'

import type { ProductStatus } from '@prisma/client'
import { Archive, PencilLine, Star, Undo2 } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import { setProductStatus, toggleFeatured } from './actions'

export function ProductRowActions({
  id,
  status,
  isFeatured,
}: {
  id: string
  status: ProductStatus
  isFeatured: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        title={isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
        disabled={pending}
        onClick={() => startTransition(() => void toggleFeatured(id, !isFeatured))}
        className="rounded-md p-2 text-muted hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
      >
        <Star className={`size-4 ${isFeatured ? 'fill-brand-500 text-brand-500' : ''}`} />
      </button>

      <Link
        href={`/admin/productos/${id}`}
        title="Editar"
        className="rounded-md p-2 text-muted hover:bg-brand-50 hover:text-brand-600"
      >
        <PencilLine className="size-4" />
      </Link>

      {status === 'ARCHIVED' ? (
        <button
          type="button"
          title="Restaurar como borrador"
          disabled={pending}
          onClick={() => startTransition(() => void setProductStatus(id, 'DRAFT'))}
          className="rounded-md p-2 text-muted hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
        >
          <Undo2 className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          title="Archivar"
          disabled={pending}
          onClick={() => {
            // Archivar, no borrar: las órdenes viejas siguen apuntando al producto.
            if (!confirm('¿Archivar este producto? Deja de verse en la tienda pero no se pierde.')) return
            startTransition(() => void setProductStatus(id, 'ARCHIVED'))
          }}
          className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Archive className="size-4" />
        </button>
      )}
    </div>
  )
}
