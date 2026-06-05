import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
  EyeOff,
  GripVertical,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import { z } from 'zod'
import { categories, intentions } from '../../data'
import {
  useAdminStore,
  type AdminProduct,
  type AdminProductStatus,
} from '../../store'
import { cn } from '../../components/ui/utils'

type ProductTab = 'general' | 'images' | 'organization' | 'seo'

const productTabs: Array<{ id: ProductTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'images', label: 'Imágenes' },
  { id: 'organization', label: 'Organización' },
  { id: 'seo', label: 'SEO' },
]

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

const productSchema = z.object({
  categoryId: z.string().min(1, 'Selecciona una categoría.'),
  description: z.string().min(10, 'Agrega una descripción completa.'),
  intentionIds: z.array(z.string()).min(1, 'Selecciona al menos una intención.'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  offerPrice: z.preprocess(
    (value) => (value === '' || value === null ? undefined : Number(value)),
    z.number().positive('El precio oferta debe ser mayor a 0.').optional(),
  ),
  price: z.coerce.number().positive('El precio debe ser mayor a 0.'),
  seoDescription: z.string().min(10, 'Agrega una descripción SEO.'),
  seoTitle: z.string().min(3, 'Agrega un título SEO.'),
  shortDescription: z.string().min(8, 'Agrega una descripción corta.'),
  sku: z.string().min(3, 'Agrega un SKU.'),
  slug: z.string().min(3, 'Agrega un slug.'),
  status: z.enum(['active', 'draft', 'hidden', 'sold-out']),
  stock: z.coerce.number().min(0, 'El stock no puede ser negativo.'),
  subcategoryIds: z.array(z.string()),
  tags: z.array(z.string()),
})

type ProductFormInput = z.input<typeof productSchema>
type ProductFormValues = z.output<typeof productSchema>

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 font-body text-xs text-red-300"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: -4 }}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}

function StatusBadge({ status }: { status: AdminProductStatus }) {
  const label = {
    active: 'Activo',
    draft: 'Borrador',
    hidden: 'Oculto',
    'sold-out': 'Agotado',
  }[status]

  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-widest',
        status === 'active' && 'bg-sage/15 text-sage-light',
        status === 'draft' && 'bg-beige/15 text-beige-light',
        status === 'hidden' && 'bg-white/10 text-cream-dark/70',
        status === 'sold-out' && 'bg-red-500/15 text-red-300',
      )}
    >
      {label}
    </span>
  )
}

function TextInput({
  error,
  label,
  register,
  type = 'text',
}: {
  error?: string
  label: string
  register: UseFormRegisterReturn
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
        {label}
      </span>
      <input
        className={cn(
          'h-11 w-full rounded-xl border bg-[#191919] px-4 font-body text-sm text-cream outline-none transition-colors focus:border-gold',
          error ? 'border-red-400/70' : 'border-white/10',
        )}
        type={type}
        {...register}
      />
      <FieldError message={error} />
    </label>
  )
}

function TextArea({
  error,
  label,
  register,
  rows = 4,
}: {
  error?: string
  label: string
  register: UseFormRegisterReturn
  rows?: number
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
        {label}
      </span>
      <textarea
        className={cn(
          'w-full resize-none rounded-xl border bg-[#191919] px-4 py-3 font-body text-sm text-cream outline-none transition-colors focus:border-gold',
          error ? 'border-red-400/70' : 'border-white/10',
        )}
        rows={rows}
        {...register}
      />
      <FieldError message={error} />
    </label>
  )
}

