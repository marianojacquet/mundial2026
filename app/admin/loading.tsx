export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-slate-700 rounded w-64 animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="w-10 h-10 bg-slate-700 rounded mb-3" />
            <div className="h-8 bg-slate-700 rounded w-16 mb-1" />
            <div className="h-3 bg-slate-800 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
