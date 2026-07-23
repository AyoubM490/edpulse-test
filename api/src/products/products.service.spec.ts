import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PRODUCT_REPOSITORY } from './domain/product-repository.interface';
import { InMemoryProductRepository } from './repositories/in-memory-product.repository';
import { CACHE_STORE } from '../common/cache/cache-store.interface';
import { InMemoryCacheStore } from '../common/cache/in-memory-cache.store';
import { QueryProductsDto } from './dto/query-products.dto';
import { StockStatus } from './domain/product.entity';
import { PRODUCTS_SEED } from './data/products.seed';

/** Construit un DTO avec les valeurs par défaut résolues (comme le pipe global). */
function query(overrides: Partial<QueryProductsDto> = {}): QueryProductsDto {
  return Object.assign(
    new QueryProductsDto(),
    { page: 1, limit: 10 },
    overrides,
  );
}

describe('ProductsService', () => {
  let service: ProductsService;
  let cache: InMemoryCacheStore;

  beforeEach(async () => {
    cache = new InMemoryCacheStore({ ttlMs: 10_000, maxEntries: 50 });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PRODUCT_REPOSITORY, useClass: InMemoryProductRepository },
        { provide: CACHE_STORE, useValue: cache },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('pagination', () => {
    it('renvoie la 1re page avec les bonnes métadonnées', () => {
      const { response } = service.findAll(query({ page: 1, limit: 10 }));
      expect(response.data).toHaveLength(10);
      expect(response.meta).toEqual({
        page: 1,
        limit: 10,
        total: PRODUCTS_SEED.length,
        totalPages: Math.ceil(PRODUCTS_SEED.length / 10),
        hasNext: true,
        hasPrev: false,
      });
    });

    it('renvoie des éléments distincts entre page 1 et page 2', () => {
      const p1 = service.findAll(query({ page: 1, limit: 10 })).response;
      const p2 = service.findAll(query({ page: 2, limit: 10 })).response;
      const ids1 = p1.data.map((p) => p.id);
      const ids2 = p2.data.map((p) => p.id);
      expect(ids1).not.toEqual(ids2);
      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    });

    it('hasNext=false et hasPrev=true sur la dernière page', () => {
      const last = Math.ceil(PRODUCTS_SEED.length / 10);
      const { response } = service.findAll(query({ page: last, limit: 10 }));
      expect(response.meta.hasNext).toBe(false);
      expect(response.meta.hasPrev).toBe(true);
    });

    it('renvoie une page vide au-delà du total (sans crash)', () => {
      const { response } = service.findAll(query({ page: 999, limit: 10 }));
      expect(response.data).toHaveLength(0);
      expect(response.meta.total).toBe(PRODUCTS_SEED.length);
      expect(response.meta.hasNext).toBe(false);
    });
  });

  describe('filtres', () => {
    it('filtre par catégorie (insensible à la casse)', () => {
      const { response } = service.findAll(
        query({ category: 'electronics', limit: 100 }),
      );
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data.every((p) => p.category === 'Electronics')).toBe(
        true,
      );
      expect(response.meta.total).toBe(response.data.length);
    });

    it('filtre par stock_status', () => {
      const { response } = service.findAll(
        query({ stock_status: StockStatus.OUT_OF_STOCK, limit: 100 }),
      );
      expect(
        response.data.every((p) => p.stock_status === StockStatus.OUT_OF_STOCK),
      ).toBe(true);
    });

    it('combine catégorie ET statut (AND)', () => {
      const { response } = service.findAll(
        query({
          category: 'Electronics',
          stock_status: StockStatus.IN_STOCK,
          limit: 100,
        }),
      );
      expect(
        response.data.every(
          (p) =>
            p.category === 'Electronics' &&
            p.stock_status === StockStatus.IN_STOCK,
        ),
      ).toBe(true);
    });

    it('la pagination reste correcte sous filtre', () => {
      const all = service.findAll(
        query({ category: 'Books', limit: 100 }),
      ).response;
      const paged = service.findAll(
        query({ category: 'Books', page: 1, limit: 5 }),
      ).response;
      expect(paged.meta.total).toBe(all.meta.total);
      expect(paged.data).toHaveLength(Math.min(5, all.meta.total));
      expect(paged.meta.totalPages).toBe(Math.ceil(all.meta.total / 5));
    });

    it('renvoie un résultat vide pour une catégorie inconnue', () => {
      const { response } = service.findAll(query({ category: 'DoesNotExist' }));
      expect(response.data).toHaveLength(0);
      expect(response.meta.total).toBe(0);
      expect(response.meta.totalPages).toBe(0);
    });
  });

  describe('cache HIT / MISS', () => {
    it('MISS au 1er appel, HIT au 2e (mêmes params)', () => {
      const first = service.findAll(query({ page: 1, limit: 10 }));
      const second = service.findAll(query({ page: 1, limit: 10 }));
      expect(first.cacheHit).toBe(false);
      expect(second.cacheHit).toBe(true);
      expect(second.response).toEqual(first.response);
    });

    it('des params différents ne partagent pas le cache', () => {
      service.findAll(query({ page: 1, limit: 10 }));
      const other = service.findAll(query({ page: 2, limit: 10 }));
      expect(other.cacheHit).toBe(false);
    });

    it('la casse de la catégorie est normalisée dans la clé de cache', () => {
      service.findAll(query({ category: 'Electronics' }));
      const hit = service.findAll(query({ category: 'electronics' }));
      expect(hit.cacheHit).toBe(true);
    });
  });
});
