import { Injectable } from '@nestjs/common';
import { Product } from '../../core/entities/product';
import {
  FindProductsCriteria,
  PaginatedProducts,
  ProductRepository,
} from '../../core/use-cases/boundaries/product-repository.port';
import { PRODUCTS_SEED } from './products.seed';

/**
 * Anneau FRAMEWORKS & DRIVERS (infrastructure) : implémentation concrète du
 * gateway {@link ProductRepository}. Détail remplaçable — brancher une impl SQL
 * (même boundary) ne change pas une ligne du use case.
 *
 * Responsabilité unique (SRP) : filtrer + trancher le tableau en mémoire.
 * Aucune connaissance du cache, du HTTP ou de la validation.
 */
@Injectable()
export class InMemoryProductRepository implements ProductRepository {
  private readonly products: readonly Product[] = PRODUCTS_SEED;

  findManyPaginated(criteria: FindProductsCriteria): PaginatedProducts {
    const { page, limit, category, stockStatus } = criteria;

    const filtered = this.products.filter((product) => {
      const matchesCategory =
        category === undefined ||
        product.category.toLowerCase() === category.toLowerCase();
      const matchesStock =
        stockStatus === undefined || product.stock_status === stockStatus;
      return matchesCategory && matchesStock;
    });

    // Le total porte sur l'ensemble filtré : la pagination reste correcte
    // même quand un filtre est actif.
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { items, total };
  }
}
