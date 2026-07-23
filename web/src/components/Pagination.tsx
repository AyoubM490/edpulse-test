import type { PaginationMeta } from '../types/product';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

/** Contrôles Précédent / Suivant + indicateur « page X / Y ». */
export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, hasPrev, hasNext } = meta;

  return (
    <nav
      className="flex items-center justify-between gap-4"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Précédent
      </button>

      <span className="text-sm text-slate-600" aria-live="polite">
        Page <span className="font-semibold text-slate-900">{page}</span> /{' '}
        {Math.max(totalPages, 1)}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Suivant →
      </button>
    </nav>
  );
}
