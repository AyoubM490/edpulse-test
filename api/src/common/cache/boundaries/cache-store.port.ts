/**
 * Boundary de SORTIE (gateway) : abstraction d'un cache clé/valeur générique.
 *
 * Définie côté use case (anneau interne), implémentée dans l'infrastructure
 * (anneau externe) : la dépendance de code pointe vers l'intérieur. On peut
 * brancher un gateway Redis (même contrat) sans toucher au cœur. Générique en
 * <T> pour rester agnostique du type stocké.
 */
export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  /** Vide entièrement le cache (utile en test / invalidation manuelle). */
  clear(): void;
}

export const CACHE_STORE = Symbol('CACHE_STORE');
