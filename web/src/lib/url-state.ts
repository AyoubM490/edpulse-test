import {
  STOCK_STATUSES,
  type ProductQuery,
  type StockStatus,
} from '../types/product';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

function isStockStatus(value: string): value is StockStatus {
  return (STOCK_STATUSES as readonly string[]).includes(value);
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Lit l'état de la liste depuis la query string de l'URL courante. */
export function queryFromSearchParams(search: string): ProductQuery {
  const params = new URLSearchParams(search);

  const category = params.get('category')?.trim() || undefined;
  const rawStatus = params.get('stock_status');
  const stock_status =
    rawStatus && isStockStatus(rawStatus) ? rawStatus : undefined;

  return {
    page: parsePositiveInt(params.get('page'), DEFAULT_PAGE),
    limit: parsePositiveInt(params.get('limit'), DEFAULT_LIMIT),
    category,
    stock_status,
  };
}

/** Sérialise l'état en query string, en omettant les valeurs par défaut/vides. */
export function searchParamsFromQuery(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.page !== DEFAULT_PAGE) {
    params.set('page', String(query.page));
  }
  if (query.limit !== DEFAULT_LIMIT) {
    params.set('limit', String(query.limit));
  }
  if (query.category) {
    params.set('category', query.category);
  }
  if (query.stock_status) {
    params.set('stock_status', query.stock_status);
  }
  return params.toString();
}
