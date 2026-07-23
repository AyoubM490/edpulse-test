import type { Product } from '../types/product';
import { ProductCard } from './ProductCard';
import { ProductTable } from './ProductTable';

interface ProductListProps {
  products: Product[];
}

/**
 * Bascule responsive : cards en mobile, tableau en desktop. Le choix se fait en
 * CSS (breakpoint md) pour éviter de dépendre du JS et d'un listener resize.
 */
export function ProductList({ products }: ProductListProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="hidden md:block">
        <ProductTable products={products} />
      </div>
    </>
  );
}
