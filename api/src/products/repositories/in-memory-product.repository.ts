import { Injectable } from '@nestjs/common';
import { Product } from '../domain/product.entity';
import {
  FindProductsCriteria,
  PaginatedProducts,
  ProductRepository,
} from '../domain/product-repository.interface';
import { PRODUCTS_SEED } from '../data/products.seed';

/**
 * Implémentation in-memory de {@link ProductRepository}.
 *
 * Responsabilité unique (SRP) : filtrer + trancher le tableau en mémoire.
 * Aucune connaissance du cache, du HTTP ou de la validation — ces
 * préoccupations vivent ailleurs. Remplacer cette classe par une impl SQL
 * (même interface) suffit à changer la source de données.
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
