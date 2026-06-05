import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { categories, products } from '../data'

export type AdminProductStatus = 'active' | 'draft' | 'hidden' | 'sold-out'
export type AdminOrderStatus =
  | 'cancelled'
  | 'confirmed'
  | 'contacted'
  | 'delivered'
  | 'new'
  | 'preparing'
export type ToastVariant = 'error' | 'success' | 'warning'

export type AdminProduct = {
  categoryId: string
  description: string
  id: string
  images: string[]
  intentionIds: string[]
  name: string
  offerPrice?: number | null
  price: number
  seoDescription: string
  seoTitle: string
  shortDescription: string
  sku: string
  slug: string
  status: AdminProductStatus
  stock: number
  subcategoryIds: string[]
  tags: string[]
}

export type AdminOrder = {
  city: string
  code: string
  createdAt: string
  customer: string
  deliveryType: string
  id: string
  items: Array<{
    name: string
    quantity: number
  }>
  note?: string
  status: AdminOrderStatus
  total: number
  whatsapp: string
}

export type AdminContent = {
  faqs: Array<{
    answer: string
    id: string
    question: string
  }>
  heroPrimaryButton: string
  heroSecondaryButton: string
  heroText: string
  instagramHandle: string
  schedule: string
  storyText: string
  whatsappNumber: string
}

export type AdminToast = {
  id: string
  message: string
  title: string
  variant: ToastVariant
}

type AdminState = {
  addToast: (toast: Omit<AdminToast, 'id'>) => void
  content: AdminContent
  deleteProduct: (productId: string) => void
  dismissToast: (toastId: string) => void
  orders: AdminOrder[]
  products: AdminProduct[]
  removeOrder: (orderId: string) => void
  toasts: AdminToast[]
  toggleProductVisibility: (productId: string) => void
  updateContent: (content: AdminContent) => void
  updateOrderStatus: (orderId: string, status: AdminOrderStatus) => void
  upsertProduct: (product: AdminProduct) => void
}

const productVisuals: Record<string, string> = {
  'prod-aceite-inti':
    'https://images.unsplash.com/photo-1608571423539-e951a50ca0fe?auto=format&fit=crop&w=640&q=80',
  'prod-bruma-munay':
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=640&q=80',
  'prod-collar-amatista':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=640&q=80',
  'prod-cuenco-cobre':
    'https://images.unsplash.com/photo-1602874801006-e26d7d5d1f76?auto=format&fit=crop&w=640&q=80',
  'prod-cuarzo-rosa-andino':
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=640&q=80',
  'prod-elixir-floral-killa':
    'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=640&q=80',
  'prod-oraculo-andino':
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=640&q=80',
  'prod-palo-santo-piurano':
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=640&q=80',
  'prod-sahumador-cusco':
    'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=640&q=80',
  'prod-sal-maras':
    'https://images.unsplash.com/photo-1505577058444-a3dab90d4253?auto=format&fit=crop&w=640&q=80',
  'prod-set-luna-nueva':
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=640&q=80',
  'prod-vela-pachamama':
    'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=640&q=80',
}

function mapStatus(status: string, stock: number): AdminProductStatus {
  if (status === 'sold-out') {
    return 'sold-out'
  }

  if (stock <= 0) {
    return 'sold-out'
  }

  return 'active'
}

const seededProducts: AdminProduct[] = products.map((product, index) => {
  const stock = product.status === 'low-stock' ? Math.min(product.stock, 4) : product.stock

  return {
    categoryId: product.categoryId,
    description: product.description,
    id: product.id,
    images: [productVisuals[product.id] ?? product.images[0]?.src ?? ''],
    intentionIds: product.intentionIds,
    name: product.name,
    offerPrice: product.compareAtPrice ? product.price : null,
    price: product.compareAtPrice ?? product.price,
    seoDescription: product.seo.description,
    seoTitle: product.seo.title,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    status: index === 8 ? 'hidden' : mapStatus(product.status, stock),
    stock,
    subcategoryIds: [categories.find((category) => category.id === product.categoryId)?.slug ?? ''],
    tags: product.tags,
  }
})

