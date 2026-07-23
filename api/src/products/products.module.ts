import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PRODUCT_REPOSITORY } from './domain/product-repository.interface';
import { InMemoryProductRepository } from './repositories/in-memory-product.repository';
import { CACHE_STORE } from '../common/cache/cache-store.interface';
import { InMemoryCacheStore } from '../common/cache/in-memory-cache.store';

/**
 * Câblage DI. Les interfaces sont liées à leurs implémentations via des tokens
 * (Symbol) : changer d'implémentation = changer une seule ligne ici, le reste
 * du module ne bouge pas (Open/Closed + Dependency Inversion).
 */
@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: InMemoryProductRepository,
    },
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
