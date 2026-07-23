interface ProductsSkeletonProps {
  rows?: number;
}

/**
 * Skeleton de chargement (et non un spinner nu) : préserve la mise en page et
 * réduit le ressenti d'attente. Décoratif → masqué aux lecteurs d'écran.
 */
export function ProductsSkeleton({ rows = 10 }: ProductsSkeletonProps) {
  return (
    <div aria-hidden="true" className="animate-pulse">
      {/* Desktop : lignes de tableau */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-0"
          >
            <div className="h-4 w-8 rounded bg-slate-200" />
            <div className="h-4 flex-1 rounded bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-4 w-16 rounded bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Mobile : cards */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: Math.min(rows, 6) }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="mb-3 h-4 w-3/4 rounded bg-slate-200" />
            <div className="mb-2 h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-6 w-24 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