const seededOrders: AdminOrder[] = [
  {
    city: 'Lima',
    code: 'AUR-1028',
    createdAt: '2026-06-03T09:18:00-05:00',
    customer: 'Mariana Quispe',
    deliveryType: 'Delivery',
    id: 'order-1028',
    items: [
      { name: 'Cuarzo Rosa Andino', quantity: 1 },
      { name: 'Palo Santo Piurano', quantity: 2 },
    ],
    note: 'Coordinar envio por la tarde.',
    status: 'new',
    total: 293,
    whatsapp: '51987654321',
  },
  {
    city: 'Cusco',
    code: 'AUR-1027',
    createdAt: '2026-06-03T08:42:00-05:00',
    customer: 'Lucia Andrade',
    deliveryType: 'Coordinar',
    id: 'order-1027',
    items: [{ name: 'Sahumador de Ceramica Cusco', quantity: 1 }],
    status: 'contacted',
    total: 189,
    whatsapp: '51945678912',
  },
  {
    city: 'Arequipa',
    code: 'AUR-1026',
    createdAt: '2026-06-02T17:15:00-05:00',
    customer: 'Ana Rojas',
    deliveryType: 'Recojo',
    id: 'order-1026',
    items: [
      { name: 'Set Luna Nueva', quantity: 1 },
      { name: 'Aceite Ritual Inti', quantity: 1 },
    ],
    status: 'confirmed',
    total: 327,
    whatsapp: '51912345678',
  },
  {
    city: 'Trujillo',
    code: 'AUR-1025',
    createdAt: '2026-06-02T12:04:00-05:00',
    customer: 'Valeria Leon',
    deliveryType: 'Delivery',
    id: 'order-1025',
    items: [{ name: 'Bruma Munay', quantity: 2 }],
    status: 'preparing',
    total: 196,
    whatsapp: '51965432109',
  },
  {
    city: 'Lima',
    code: 'AUR-1024',
    createdAt: '2026-06-01T18:35:00-05:00',
    customer: 'Camila Torres',
    deliveryType: 'Delivery',
    id: 'order-1024',
    items: [{ name: 'Collar de Amatista', quantity: 1 }],
    status: 'delivered',
    total: 219,
    whatsapp: '51977778888',
  },
  {
    city: 'Piura',
    code: 'AUR-1023',
    createdAt: '2026-06-01T11:20:00-05:00',
    customer: 'Rosa Medina',
    deliveryType: 'Coordinar',
    id: 'order-1023',
    items: [{ name: 'Oraculo Andino', quantity: 1 }],
    status: 'cancelled',
    total: 168,
    whatsapp: '51922223333',
  },
]

const seededContent: AdminContent = {
  faqs: [
    {
      answer: 'Coordinamos cada pedido por WhatsApp antes de confirmar pago y envio.',
      id: 'faq-1',
      question: 'Como compro en Auralith?',
    },
    {
      answer: 'Si. Delivery en Lima y envios a provincia segun disponibilidad.',
      id: 'faq-2',
      question: 'Hacen envios?',
    },
    {
      answer: 'Cada pieza incluye una guia breve para limpiar, usar y conservar su energia.',
      id: 'faq-3',
      question: 'Como cuido mis productos?',
    },
  ],
  heroPrimaryButton: 'Explorar tienda',
  heroSecondaryButton: 'Comprar por intencion',
  heroText: 'Productos holísticos para armonizar tu energía',
  instagramHandle: '@auralith.pe',
  schedule: 'Lunes a sabado, 10:00 a 19:00',
  storyText:
    'Auralith cura piezas holisticas con sensibilidad peruana, materiales nobles y rituales simples para la vida diaria.',
  whatsappNumber: '+51 999 999 999',
}

export const orderStatusLabels: Record<AdminOrderStatus, string> = {
  cancelled: 'Cancelado',
  confirmed: 'Confirmado',
  contacted: 'Contactado',
  delivered: 'Entregado',
  new: 'Nuevo',
  preparing: 'Preparando',
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      addToast: (toast) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`

        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
      },
      content: seededContent,
      deleteProduct: (productId) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== productId),
        })),
      dismissToast: (toastId) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== toastId),
        })),
      orders: seededOrders,
      products: seededProducts,
      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
        })),
      toasts: [],
      toggleProductVisibility: (productId) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  status: product.status === 'hidden' ? 'active' : 'hidden',
                }
              : product,
          ),
        })),
      updateContent: (content) => set({ content }),
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order,
          ),
        })),
      upsertProduct: (product) =>
        set((state) => {
          const exists = state.products.some((item) => item.id === product.id)
          const products = exists
            ? state.products.map((item) => (item.id === product.id ? product : item))
            : [product, ...state.products]

          return { products }
        }),
    }),
    {
      name: 'auralith-admin',
      partialize: (state) => ({
        content: state.content,
        orders: state.orders,
        products: state.products,
      }),
    },
  ),
)
