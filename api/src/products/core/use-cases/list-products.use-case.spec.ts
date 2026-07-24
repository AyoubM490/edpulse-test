import { ListProductsUseCase } from './list-products.use-case';
import { ListProductsQuery } from './boundaries/list-products.port';
import { InMemoryProductRepository } from '../../infrastructure/persistence/in-memory-product.repository';
import { InMemoryCacheStore } from '../../../common/cache/infrastructure/in-memory-cache.store';
import { StockStatus } from '../entities/product';
import { PRODUCTS_SEED } from '../../infrastructure/persistence/products.seed';

/** Construit une requête de domaine avec les valeurs par défaut résolues. */
function query(overrides: Partial<ListProductsQuery> = {}): ListProductsQuery {
  return { page: 1, limit: 10, ...overrides };
}

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let cache: InMemoryCacheStore;

  // Le use-case est une classe pure : on l'instancie par un simple `new`, en
  // injectant les implémentations à la main. Aucun conteneur NestJS requis —
  // c'est la preuve concrète que l'anneau application est framework-free.
  beforeEach(() => {
    cache = new InMemoryCacheStore({ ttlMs: 10_000, maxEntries: 50 });
    useCase = new ListProductsUseCase(new InMemoryProductRepository(), cache);
  });

  describe('pagination', () => {
    it('renvoie la 1re page avec les bonnes métadonnées', () => {
      const { page } = useCase.execute(query({ page: 1, limit: 10 }));
      expect(page.items).toHaveLength(10);
      expect(page).toMatchObject({
        page: 1,
        limit: 10,
        total: PRODUCTS_SEED.length,
        totalPages: Math.ceil(PRODUCTS_SEED.length / 10),
        hasNext: true,
        hasPrev: false,
      });
    });

    it('renvoie des éléments distincts entre page 1 et page 2', () => {
      const p1 = useCase.execute(query({ page: 1, limit: 10 })).page;
      const p2 = useCase.execute(query({ page: 2, limit: 10 })).page;
      const ids1 = p1.items.map((p) => p.id);
      const ids2 = p2.items.map((p) => p.id);
      expect(ids1).not.toEqual(ids2);
      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    });

    it('hasNext=false et hasPrev=true sur la dernière page', () => {
      const last = Math.ceil(PRODUCTS_SEED.length / 10);
      const { page } = useCase.execute(query({ page: last, limit: 10 }));
      expect(page.hasNext).toBe(false);
      expect(page.hasPrev).toBe(true);
    });

    it('renvoie une page vide au-delà du total (sans crash)', () => {
      const { page } = useCase.execute(query({ page: 999, limit: 10 }));
      expect(page.items).toHaveLength(0);
      expect(page.total).toBe(PRODUCTS_SEED.length);
      expect(page.hasNext).toBe(false);
    });
  });

  describe('filtres', () => {
    it('filtre par catégorie (insensible à la casse)', () => {
      const { page } = useCase.execute(
        query({ category: 'electronics', limit: 100 }),
      );
      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items.every((p) => p.category === 'Electronics')).toBe(true);
      expect(page.total).toBe(page.items.length);
    });

    it('filtre par stock_status', () => {
      const { page } = useCase.execute(
        query({ stockStatus: StockStatus.OUT_OF_STOCK, limit: 100 }),
      );
      expect(
        page.items.every((p) => p.stock_status === StockStatus.OUT_OF_STOCK),
      ).toBe(true);
    });

    it('combine catégorie ET statut (AND)', () => {
      const { page } = useCase.execute(
        query({
          category: 'Electronics',
          stockStatus: StockStatus.IN_STOCK,
          limit: 100,
        }),
      );
      expect(
        page.items.every(
          (p) =>
            p.category === 'Electronics' &&
            p.stock_status === StockStatus.IN_STOCK,
        ),
      ).toBe(true);
    });

    it('la pagination reste correcte sous filtre', () => {
      const all = useCase.execute(
        query({ category: 'Books', limit: 100 }),
      ).page;
      const paged = useCase.execute(
        query({ category: 'Books', page: 1, limit: 5 }),
      ).page;
      expect(paged.total).toBe(all.total);
      expect(paged.items).toHaveLength(Math.min(5, all.total));
      expect(paged.totalPages).toBe(Math.ceil(all.total / 5));
    });

    it('renvoie un résultat vide pour une catégorie inconnue', () => {
      const { page } = useCase.execute(query({ category: 'DoesNotExist' }));
      expect(page.items).toHaveLength(0);
      expect(page.total).toBe(0);
      expect(page.totalPages).toBe(0);
    });
  });

  describe('cache HIT / MISS', () => {
    it('MISS au 1er appel, HIT au 2e (mêmes params)', () => {
      const first = useCase.execute(query({ page: 1, limit: 10 }));
      const second = useCase.execute(query({ page: 1, limit: 10 }));
      expect(first.cacheHit).toBe(false);
      expect(second.cacheHit).toBe(true);
      expect(second.page).toEqual(first.page);
    });

    it('des params différents ne partagent pas le cache', () => {
      useCase.execute(query({ page: 1, limit: 10 }));
      const other = useCase.execute(query({ page: 2, limit: 10 }));
      expect(other.cacheHit).toBe(false);
    });

    it('la casse de la catégorie est normalisée dans la clé de cache', () => {
      useCase.execute(query({ category: 'Electronics' }));
      const hit = useCase.execute(query({ category: 'electronics' }));
      expect(hit.cacheHit).toBe(true);
    });
  });
});
