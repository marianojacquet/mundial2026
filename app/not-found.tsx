import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-6">⚽</div>
      <h1 className="text-6xl font-extrabold text-sky-400 mb-2">404</h1>
      <h2 className="text-2xl font-bold mb-3">Página no encontrada</h2>
      <p className="text-slate-400 mb-8 max-w-sm">
        Esta jugada no existe. El árbitro marcó fuera de la cancha.
      </p>
      <Link href="/" className="btn-primary px-6 py-3">
        Volver al inicio
      </Link>
    </div>
  )
}
