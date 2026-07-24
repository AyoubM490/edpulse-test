import { Injectable } from '@nestjs/common';
import { CacheStore } from '../boundaries/cache-store.port';

interface CacheEntry<T> {
  value: T;
  /** Timestamp (ms) d'expiration absolue. */
  expiresAt: number;
}

export interface InMemoryCacheOptions {
  /** Durée de vie d'une entrée, en millisecondes. */
  ttlMs: number;
  /** Nombre max d'entrées ; au-delà, éviction de la plus ancienne (LRU). */
  maxEntries: number;
}

/**
 * Anneau FRAMEWORKS & DRIVERS (infrastructure) : implémentation in-memory du
 * gateway {@link CacheStore}. Cache avec TTL + éviction LRU bornée.
 *
 * Choix Map : elle conserve l'ordre d'insertion, ce qui donne une LRU en O(1)
 * — on ré-insère une clé lue pour la marquer « récente », et on évince la
 * première clé (la plus ancienne) quand la taille max est dépassée.
 *
 * Alternative écartée : lib externe (lru-cache). Overkill ici, et l'énoncé
 * demande un cache « maison » démontrable.
 */
@Injectable()
export class InMemoryCacheStore implements CacheStore {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly options: InMemoryCacheOptions) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (entry === undefined) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }

    // Marque l'entrée comme récemment utilisée : delete + set la repositionne
    // en fin d'ordre d'insertion.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    // Si la clé existe déjà, on la supprime d'abord pour la repositionner.
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    this.store.set(key, {
      value,
      expiresAt: this.nowMs() + this.options.ttlMs,
    });

    this.evictIfNeeded();
  }

  clear(): void {
    this.store.clear();
  }

  private evictIfNeeded(): void {
    while (this.store.size > this.options.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.store.delete(oldestKey);
    }
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return this.nowMs() >= entry.expiresAt;
  }

  /** Isolé pour être mockable en test. */
  private nowMs(): number {
    return Date.now();
  }
}
