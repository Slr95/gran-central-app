'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createCategory } from './actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Crear categoría'}
    </button>
  )
}

export function CategoryCreateForm() {
  const [state, formAction] = useActionState(createCategory, undefined)

  return (
    <form action={formAction} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-brand-100 bg-white p-4">
      <label className="text-sm">
        Nombre
        <input name="name" required className="mt-1 block w-56 rounded-lg border border-brand-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-sm">
        Slug (opcional)
        <input name="slug" className="mt-1 block w-48 rounded-lg border border-brand-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-sm">
        Descripción
        <input name="description" className="mt-1 block w-72 rounded-lg border border-brand-200 px-3 py-2 text-sm" />
      </label>
      <Submit />
      {state?.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
    </form>
  )
}
