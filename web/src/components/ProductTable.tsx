import type { Product } from '../types/product';
import { formatPrice } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface ProductTableProps {
  products: Product[];
}

/** Représentation desktop des produits sous forme de tableau. */
export function ProductTable({ products }: ProductTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              #
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Nom
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Catégorie
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Prix
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id} className="transition hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-400">{product.id}</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {product.name}
              </td>
              <td className="px-4 py-3 text-slate-600">{product.category}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                {formatPrice(product.price)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={product.stock_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
