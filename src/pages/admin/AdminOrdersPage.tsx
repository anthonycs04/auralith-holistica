import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { MessageCircle, Phone, X } from 'lucide-react'
import { useRef, useState, type RefObject } from 'react'
import {
  orderStatusLabels,
  useAdminStore,
  type AdminOrder,
  type AdminOrderStatus,
} from '../../store'
import { cn } from '../../components/ui/utils'

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

const columns: Array<{ color: string; status: AdminOrderStatus }> = [
  { color: '#C9A86A', status: 'new' },
  { color: '#9F8F7E', status: 'contacted' },
  { color: '#8FA58C', status: 'confirmed' },
  { color: '#DFC08A', status: 'preparing' },
  { color: '#B5C9B2', status: 'delivered' },
  { color: '#ef4444', status: 'cancelled' },
]

function OrderCard({
  constraintsRef,
  onDragToStatus,
  onOpen,
  order,
}: {
  constraintsRef: RefObject<HTMLDivElement | null>
  onDragToStatus: (orderId: string, pointX: number) => void
  onOpen: (order: AdminOrder) => void
  order: AdminOrder
}) {
  return (
    <motion.button
      className="w-full rounded-xl border border-white/10 bg-[#242424] p-4 text-left shadow-soft transition-colors hover:border-gold/35"
      data-cursor="drag"
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.12}
      layout
      onClick={() => onOpen(order)}
      onDragEnd={(_, info: PanInfo) => onDragToStatus(order.id, info.point.x)}
      whileDrag={{ scale: 1.03, zIndex: 20 }}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            #{order.code}
          </p>
          <h3 className="mt-2 font-body text-sm font-semibold text-cream">
            {order.customer}
          </h3>
        </div>
        <span className="font-body text-sm font-semibold text-gold">
          {currencyFormatter.format(order.total)}
        </span>
      </div>
      <a
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#25D366]/30 px-3 py-1 font-body text-xs text-[#25D366]"
        href={`https://wa.me/${order.whatsapp}`}
        onClick={(event) => event.stopPropagation()}
        rel="noreferrer"
        target="_blank"
      >
        <Phone className="h-3.5 w-3.5" />
        {order.whatsapp}
      </a>
      <div className="mt-4 space-y-1">
        {order.items.slice(0, 2).map((item) => (
          <p className="font-body text-xs text-cream-dark/65" key={item.name}>
            {item.quantity} x {item.name}
          </p>
        ))}
        {order.items.length > 2 ? (
          <p className="font-body text-xs text-cream-dark/45">
            +{order.items.length - 2} producto adicional
          </p>
        ) : null}
      </div>
    </motion.button>
  )
}

