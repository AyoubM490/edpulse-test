import { Product, StockStatus } from '../../entities/product';

/**
 * Request Model du use case, exprimé en termes de DOMAINE (pas de HTTP).
 * L'interface-adapter (controller) traduit son DTO en cet objet ; le use case
 * ne connaît donc ni la query string, ni les décorateurs de validation.
 */
export interface ListProductsQuery {
  page: number;
  limit: number;
  category?: string;
  stockStatus?: StockStatus;
}

/**
 * Response Model : page de produits + métadonnées, en types de domaine purs.
 * L'interface-adapter la mappe ensuite vers l'enveloppe `{ data, meta }`.
 */
export interface ProductsPage {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Sortie du use case : la page + l'origine (cache) pour le header X-Cache. */
export interface ListProductsResult {
  page: ProductsPage;
  cacheHit: boolean;
}

/**
 * Boundary d'ENTRÉE (input port) du use case : le contrat que l'interface-
 * adapter invoque. Dépendance NATURELLE (le controller externe → le use case
 * interne) : aucune inversion ici, contrairement à un output port/Presenter.
 * Le use case RETOURNE son résultat — en HTTP synchrone (NestJS), un Presenter
 * séparé serait redondant, le framework porte déjà la sortie vers l'extérieur.
 */
export interface ListProductsPort {
  execute(query: ListProductsQuery): ListProductsResult;
}

export const LIST_PRODUCTS = Symbol('LIST_PRODUCTS');