function ProductModal({
  onClose,
  product,
}: {
  onClose: () => void
  product: AdminProduct | null
}) {
  const [activeTab, setActiveTab] = useState<ProductTab>('general')
  const [images, setImages] = useState<string[]>(
    product?.images.filter(Boolean) ?? [],
  )
  const [tagInput, setTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [draftSku] = useState(
    () => product?.sku ?? `AUR-${Date.now().toString().slice(-5)}`,
  )
  const upsertProduct = useAdminStore((state) => state.upsertProduct)
  const addToast = useAdminStore((state) => state.addToast)
  const {
    formState: { errors },
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    defaultValues: {
      categoryId: product?.categoryId ?? categories[0]?.id ?? '',
      description: product?.description ?? '',
      intentionIds: product?.intentionIds ?? [],
      name: product?.name ?? '',
      offerPrice: product?.offerPrice ?? undefined,
      price: product?.price ?? 0,
      seoDescription: product?.seoDescription ?? '',
      seoTitle: product?.seoTitle ?? '',
      shortDescription: product?.shortDescription ?? '',
      sku: draftSku,
      slug: product?.slug ?? '',
      status: product?.status ?? 'active',
      stock: product?.stock ?? 0,
      subcategoryIds: product?.subcategoryIds ?? [],
      tags: product?.tags ?? [],
    },
    resolver: zodResolver(productSchema),
  })
  const watchedName = useWatch({ control, name: 'name' })
  const watchedSlug = useWatch({ control, name: 'slug' })
  const watchedTags = useWatch({ control, name: 'tags' }) ?? []
  const watchedIntentions = useWatch({ control, name: 'intentionIds' }) ?? []
  const watchedSubcategories = useWatch({ control, name: 'subcategoryIds' }) ?? []

  useEffect(() => {
    if (!product && watchedName && !watchedSlug) {
      setValue('slug', slugify(watchedName), { shouldValidate: true })
    }
  }, [product, setValue, watchedName, watchedSlug])

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    onDrop: (acceptedFiles) => {
      const previews = acceptedFiles.map((file) => URL.createObjectURL(file))
      setImages((current) => [...current, ...previews])
    },
  })

  const addTag = () => {
    const value = tagInput.trim().toLowerCase()

    if (!value || watchedTags.includes(value)) {
      setTagInput('')
      return
    }

    setValue('tags', [...watchedTags, value], { shouldValidate: true })
    setTagInput('')
  }

  const reorderImage = (fromIndex: number, toIndex: number) => {
    setImages((current) => {
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)

      if (!moved) {
        return current
      }

      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const submitProduct = (values: ProductFormValues) => {
    setIsSaving(true)
    window.setTimeout(() => {
      upsertProduct({
        ...values,
        id: product?.id ?? `prod-admin-${Date.now()}`,
        images: images.length ? images : ['/images/products/placeholder.jpg'],
      })
      addToast({
        message: `${values.name} quedó actualizado en el catálogo.`,
        title: 'Producto guardado',
        variant: 'success',
      })
      setIsSaving(false)
      onClose()
    }, 520)
  }

  const toggleArrayValue = (
    field: 'intentionIds' | 'subcategoryIds',
    value: string,
    checked: boolean,
  ) => {
    const current = getValues(field)
    const next = checked
      ? [...current, value]
      : current.filter((item) => item !== value)

    setValue(field, next, { shouldValidate: true })
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-0 backdrop-blur-sm md:p-6"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-[#202020] shadow-lifted md:h-auto md:max-h-[88vh] md:rounded-2xl md:border md:border-white/10"
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ damping: 24, stiffness: 280, type: 'spring' }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-gold">
              {product ? 'Editar producto' : 'Nuevo producto'}
            </p>
            <h2 className="mt-1 font-display text-3xl text-cream">
              {product?.name ?? 'Crear pieza'}
            </h2>
          </div>
          <button
            aria-label="Cerrar modal"
            className="grid h-10 w-10 place-items-center rounded-full text-cream-dark/70 transition-colors hover:bg-white/5 hover:text-cream"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-white/10 px-5">
          <div className="flex gap-2 overflow-x-auto">
            {productTabs.map((tab) => (
              <button
                className={cn(
                  'relative px-2 py-4 font-body text-sm text-cream-dark/60 transition-colors hover:text-cream',
                  activeTab === tab.id && 'text-gold',
                )}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
                {activeTab === tab.id ? (
                  <motion.span
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-gold"
                    layoutId="admin-product-tab"
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <form
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
          onSubmit={handleSubmit(submitProduct)}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'general' ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="grid gap-4 md:grid-cols-2"
                exit={{ opacity: 0, x: -16 }}
                initial={{ opacity: 0, x: 16 }}
                key="general"
              >
                <TextInput
                  error={errors.name?.message}
                  label="Nombre"
                  register={register('name')}
                />
                <TextInput
                  error={errors.sku?.message}
                  label="SKU"
                  register={register('sku')}
                />
                <div className="md:col-span-2">
                  <TextArea
                    error={errors.shortDescription?.message}
                    label="Descripción corta"
                    register={register('shortDescription')}
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <TextArea
                    error={errors.description?.message}
                    label="Descripción completa"
                    register={register('description')}
                    rows={5}
                  />
                </div>
                <TextInput
                  error={errors.price?.message}
                  label="Precio"
                  register={register('price')}
                  type="number"
                />
                <TextInput
                  error={errors.offerPrice?.message}
                  label="Precio oferta"
                  register={register('offerPrice')}
                  type="number"
                />
                <TextInput
                  error={errors.stock?.message}
                  label="Stock"
                  register={register('stock')}
                  type="number"
                />
                <label className="block">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Estado
                  </span>
                  <select
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none transition-colors focus:border-gold"
                    {...register('status')}
                  >
                    <option value="active">Activo</option>
                    <option value="draft">Borrador</option>
                    <option value="hidden">Oculto</option>
                    <option value="sold-out">Agotado</option>
                  </select>
                </label>
              </motion.div>
            ) : null}

            {activeTab === 'images' ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
                exit={{ opacity: 0, x: -16 }}
                initial={{ opacity: 0, x: 16 }}
                key="images"
              >
                <div
                  className={cn(
                    'grid min-h-44 cursor-pointer place-items-center rounded-2xl border border-dashed bg-[#191919] p-8 text-center transition-colors',
                    isDragActive ? 'border-gold bg-gold/10' : 'border-gold/35',
                  )}
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  <div>
                    <ImagePlus className="mx-auto h-8 w-8 text-gold" />
                    <p className="mt-4 font-body text-sm text-cream">
                      Arrastra imágenes o haz click para subir
                    </p>
                    <p className="mt-2 font-body text-xs text-cream-dark/55">
                      JPG, PNG o WebP
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((image, index) => (
                    <div
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#191919] p-3"
                      draggable
                      key={`${image}-${index}`}
                      onDragStart={(event) =>
                        event.dataTransfer.setData('text/plain', index.toString())
                      }
                      onDrop={(event) => {
                        event.preventDefault()
                        reorderImage(Number(event.dataTransfer.getData('text/plain')), index)
                      }}
                      onDragOver={(event) => event.preventDefault()}
                    >
                      <GripVertical className="h-5 w-5 shrink-0 text-cream-dark/45" />
                      <img
                        alt={`Preview ${index + 1}`}
                        className="h-16 w-16 rounded-lg object-cover"
                        src={image}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body text-xs text-cream-dark">
                          Imagen {index + 1}
                        </p>
                        {index === 0 ? (
                          <span className="mt-2 inline-flex rounded-full bg-gold/15 px-2 py-1 font-body text-[10px] uppercase tracking-widest text-gold">
                            Principal
                          </span>
                        ) : null}
                      </div>
                      <button
                        aria-label="Eliminar imagen"
                        className="grid h-8 w-8 place-items-center rounded-full text-cream-dark/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        onClick={() =>
                          setImages((current) =>
                            current.filter((_, imageIndex) => imageIndex !== index),
                          )
                        }
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}

            {activeTab === 'organization' ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
                exit={{ opacity: 0, x: -16 }}
                initial={{ opacity: 0, x: 16 }}
                key="organization"
              >
                <label className="block">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Categoría
                  </span>
                  <select
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none transition-colors focus:border-gold"
                    {...register('categoryId')}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.categoryId?.message} />
                </label>

                <div>
                  <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Subcategorías
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((category) => (
                      <label
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#191919] px-3 py-2 font-body text-sm text-cream-dark"
                        key={category.slug}
                      >
                        <input
                          checked={watchedSubcategories.includes(category.slug)}
                          onChange={(event) =>
                            toggleArrayValue(
                              'subcategoryIds',
                              category.slug,
                              event.target.checked,
                            )
                          }
                          type="checkbox"
                        />
                        {category.shortName}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Intenciones
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {intentions.map((intention) => (
                      <label
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#191919] px-3 py-2 font-body text-sm text-cream-dark"
                        key={intention.id}
                      >
                        <input
                          checked={watchedIntentions.includes(intention.id)}
                          onChange={(event) =>
                            toggleArrayValue(
                              'intentionIds',
                              intention.id,
                              event.target.checked,
                            )
                          }
                          type="checkbox"
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: intention.color }}
                        />
                        {intention.name}
                      </label>
                    ))}
                  </div>
                  <FieldError message={errors.intentionIds?.message} />
                </div>

                <div>
                  <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Etiquetas
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="h-11 flex-1 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none transition-colors focus:border-gold"
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addTag()
                        }
                      }}
                      value={tagInput}
                    />
                    <button
                      className="rounded-xl border border-gold/40 px-4 font-body text-sm text-gold transition-colors hover:bg-gold/10"
                      onClick={addTag}
                      type="button"
                    >
                      Agregar
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {watchedTags.map((tag) => (
                      <button
                        className="rounded-full bg-gold/15 px-3 py-1 font-body text-xs text-gold"
                        key={tag}
                        onClick={() =>
                          setValue(
                            'tags',
                            watchedTags.filter((item) => item !== tag),
                          )
                        }
                        type="button"
                      >
                        {tag} x
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}

            {activeTab === 'seo' ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
                exit={{ opacity: 0, x: -16 }}
                initial={{ opacity: 0, x: 16 }}
                key="seo"
              >
                <TextInput
                  error={errors.slug?.message}
                  label="Slug"
                  register={register('slug')}
                />
                <TextInput
                  error={errors.seoTitle?.message}
                  label="Título SEO"
                  register={register('seoTitle')}
                />
                <TextArea
                  error={errors.seoDescription?.message}
                  label="Descripción SEO"
                  register={register('seoDescription')}
                  rows={4}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>

        <footer className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
          <button
            className="rounded-full border border-gold/35 px-5 py-2.5 font-body text-sm text-gold transition-colors hover:bg-gold/10"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-full border border-gold bg-gold px-5 py-2.5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:pointer-events-none disabled:opacity-60"
            disabled={isSaving}
            onClick={handleSubmit(submitProduct)}
            type="button"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  )
}

function DeleteConfirm({
  onCancel,
  onConfirm,
  productName,
}: {
  onCancel: () => void
  onConfirm: () => void
  productName: string
}) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[130] grid place-items-center bg-black/60 p-5 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#242424] p-5"
        exit={{ opacity: 0, scale: 0.96 }}
        initial={{ opacity: 0, scale: 0.96 }}
      >
        <h3 className="font-display text-2xl text-cream">Eliminar producto</h3>
        <p className="mt-3 font-body text-sm leading-relaxed text-cream-dark/70">
          Esta acción quitará {productName} del catálogo administrativo.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-full border border-white/15 px-4 py-2 font-body text-sm text-cream-dark"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-full bg-red-500 px-4 py-2 font-body text-sm font-semibold text-white"
            onClick={onConfirm}
            type="button"
          >
            Eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function AdminProductsPage() {
  const products = useAdminStore((state) => state.products)
  const deleteProduct = useAdminStore((state) => state.deleteProduct)
  const toggleProductVisibility = useAdminStore((state) => state.toggleProductVisibility)
  const addToast = useAdminStore((state) => state.addToast)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const pageSize = 6

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.sku, product.tags.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesCategory =
        categoryFilter === 'all' || product.categoryId === categoryFilter
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter

      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [categoryFilter, products, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Catálogo
          </p>
          <h1 className="mt-2 font-display text-4xl text-cream">Productos</h1>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
          onClick={() => {
            setEditingProduct(null)
            setIsModalOpen(true)
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      <section className="rounded-xl border border-white/5 bg-[#242424]">
        <div className="grid gap-3 border-b border-white/5 p-4 md:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dark/45" />
            <input
              className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] pl-11 pr-4 font-body text-sm text-cream outline-none transition-colors focus:border-gold"
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar producto"
              value={query}
            />
          </label>
          <select
            className="h-11 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
            onChange={(event) => {
              setCategoryFilter(event.target.value)
              setPage(1)
            }}
            value={categoryFilter}
          >
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.shortName}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}
            value={statusFilter}
          >
            <option value="all">Todos</option>
            <option value="active">Activo</option>
            <option value="draft">Borrador</option>
            <option value="hidden">Oculto</option>
            <option value="sold-out">Agotado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="text-left font-body text-[11px] uppercase tracking-widest text-cream-dark/45">
                <th className="px-5 py-3 font-medium">Imagen</th>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Categoría</th>
                <th className="px-5 py-3 font-medium">Precio</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const category = categories.find((item) => item.id === product.categoryId)
                const stockPercentage = Math.max(6, Math.min(100, (product.stock / 30) * 100))

                return (
                  <tr
                    className="border-t border-white/5 transition-colors hover:bg-white/5"
                    key={product.id}
                  >
                    <td className="px-5 py-4">
                      <img
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                        src={product.images[0]}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-body text-sm font-semibold text-cream">
                        {product.name}
                      </p>
                      <p className="mt-1 font-body text-xs text-cream-dark/45">
                        {product.sku}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-body text-sm text-cream-dark">
                      {category?.shortName ?? 'Sin categoría'}
                    </td>
                    <td className="px-5 py-4 font-body text-sm text-gold">
                      {currencyFormatter.format(product.offerPrice ?? product.price)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-32">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-body text-xs text-cream-dark">
                            {product.stock}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            animate={{ width: `${stockPercentage}%` }}
                            className="h-full rounded-full bg-gold"
                            initial={{ width: 0 }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          aria-label={`Editar ${product.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-cream-dark/70 transition-colors hover:bg-white/10 hover:text-gold"
                          onClick={() => {
                            setEditingProduct(product)
                            setIsModalOpen(true)
                          }}
                          type="button"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          aria-label={`Ocultar ${product.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-cream-dark/70 transition-colors hover:bg-white/10 hover:text-gold"
                          onClick={() => {
                            toggleProductVisibility(product.id)
                            addToast({
                              message: `${product.name} cambió su visibilidad.`,
                              title: 'Visibilidad actualizada',
                              variant: 'warning',
                            })
                          }}
                          type="button"
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                        <button
                          aria-label={`Eliminar ${product.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-cream-dark/70 transition-colors hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => setDeleteTarget(product)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-5 py-4">
          <p className="font-body text-xs text-cream-dark/55">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-full border border-white/10 px-4 py-2 font-body text-xs text-cream-dark disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="rounded-full border border-white/10 px-4 py-2 font-body text-xs text-cream-dark disabled:opacity-40"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isModalOpen ? (
          <ProductModal
            onClose={() => setIsModalOpen(false)}
            product={editingProduct}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <DeleteConfirm
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => {
              deleteProduct(deleteTarget.id)
              addToast({
                message: `${deleteTarget.name} fue eliminado del catálogo.`,
                title: 'Producto eliminado',
                variant: 'error',
              })
              setDeleteTarget(null)
            }}
            productName={deleteTarget.name}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
