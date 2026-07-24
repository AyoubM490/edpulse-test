import { CacheStore } from '../../../common/cache/boundaries/cache-store.port';
import { ProductRepository } from './boundaries/product-repository.port';
import {
  ListProductsPort,
  ListProductsQuery,
  ListProductsResult,
  ProductsPage,
} from './boundaries/list-products.port';
import { Product } from '../entities/product';
import { buildProductsCacheKey } from './products-cache-key';

/**
 * Anneau USE CASES (Application Business Rules). Orchestre le scénario
 * « lister les produits » : cache → repository → assemblage de la page.
 *
 * Ne connaît NI HTTP (aucun DTO ici) NI les détails d'implémentation du
 * cache/repository : il ne dépend que de leurs boundaries (règle de dépendance
 * respectée). Implémente l'input port {@link ListProductsPort} et RETOURNE son
 * résultat (pas de Presenter : superflu en HTTP synchrone).
 *
 * ZÉRO dépendance framework : ni décorateur ni import NestJS. Classe pure,
 * instanciable par un simple `new` (cf. son test unitaire) — le câblage DI est
 * assuré par le Composition Root via une factory. C'est l'anneau application au
 * sens strict de la Clean Architecture.
 */
export class ListProductsUseCase implements ListProductsPort {
  constructor(
    private readonly repository: ProductRepository,
    private readonly cache: CacheStore,
  ) {}

  execute(query: ListProductsQuery): ListProductsResult {
    const cacheKey = buildProductsCacheKey(query);

    const cached = this.cache.get<ProductsPage>(cacheKey);
    if (cached !== undefined) {
      return { page: cached, cacheHit: true };
    }

    const { items, total } = this.repository.findManyPaginated({
      page: query.page,
      limit: query.limit,
      category: query.category,
      stockStatus: query.stockStatus,
    });

    const page = this.toPage(items, total, query);
    this.cache.set(cacheKey, page);

    return { page, cacheHit: false };
  }

  private toPage(
    items: Product[],
    total: number,
    query: ListProductsQuery,
  ): ProductsPage {
    const { page, limit } = query;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1 && total > 0,
    };
  }
}
