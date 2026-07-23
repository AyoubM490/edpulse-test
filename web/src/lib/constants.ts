import type { StockStatus } from '../types/product';

/**
 * Catégories proposées dans le filtre. Alignées sur le seed backend.
 * (L'API ne fournit pas d'endpoint de métadonnées — hors périmètre de l'énoncé
 * qui n'autorise qu'un seul GET /products —, on liste donc les catégories ici.)
 */
export const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food',
  'Home',
  'Sports',
  'Books',
] as const;

/** Libellés lisibles pour chaque statut de stock. */
export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: 'En stock',
  low_stock: 'Stock faible',
  out_of_stock: 'Rupture',
};
