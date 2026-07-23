/**
 * Types de l'API, centralisés. Doivent rester alignés avec le backend
 * (api/src/products). Source unique de vérité côté front.
 */

export const STOCK_STATUSES = [
  'in_stock',
  'low_stock',
  'out_of_stock',
] as const;

export type StockStatus = (typeof STOCK_STATUSES)[number];

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_status: StockStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedProducts {
  data: Product[];
  meta: PaginationMeta;
}

/** Paramètres de requête pilotant la liste (miroir des query params de l'API). */
export interface ProductQuery {
  page: number;
  limit: number;
  category?: string;
  stock_status?: StockStatus;
}
