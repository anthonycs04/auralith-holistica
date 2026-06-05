import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { AlertTriangle, Clock, Package, ShoppingBag } from 'lucide-react'
import { useEffect } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { ReactNode } from 'react'
import { orderStatusLabels, useAdminStore, type AdminOrderStatus } from '../../store'
import { cn } from '../../components/ui/utils'

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

const statusColors: Record<AdminOrderStatus, string> = {
  cancelled: '#ef4444',
  confirmed: '#8FA58C',
  contacted: '#9F8F7E',
  delivered: '#B5C9B2',
  new: '#C9A86A',
  preparing: '#DFC08A',
}

function CountValue({
  formatter,
  value,
}: {
  formatter?: (value: number) => string
  value: number
}) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) =>
    formatter ? formatter(latest) : Math.round(latest).toString(),
  )

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    })

    return () => controls.stop()
  }, [motionValue, value])

  return <motion.span>{rounded}</motion.span>
}

function MetricCard({
  color,
  icon,
  label,
  value,
  formatter,
}: {
  color: string
  formatter?: (value: number) => string
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-[#242424] p-5"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="mb-5 grid h-10 w-10 place-items-center rounded-full"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {icon}
      </div>
      <p className="font-body text-xs uppercase tracking-widest text-cream-dark/55">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl leading-none text-cream">
        <CountValue formatter={formatter} value={value} />
      </p>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-widest',
        status === 'new' && 'bg-gold/15 text-gold',
        status === 'confirmed' && 'bg-sage/15 text-sage-light',
        status === 'cancelled' && 'bg-red-500/15 text-red-300',
        status !== 'new' &&
          status !== 'confirmed' &&
          status !== 'cancelled' &&
          'bg-white/10 text-cream-dark',
      )}
    >
      {orderStatusLabels[status]}
    </span>
  )
}

export function AdminDashboardPage() {
  const products = useAdminStore((state) => state.products)
  const orders = useAdminStore((state) => state.orders)
  const lowStockProducts = products.filter((product) => product.stock <= 5)
  const newOrders = orders.filter((order) => order.status === 'new').length
  const pendingOrders = orders.filter((order) =>
    ['new', 'contacted', 'confirmed', 'preparing'].includes(order.status),
  ).length
  const todayTotal = orders
    .filter((order) => order.createdAt.startsWith('2026-06-03'))
    .reduce((total, order) => total + order.total, 0)
  const chartData = (
    ['new', 'contacted', 'confirmed', 'preparing', 'delivered', 'cancelled'] as AdminOrderStatus[]
  ).map((status) => ({
    count: orders.filter((order) => order.status === status).length,
    fill: statusColors[status],
    name: orderStatusLabels[status],
  }))

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Operaciones
          </p>
          <h1 className="mt-2 font-display text-4xl text-cream">Dashboard</h1>
        </div>
        <p className="font-body text-sm text-cream-dark/60">
          Actualizado {format(parseISO('2026-06-03T10:30:00-05:00'), 'dd/MM/yyyy HH:mm')}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          color="#C9A86A"
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Pedidos nuevos"
          value={newOrders}
        />
        <MetricCard
          color="#ef4444"
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Bajo stock"
          value={lowStockProducts.length}
        />
        <MetricCard
          color="#8FA58C"
          icon={<Clock className="h-5 w-5" />}
          label="Pendientes"
          value={pendingOrders}
        />
        <MetricCard
          color="#DFC08A"
          formatter={(value) => currencyFormatter.format(Math.round(value))}
          icon={<Package className="h-5 w-5" />}
          label="Total hoy S/"
          value={todayTotal}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="rounded-xl border border-white/5 bg-[#242424] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl text-cream">Pedidos por estado</h2>
            <p className="font-body text-xs uppercase tracking-widest text-cream-dark/45">
              Semana actual
            </p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ bottom: 8, left: 12, right: 20, top: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis allowDecimals={false} stroke="rgba(232,226,214,0.45)" type="number" />
                <YAxis
                  dataKey="name"
                  stroke="rgba(232,226,214,0.65)"
                  tickLine={false}
                  type="category"
                  width={92}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1A1A1A',
                    border: '1px solid rgba(201,168,106,0.25)',
                    borderRadius: 12,
                    color: '#F5F1E8',
                  }}
                />
                <Bar dataKey="count" isAnimationActive radius={[0, 8, 8, 0]}>
                  {chartData.map((entry) => (
                    <Cell fill={entry.fill} key={entry.name} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#242424] p-5">
          <h2 className="font-display text-2xl text-cream">Stock crítico</h2>
          <div className="mt-5 space-y-4">
            {lowStockProducts.map((product) => {
              const percentage = Math.max(8, Math.min(100, (product.stock / 10) * 100))

              return (
                <div key={product.id}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="truncate font-body text-sm text-cream-dark">
                      {product.name}
                    </p>
                    <span className="font-body text-xs font-semibold text-gold">
                      {product.stock} u.
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      animate={{ width: `${percentage}%` }}
                      className="h-full rounded-full bg-gold"
                      initial={{ width: 0 }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-white/5 bg-[#242424]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-display text-2xl text-cream">Últimos pedidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="text-left font-body text-[11px] uppercase tracking-widest text-cream-dark/45">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr
                  className="border-t border-white/5 transition-colors hover:bg-white/5"
                  key={order.id}
                >
                  <td className="px-5 py-4 font-body text-sm font-semibold text-cream">
                    {order.code}
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-cream-dark">
                    {order.customer}
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-gold">
                    {currencyFormatter.format(order.total)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4">
                    <a
                      className="rounded-full border border-[#25D366]/35 px-3 py-1.5 font-body text-xs text-[#25D366] transition-colors hover:bg-[#25D366]/10"
                      href={`https://wa.me/${order.whatsapp}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
