'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl mb-6">🟥</div>
      <h1 className="text-3xl font-bold mb-2">Algo salió mal</h1>
      <p className="text-slate-400 mb-6 max-w-sm">
        Ocurrió un error inesperado. Intentá de nuevo o contactá al administrador.
      </p>
      {error.digest && (
        <p className="text-xs text-slate-600 mb-4 font-mono">Error: {error.digest}</p>
      )}
      <button onClick={reset} className="btn-primary px-6 py-3">
        Reintentar
      </button>
    </div>
  )
}
