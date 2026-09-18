import { getStoreSettings } from '@/lib/settings'
import { SettingsForm } from './settings-form'

export const metadata = { title: 'Configuración' }

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings()

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
      <p className="mt-1 text-sm text-muted">
        Datos que el dueño de la tienda tiene que poder cambiar sin tocar código.
      </p>
      <SettingsForm settings={settings} />
    </div>
  )
}
