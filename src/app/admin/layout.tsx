import { LayoutDashboard, Package, Percent, Settings, ShoppingBag, Tags, Truck } from 'lucide-react'
import Link from 'next/link'
import { signOut } from '@/auth'
import { requireAdmin } from '@/lib/guards'

const navItems = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: Tags },
  { href: '/admin/ofertas', label: 'Ofertas', icon: Percent },
  { href: '/admin/ordenes', label: 'Órdenes', icon: ShoppingBag },
  { href: '/admin/envios', label: 'Envíos', icon: Truck },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-brand-100 bg-white p-4 md:block">
        <Link href="/" className="block px-2 text-lg font-bold text-brand-700">
          Gran Central
        </Link>
        <p className="mt-1 px-2 text-xs text-muted">Panel de administración</p>

        <nav className="mt-6 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 border-t border-brand-100 px-2 pt-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button type="submit" className="mt-3 text-sm text-brand-600 hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  )
}
