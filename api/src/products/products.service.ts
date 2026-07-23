import { Inject, Injectable } from '@nestjs/common';
import { CACHE_STORE, CacheStore } from '../common/cache/cache-store.interface';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from './domain/product-repository.interface';
import { QueryProductsDto } from './dto/query-products.dto';
import { PaginatedProductsResponse } from './dto/paginated-response.dto';
import { buildProductsCacheKey } from './products.cache-key';

/** Résultat du use case + indicateur de provenance (pour le header X-Cache). */
export interface ProductsQueryResult {
  response: PaginatedProductsResponse;
  cacheHit: boolean;
}

/**
 * Use case « lister les produits ». Orchestre cache → repository → assemblage
 * de la réponse paginée. Ne connaît ni HTTP ni les détails d'implémentation du
 * cache/repository (il dépend de leurs interfaces — DIP).
 */
@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repository: ProductRepository,
    @Inject(CACHE_STORE)
    private readonly cache: CacheStore,
  ) {}

  findAll(query: QueryProductsDto): ProductsQueryResult {
    const cacheKey = buildProductsCacheKey(query);

    const cached = this.cache.get<PaginatedProductsResponse>(cacheKey);
    if (cached !== undefined) {
      return { response: cached, cacheHit: true };
    }

    const { items, total } = this.repository.findManyPaginated({
      page: query.page,
      limit: query.limit,
      category: query.category,
      stockStatus: query.stock_status,
    });

    const response = this.buildResponse(items, total, query);
    this.cache.set(cacheKey, response);

    return { response, cacheHit: false };
  }

  private buildResponse(
    items: PaginatedProductsResponse['data'],
    total: number,
    query: QueryProductsDto,
  ): PaginatedProductsResponse {
    const { page, limit } = query;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1 && total > 0,
      },
    };
  }
}
