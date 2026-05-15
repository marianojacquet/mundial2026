export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="h-10 bg-slate-700 rounded-lg w-72 mx-auto mb-3 animate-pulse" />
      <div className="h-4 bg-slate-800 rounded w-52 mx-auto mb-10 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="card flex gap-4 items-center animate-pulse">
            <div className="w-8 h-8 bg-slate-700 rounded-full shrink-0" />
            <div className="flex-1 h-4 bg-slate-700 rounded" />
            <div className="w-16 h-4 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
