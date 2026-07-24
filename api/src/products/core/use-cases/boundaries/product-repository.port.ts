import { Product, StockStatus } from '../../entities/product';

/**
 * Critères de filtrage et de pagination transmis au repository.
 * La résolution des valeurs par défaut (page/limit) est faite en amont
 * (interface-adapter + DTO) ; le repository reçoit des valeurs normalisées.
 */
export interface FindProductsCriteria {
  page: number;
  limit: number;
  category?: string;
  stockStatus?: StockStatus;
}

/**
 * Résultat paginé renvoyé par le repository : la tranche demandée + le total
 * d'éléments correspondant aux filtres (nécessaire pour calculer totalPages).
 */
export interface PaginatedProducts {
  items: Product[];
  total: number;
}

/**
 * Boundary de SORTIE (gateway) du use case : abstraction de la source de
 * données produits. Définie dans l'anneau use-cases (donc au centre) et
 * IMPLÉMENTÉE dans l'infrastructure (anneau externe) : la dépendance de code
 * pointe vers l'intérieur (règle de dépendance), pas l'inverse.
 * Injectée via le token ci-dessous (une interface TS n'existe pas au runtime).
 */
export interface ProductRepository {
  findManyPaginated(criteria: FindProductsCriteria): PaginatedProducts;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
