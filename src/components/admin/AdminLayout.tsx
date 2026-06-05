import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Sparkles,
  Tag,
  Users,
  X,
} from 'lucide-react'
import { useEffect, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAdminStore, type AdminToast } from '../../store'
import { cn } from '../ui/utils'

type AdminNavItem = {
  icon: ComponentType<{ className?: string }>
  label: string
  notifications?: number
  to: string
}

const navItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
  { icon: Package, label: 'Productos', to: '/admin/productos' },
  { icon: ShoppingBag, label: 'Pedidos', notifications: 2, to: '/admin/pedidos' },
  { icon: Tag, label: 'Categorias', to: '/admin/productos?panel=categorias' },
  { icon: Sparkles, label: 'Intenciones', to: '/admin/productos?panel=intenciones' },
  { icon: Users, label: 'Clientes', to: '/admin/pedidos?panel=clientes' },
  { icon: Globe, label: 'Contenido', to: '/admin/contenido' },
]

function ToastIcon({ variant }: { variant: AdminToast['variant'] }) {
  if (variant === 'success') {
    return <CheckCircle2 className="h-4 w-4 text-sage" />
  }

  if (variant === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-gold" />
  }

  return <AlertTriangle className="h-4 w-4 text-red-400" />
}

function ToastCard({ toast }: { toast: AdminToast }) {
  const dismissToast = useAdminStore((state) => state.dismissToast)

  useEffect(() => {
    const timeout = window.setTimeout(() => dismissToast(toast.id), 3000)

    return () => window.clearTimeout(timeout)
  }, [dismissToast, toast.id])

  return (
    <motion.div
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={cn(
        'flex w-[320px] items-start gap-3 rounded-xl border bg-[#242424] p-4 text-cream-light shadow-lifted',
        toast.variant === 'success' && 'border-sage/40',
        toast.variant === 'warning' && 'border-gold/40',
        toast.variant === 'error' && 'border-red-400/40',
      )}
      exit={{ opacity: 0, x: 48, y: -8 }}
      initial={{ opacity: 0, x: 48, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <ToastIcon variant={toast.variant} />
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm font-semibold text-cream-light">
          {toast.title}
        </p>
        <p className="mt-1 font-body text-xs leading-relaxed text-cream-dark/75">
          {toast.message}
        </p>
      </div>
      <button
        aria-label="Cerrar notificacion"
        className="grid h-7 w-7 place-items-center rounded-full text-cream-dark/70 transition-colors hover:bg-white/5 hover:text-cream-light"
        onClick={() => dismissToast(toast.id)}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

function ToastViewport() {
  const toasts = useAdminStore((state) => state.toasts)

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[140] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div className="pointer-events-auto" key={toast.id}>
            <ToastCard toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * Protected admin shell with dark sidebar navigation, route transitions and
 * global toast notifications for optimistic saves.
 */
export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    window.localStorage.removeItem('auralith-admin-token')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#111111] text-cream-light">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col bg-[#1A1A1A] lg:flex">
        <div className="border-b border-white/5 px-6 py-6">
          <p className="font-display text-xl tracking-widest text-cream">AURALITH</p>
          <p className="mt-1 font-body text-[10px] uppercase tracking-[0.28em] text-gold">
            Admin
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Admin">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-r-lg border-l-[3px] border-transparent px-4 py-3 font-body text-sm text-cream-dark/70 transition-colors hover:bg-white/5 hover:text-cream-light',
                    isActive &&
                      'border-l-gold bg-gold/10 text-gold hover:bg-gold/10 hover:text-gold',
                  )
                }
                end={item.to === '/admin'}
                key={item.label}
                to={item.to}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.notifications ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 font-body text-[10px] font-semibold text-white">
                    {item.notifications}
                  </span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gold text-sm font-semibold text-ink">
              AU
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-sm font-semibold text-cream">
                Admin Auralith
              </p>
              <p className="font-body text-xs text-cream-dark/60">Operaciones</p>
            </div>
            <button
              aria-label="Cerrar sesion"
              className="grid h-8 w-8 place-items-center rounded-full text-cream-dark/70 transition-colors hover:bg-white/5 hover:text-gold"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="border-b border-white/5 bg-[#1A1A1A] px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg tracking-widest text-cream">AURALITH</p>
            <p className="font-body text-[10px] uppercase tracking-widest text-gold">
              Admin
            </p>
          </div>
          <button
            className="rounded-full border border-gold/30 px-4 py-2 font-body text-xs text-gold"
            onClick={handleLogout}
            type="button"
          >
            Salir
          </button>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Admin mobile">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-full border border-white/10 px-3 py-2 font-body text-xs text-cream-dark/70',
                  isActive && 'border-gold bg-gold/10 text-gold',
                )
              }
              end={item.to === '/admin'}
              key={item.label}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="lg:pl-60">
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            key={location.pathname}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <ToastViewport />
    </div>
  )
}
