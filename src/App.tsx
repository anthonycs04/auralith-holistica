import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminLayout } from './components/admin/AdminLayout'
import { Layout } from './components/layout/Layout'
import { PageTransition } from './components/layout/PageTransition'
import { CustomCursor } from './components/ui/CustomCursor'
import { LoadingScreen } from './components/ui/LoadingScreen'

const CartPage = lazy(() =>
  import('./pages/CartPage').then((module) => ({ default: module.CartPage })),
)
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const ProductPage = lazy(() =>
  import('./pages/ProductPage').then((module) => ({
    default: module.ProductPage,
  })),
)
const ShopPage = lazy(() =>
  import('./pages/ShopPage').then((module) => ({ default: module.ShopPage })),
)
const AdminContentPage = lazy(() =>
  import('./pages/admin/AdminContentPage').then((module) => ({
    default: module.AdminContentPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((module) => ({
    default: module.AdminLoginPage,
  })),
)
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminOrdersPage').then((module) => ({
    default: module.AdminOrdersPage,
  })),
)
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((module) => ({
    default: module.AdminProductsPage,
  })),
)

function RouteFallback() {
  return <div aria-hidden="true" className="min-h-screen bg-cream-light" />
}

function AdminProtectedRoute() {
  const hasToken = Boolean(window.localStorage.getItem('auralith-admin-token'))

  if (!hasToken) {
    return <Navigate replace to="/admin/login" />
  }

  return <AdminLayout />
}

function App() {
  const location = useLocation()

  if (location.pathname.startsWith('/admin')) {
    return (
      <>
        <LoadingScreen />
        <PageTransition />
        <CustomCursor />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminProtectedRoute />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="productos" element={<AdminProductsPage />} />
              <Route path="pedidos" element={<AdminOrdersPage />} />
              <Route path="contenido" element={<AdminContentPage />} />
            </Route>
          </Routes>
        </Suspense>
      </>
    )
  }

  return (
    <>
      <LoadingScreen />
      <PageTransition />
      <CustomCursor />
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/producto/:slug" element={<ProductPage />} />
            <Route path="/tienda" element={<ShopPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  )
}

export default App
