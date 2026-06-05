import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (window.localStorage.getItem('auralith-admin-token')) {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Ingresa email y contraseña para continuar.')
      return
    }

    if (!email.includes('@') || password.length < 4) {
      setError('Credenciales no válidas para el panel.')
      return
    }

    window.localStorage.setItem(
      'auralith-admin-token',
      JSON.stringify({
        email,
        issuedAt: new Date().toISOString(),
        token: `auralith-${Date.now()}`,
      }),
    )
    navigate('/admin', { replace: true })
  }

  return (
    <main className="grid min-h-screen bg-ink text-cream lg:grid-cols-[55%_45%]">
      <section className="flex min-h-[42vh] flex-col justify-between px-8 py-10 lg:min-h-screen lg:px-14 lg:py-14">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.34em] text-gold">
            Panel administrativo
          </p>
          <h1 className="mt-6 font-display text-6xl tracking-widest text-cream md:text-7xl">
            AURALITH
          </h1>
        </div>
        <div className="max-w-xl">
          <p className="font-display text-4xl leading-tight text-cream md:text-5xl">
            Operaciones holísticas, inventario y pedidos en un solo lugar.
          </p>
          <p className="mt-5 font-body text-sm font-light leading-relaxed text-cream-dark/70">
            Gestiona productos, pedidos y contenido con el mismo cuidado con el
            que Auralith cura cada pieza.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 lg:px-10">
        <motion.form
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md rounded-2xl bg-cream p-6 shadow-lifted md:p-8"
          initial={{ opacity: 0, x: 80 }}
          onSubmit={handleSubmit}
          transition={{ damping: 24, stiffness: 240, type: 'spring' }}
        >
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold-dark">
              Acceso privado
            </p>
            <h2 className="mt-3 font-display text-4xl text-ink">Ingresar</h2>
          </div>

          <motion.div
            animate={error ? { x: [0, -5, 5, -4, 0] } : { x: 0 }}
            className="mt-7 space-y-4"
            transition={{ duration: 0.28 }}
          >
            <label className="block">
              <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Email
              </span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  className={`h-12 w-full rounded-xl border bg-cream-light pl-11 pr-4 font-body text-sm text-ink outline-none transition-colors focus:border-gold ${
                    error ? 'border-red-400' : 'border-cream-dark'
                  }`}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError('')
                  }}
                  type="email"
                  value={email}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Password
              </span>
              <span className="relative block">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  className={`h-12 w-full rounded-xl border bg-cream-light pl-11 pr-12 font-body text-sm text-ink outline-none transition-colors focus:border-gold ${
                    error ? 'border-red-400' : 'border-cream-dark'
                  }`}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-muted transition-colors hover:bg-gold/10 hover:text-ink"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
          </motion.div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-body text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <motion.button
            className="auralith-shimmer relative mt-6 flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-6 font-body text-sm font-semibold text-ink shadow-gold transition-colors hover:bg-gold-light"
            type="submit"
            whileTap={{ scale: 0.97 }}
          >
            <span className="relative z-10">Login</span>
          </motion.button>
        </motion.form>
      </section>
    </main>
  )
}
