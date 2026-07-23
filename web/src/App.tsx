import { useProducts } from './hooks/useProducts';
import { useProductsStore } from './store/products.store';
import { Filters } from './components/Filters';
import { Pagination } from './components/Pagination';
import { ProductList } from './components/ProductList';
import { ProductsSkeleton } from './components/ProductsSkeleton';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';

export default function App() {
  const { data, isLoading, error, retry } = useProducts();
  const setPage = useProductsStore((s) => s.setPage);
  const reset = useProductsStore((s) => s.reset);

  const total = data?.meta.total ?? 0;
  const isEmpty = !isLoading && !error && data !== null && data.data.length === 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Catalogue produits
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consultez, filtrez et paginez le catalogue.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <section aria-label="Filtres" className="mb-4">
          <Filters />
        </section>

        {/* Compteur de résultats — annoncé aux lecteurs d'écran. */}
        <p className="mb-4 text-sm text-slate-500" aria-live="polite">
          {isLoading
            ? 'Chargement des produits…'
            : error
              ? 'Erreur de chargement.'
              : `${total} produit${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`}
        </p>

        {/* Zone de résultats : aria-live pour annoncer les mises à jour. */}
        <section aria-label="Résultats" aria-busy={isLoading}>
          {isLoading ? (
            <ProductsSkeleton rows={data?.meta.limit ?? 10} />
          ) : error ? (
            <ErrorState message={error} onRetry={retry} />
          ) : isEmpty ? (
            <EmptyState onReset={reset} />
          ) : data ? (
            <ProductList products={data.data} />
          ) : null}
        </section>

        {!isLoading && !error && data && data.data.length > 0 && (
          <div className="mt-6">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        )}
      </main>
    </div>
  );
}
