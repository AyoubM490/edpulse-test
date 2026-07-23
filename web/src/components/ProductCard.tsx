import type { Product } from '../types/product';
import { formatPrice } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface ProductCardProps {
  product: Product;
}

/** Représentation mobile d'un produit (une carte par produit). */
export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-slate-900">{product.name}</h3>
        <span className="whitespace-nowrap font-semibold text-slate-900">
          {formatPrice(product.price)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-slate-500">{product.category}</span>
        <StatusBadge status={product.stock_status} />
      </div>
    </article>
  );
}