function OrderDetail({
  onClose,
  order,
}: {
  onClose: () => void
  order: AdminOrder | null
}) {
  return (
    <AnimatePresence>
      {order ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <button
            aria-label="Cerrar detalle desde fondo"
            className="absolute inset-0"
            onClick={onClose}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#202020] shadow-lifted"
            exit={{ x: '100%' }}
            initial={{ x: '100%' }}
            transition={{ damping: 35, stiffness: 300, type: 'spring' }}
          >
            <header className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
                  #{order.code}
                </p>
                <h2 className="mt-2 font-display text-3xl text-cream">
                  {order.customer}
                </h2>
              </div>
              <button
                aria-label="Cerrar detalle"
                className="grid h-10 w-10 place-items-center rounded-full text-cream-dark transition-colors hover:bg-white/5 hover:text-cream"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <dl className="grid gap-4 rounded-xl border border-white/10 bg-[#191919] p-4">
                <div>
                  <dt className="font-body text-xs uppercase tracking-widest text-cream-dark/45">
                    Estado
                  </dt>
                  <dd className="mt-1 font-body text-sm text-cream">
                    {orderStatusLabels[order.status]}
                  </dd>
                </div>
                <div>
                  <dt className="font-body text-xs uppercase tracking-widest text-cream-dark/45">
                    Ciudad
                  </dt>
                  <dd className="mt-1 font-body text-sm text-cream">{order.city}</dd>
                </div>
                <div>
                  <dt className="font-body text-xs uppercase tracking-widest text-cream-dark/45">
                    Entrega
                  </dt>
                  <dd className="mt-1 font-body text-sm text-cream">
                    {order.deliveryType}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
                  Productos
                </h3>
                <div className="mt-3 space-y-3">
                  {order.items.map((item) => (
                    <div
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#191919] px-4 py-3"
                      key={item.name}
                    >
                      <p className="font-body text-sm text-cream">{item.name}</p>
                      <p className="font-body text-sm text-gold">x{item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {order.note ? (
                <div className="mt-6 rounded-xl border border-gold/20 bg-gold/10 p-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
                    Nota
                  </p>
                  <p className="mt-2 font-body text-sm leading-relaxed text-cream-dark">
                    {order.note}
                  </p>
                </div>
              ) : null}
            </div>
            <footer className="border-t border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-body text-sm text-cream-dark/60">Total</span>
                <span className="font-body text-2xl font-semibold text-gold">
                  {currencyFormatter.format(order.total)}
                </span>
              </div>
              <a
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 font-body text-sm font-semibold text-white"
                href={`https://wa.me/${order.whatsapp}`}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-4 w-4" />
                Contactar por WhatsApp
              </a>
            </footer>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function AdminOrdersPage() {
  const orders = useAdminStore((state) => state.orders)
  const updateOrderStatus = useAdminStore((state) => state.updateOrderStatus)
  const addToast = useAdminStore((state) => state.addToast)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef<Record<string, HTMLElement | null>>({})

  const handleDragToStatus = (orderId: string, pointX: number) => {
    const targetColumn = columns.find(({ status }) => {
      const rect = columnRefs.current[status]?.getBoundingClientRect()

      return rect ? pointX >= rect.left && pointX <= rect.right : false
    })

    if (!targetColumn) {
      return
    }

    const order = orders.find((item) => item.id === orderId)

    if (order && order.status !== targetColumn.status) {
      updateOrderStatus(orderId, targetColumn.status)
      addToast({
        message: `${order.code} ahora está en ${orderStatusLabels[targetColumn.status]}.`,
        title: 'Pedido actualizado',
        variant: 'success',
      })
    }
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
          Gestión de pedidos
        </p>
        <h1 className="mt-2 font-display text-4xl text-cream">Pedidos</h1>
      </div>

      <div
        className="grid min-h-[calc(100vh-9rem)] gap-4 overflow-x-auto pb-4 xl:grid-cols-6"
        ref={boardRef}
      >
        {columns.map((column) => {
          const columnOrders = orders.filter((order) => order.status === column.status)

          return (
            <section
              className="min-w-[280px] rounded-xl border border-white/5 bg-[#191919] p-3"
              key={column.status}
              ref={(node) => {
                columnRefs.current[column.status] = node
              }}
            >
              <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h2 className="font-body text-sm font-semibold text-cream">
                    {orderStatusLabels[column.status]}
                  </h2>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 font-body text-xs text-cream-dark">
                  {columnOrders.length}
                </span>
              </header>
              <motion.div className="space-y-3" layout>
                <AnimatePresence initial={false}>
                  {columnOrders.map((order) => (
                    <OrderCard
                      constraintsRef={boardRef}
                      key={order.id}
                      onDragToStatus={handleDragToStatus}
                      onOpen={setSelectedOrder}
                      order={order}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
              {!columnOrders.length ? (
                <div
                  className={cn(
                    'grid min-h-32 place-items-center rounded-xl border border-dashed border-white/10 text-center font-body text-xs text-cream-dark/45',
                  )}
                >
                  Sin pedidos
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      <OrderDetail onClose={() => setSelectedOrder(null)} order={selectedOrder} />
    </div>
  )
}
