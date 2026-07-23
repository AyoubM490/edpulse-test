import { QueryProductsDto } from './dto/query-products.dto';

/**
 * Construit une clé de cache déterministe à partir des params de query.
 *
 * Normalisation : valeurs par défaut déjà résolues par le DTO, ordre des clés
 * stable, catégorie en minuscules + trim. Ainsi `?page=1` et
 * `?limit=10&page=1` produisent la MÊME clé et tapent la même entrée.
 */
export function buildProductsCacheKey(query: QueryProductsDto): string {
  const category = query.category?.trim().toLowerCase() ?? '';
  const stockStatus = query.stock_status ?? '';

  return [
    `page=${query.page}`,
    `limit=${query.limit}`,
    `category=${category}`,
    `stock_status=${stockStatus}`,
  ].join('&');
}
