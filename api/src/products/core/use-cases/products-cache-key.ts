import { ListProductsQuery } from './boundaries/list-products.port';

/**
 * Construit une clé de cache déterministe à partir de la requête (domaine).
 *
 * Normalisation : valeurs par défaut déjà résolues en amont, ordre des clés
 * stable, catégorie en minuscules + trim. Ainsi `?page=1` et
 * `?limit=10&page=1` produisent la MÊME clé et tapent la même entrée.
 */
export function buildProductsCacheKey(query: ListProductsQuery): string {
  const category = query.category?.trim().toLowerCase() ?? '';
  const stockStatus = query.stockStatus ?? '';

  return [
    `page=${query.page}`,
    `limit=${query.limit}`,
    `category=${category}`,
    `stock_status=${stockStatus}`,
  ].join('&');
}
