import type { StockStatus } from '../types/product';
import { STOCK_STATUS_LABELS } from '../lib/constants';

const STYLES: Record<StockStatus, string> = {
  in_stock: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  low_stock: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  out_of_stock: 'bg-rose-100 text-rose-800 ring-rose-600/20',
};

interface StatusBadgeProps {
  status: StockStatus;
}

/** Pastille colorée indiquant le statut de stock. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {STOCK_STATUS_LABELS[status]}
    </span>
  );
}
