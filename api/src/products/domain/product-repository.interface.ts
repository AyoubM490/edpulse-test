import { Product, StockStatus } from './product.entity';

/**
 * Critères de filtrage et de pagination transmis au repository.
 * La résolution des valeurs par défaut (page/limit) est faite en amont (DTO),
 * le repository reçoit des valeurs déjà normalisées.
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
 * Abstraction de la source de données produits.
 *
 * SOLID / DIP : le service (use case) dépend de cette interface, jamais d'une
 * implémentation concrète. Substituer l'impl in-memory par une impl SQL/ORM
 * ne change pas une ligne du service. Injectée via le token ci-dessous
 * (une interface TS n'existe pas au runtime, donc pas utilisable comme token DI).
 */
export interface ProductRepository {
  findManyPaginated(criteria: FindProductsCriteria): PaginatedProducts;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
