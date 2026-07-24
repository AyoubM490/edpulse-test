import { InMemoryCacheStore } from './in-memory-cache.store';

describe('InMemoryCacheStore', () => {
  it('retourne undefined sur une clé absente (MISS)', () => {
    const cache = new InMemoryCacheStore({ ttlMs: 1000, maxEntries: 10 });
    expect(cache.get('x')).toBeUndefined();
  });

  it('retourne la valeur stockée (HIT)', () => {
    const cache = new InMemoryCacheStore({ ttlMs: 1000, maxEntries: 10 });
    cache.set('x', { a: 1 });
    expect(cache.get('x')).toEqual({ a: 1 });
  });

  it('expire une entrée après le TTL', () => {
    let now = 1_000;
    const cache = new InMemoryCacheStore({ ttlMs: 100, maxEntries: 10 });
    jest
      .spyOn(cache as unknown as { nowMs: () => number }, 'nowMs')
      .mockImplementation(() => now);

    cache.set('x', 'v');
    now = 1_050;
    expect(cache.get('x')).toBe('v'); // pas encore expiré
    now = 1_100;
    expect(cache.get('x')).toBeUndefined(); // expiré
  });

  it('évince la plus ancienne entrée au-delà de maxEntries (LRU)', () => {
    const cache = new InMemoryCacheStore({ ttlMs: 10_000, maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // 'a' doit être évincée

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('un get récent protège une entrée de l’éviction (LRU)', () => {
    const cache = new InMemoryCacheStore({ ttlMs: 10_000, maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // 'a' redevient récente
    cache.set('c', 3); // 'b' (la plus ancienne) doit être évincée

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('clear() vide le cache', () => {
    const cache = new InMemoryCacheStore({ ttlMs: 1000, maxEntries: 10 });
    cache.set('x', 1);
    cache.clear();
    expect(cache.get('x')).toBeUndefined();
  });
});
