import { Module } from '@nestjs/common';
import { ProductsController } from './interface-adapters/controllers/products.controller';
import { ListProductsUseCase } from './core/use-cases/list-products.use-case';
import { LIST_PRODUCTS } from './core/use-cases/boundaries/list-products.port';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from './core/use-cases/boundaries/product-repository.port';
import { InMemoryProductRepository } from './infrastructure/persistence/in-memory-product.repository';
import {
  CACHE_STORE,
  CacheStore,
} from '../common/cache/boundaries/cache-store.port';
import { InMemoryCacheStore } from '../common/cache/infrastructure/in-memory-cache.store';

/**
 * Composition Root du bounded context « products ». C'est le SEUL endroit
 * autorisé à traverser tous les anneaux : il connaît à la fois les boundaries
 * (interfaces, au centre) et leurs implémentations d'infrastructure (au bord),
 * reliées par des tokens (Symbol). Changer d'implémentation = changer une seule
 * ligne ici ; le cœur ne bouge pas (règle de dépendance + Open/Closed).
 */
@Module({
  controllers: [ProductsController],
  providers: [
    // Input port -> use case. Factory explicite : le use-case étant une classe
    // pure (sans décorateur), c'est ICI — et seulement ici — qu'on résout ses
    // dépendances depuis les tokens et qu'on l'instancie.
    {
      provide: LIST_PRODUCTS,
      useFactory: (repository: ProductRepository, cache: CacheStore) =>
        new ListProductsUseCase(repository, cache),
      inject: [PRODUCT_REPOSITORY, CACHE_STORE],
    },
    // Gateway (persistence) -> implémentation infrastructure.
    { provide: PRODUCT_REPOSITORY, useClass: InMemoryProductRepository },
    // Gateway (cache) -> implémentation infrastructure.
    {
      provide: CACHE_STORE,
      // Factory : lit la config cache depuis l'environnement.
      useFactory: (): InMemoryCacheStore =>
        new InMemoryCacheStore({
          ttlMs: Number(process.env.CACHE_TTL_MS ?? 30000),
          maxEntries: Number(process.env.CACHE_MAX_ENTRIES ?? 100),
        }),
    },
  ],
})
export class ProductsModule {}
