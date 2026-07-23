import { CATEGORIES, STOCK_STATUS_LABELS } from '../lib/constants';
import { STOCK_STATUSES, type StockStatus } from '../types/product';
import { useProductsStore } from '../store/products.store';

/** Barre de filtres : catégorie + statut de stock + réinitialisation. */
export function Filters() {
  const query = useProductsStore((s) => s.query);
  const setCategory = useProductsStore((s) => s.setCategory);
  const setStockStatus = useProductsStore((s) => s.setStockStatus);
  const reset = useProductsStore((s) => s.reset);

  const hasActiveFilter =
    query.category !== undefined || query.stock_status !== undefined;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-category"
          className="text-xs font-medium text-slate-600"
        >
          Catégorie
        </label>
        <select
          id="filter-category"
          value={query.category ?? ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
          className="min-w-44 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Toutes</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-status"
          className="text-xs font-medium text-slate-600"
        >
          Statut de stock
        </label>
        <select
          id="filter-status"
          value={query.stock_status ?? ''}
          onChange={(e) =>
            setStockStatus((e.target.value || undefined) as StockStatus | undefined)
          }
          className="min-w-44 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Tous</option>
          {STOCK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STOCK_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={reset}
        disabled={!hasActiveFilter}
        className="h-[38px] rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Réinitialiser
      </button>
    </div>
  );
}
