import type { PaginatedProducts, ProductQuery } from '../types/product';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Erreur applicative portant le status HTTP et un message exploitable en UI. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Sérialise la query en query string, en omettant les filtres vides. */
function toQueryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('limit', String(query.limit));
  if (query.category) {
    params.set('category', query.category);
  }
  if (query.stock_status) {
    params.set('stock_status', query.stock_status);
  }
  return params.toString();
}

/**
 * Récupère une page de produits.
 * @param signal AbortSignal pour annuler une requête devenue obsolète.
 */
export async function fetchProducts(
  query: ProductQuery,
  signal?: AbortSignal,
): Promise<PaginatedProducts> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/products?${toQueryString(query)}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    // AbortError est propagée telle quelle : le hook la distingue et l'ignore.
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(
      'Impossible de joindre le serveur. Vérifiez votre connexion.',
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `La requête a échoué (${response.status}).`,
      response.status,
    );
  }

  return (await response.json()) as PaginatedProducts;
}
