# Journal IA — Edpulse test technique

Journal factuel des échanges avec Claude Code. Sert de base **unique** à `AI_USAGE.md`.

---

## Session 1 — cadrage & scaffold

**Demandé** : livrer le test technique Edpulse (API NestJS in-memory + front React, déploiement PaaS, README + AI_USAGE). Règles imposées : plan validé avant code, incréments commitables, pas de sur-ingénierie (pas de DB/auth/Redis/monorepo), TS strict zéro `any`, ESLint+Prettier, justif d'archi défendable en entretien.

**Proposé (Claude)** : arborescence `api/` + `web/`, ordre en 8 étapes, 4 décisions d'archi (repository derrière interface + token DI, CacheStore interface, Zustand, clé de cache normalisée), 5 questions ouvertes.

**Validé (user)** : « go » — prise des valeurs par défaut :
- Filtrage : supporter category ET stock_status simultanément (AND si les deux fournis), le « OU » de l'énoncé = « au moins l'un dispo ».
- Déploiement : Render (web service API + static site front, `render.yaml`).
- Prod API : `nest build` → `node dist/main` (pas ts-node).
- Node 20 LTS.
- `git init` à la racine, commits incrémentaux.

**Refusé / écarté** : Fly.io (plus de friction que Render), CacheInterceptor Nest (moins de contrôle sur clé normalisée + header X-Cache), Context+reducer (re-renders globaux).

**Ambiguïté traitée** : titre « Backend SQL » vs contrainte « pas de DB » → in-memory appliqué, repository derrière interface pour qu'une impl SQL se substitue sans toucher le use case. À mentionner dans README.

---

## Session 2 — implémentation backend

**Demandé** : implémenter le backend selon la spec (endpoint unique, cache, DTO, filtre, tests).

**Proposé/produit (Claude)** :
- Domaine : `enum StockStatus`, `interface Product`, `interface ProductRepository` + token `Symbol` (une interface TS n'existe pas au runtime → pas utilisable comme token DI).
- `InMemoryCacheStore` : `Map` pour LRU O(1) (ordre d'insertion préservé, delete+set repositionne), TTL absolu, éviction bornée. `nowMs()` isolé pour être mockable en test.
- Clé de cache normalisée (`buildProductsCacheKey`) : défauts résolus + category en lowercase/trim → `?page=1` et `?limit=10&page=1` tapent la même entrée.
- Service = use case pur (cache → repo → assemblage `{data, meta}`), renvoie `cacheHit` pour que le controller pose `X-Cache`. Controller = HTTP only.
- Filtres : category ET stock_status combinables (AND), category insensible à la casse.
- Exception filter global `@Catch()` : uniformise HttpException + erreurs inattendues (500 sans fuite de stack).
- Tests : 18 unitaires (cache LRU/TTL, service pagination/filtres/bornes/HIT-MISS) + 7 e2e supertest (200, X-Cache MISS→HIT, filtre, 400 sur page<1 / limit>100 / enum inconnu / param non whitelisté). Tous verts.

**Validé** : ensemble adopté tel quel.

**Refusé / écarté** : lib `lru-cache` (l'énoncé veut un cache maison démontrable) ; `CacheInterceptor` Nest (déjà écarté en session 1).

---

## Session 3 — implémentation frontend

**Produit (Claude)** :
- Vite + React 18 + TS strict (`noUncheckedIndexedAccess` activé), Tailwind v3, Zustand v5.
- Types API centralisés dans `types/product.ts` (miroir manuel du backend, pas de génération OpenAPI — hors périmètre/temps).
- `lib/api.ts` : fetch + `AbortSignal`, `ApiError` typée, distinction `AbortError` (ignorée) vs erreur réseau/HTTP.
- `lib/url-state.ts` : parsing/sérialisation query string, valeurs par défaut omises de l'URL, validation du `stock_status` via garde de type.
- Store Zustand : `query` + actions ; `setCategory`/`setStockStatus` remettent `page=1` ; `pushToUrl` via `history.replaceState` ; `syncFromUrl` pour back/forward.
- `useProducts` : effet de fetch sur `[query, reloadToken]`, `AbortController` pour annuler les requêtes obsolètes, `retry()` via token, listener `popstate`.
- Bascule table/cards en CSS (breakpoint `md`) plutôt qu'en JS (pas de listener resize).
- Catégories du filtre listées en dur (`constants.ts`) faute d'endpoint métadonnées (un seul GET autorisé).
- a11y : labels sur selects, focus-visible global, `aria-live` sur compteur + zone résultats, `aria-busy`.

**Décisions notables** : catégories en dur (justifiées par la contrainte « un seul endpoint ») ; responsive CSS-only.

---

## Session 4 — déploiement + docs

**Produit (Claude)** : `render.yaml` (web service Node pour l'API + static site pour le front), `CORS_ORIGIN` et `VITE_API_URL` en `sync: false` (référence croisée impossible à résoudre en YAML → saisie dashboard au 1er déploiement), health check `/health`, rewrite SPA. README + AI_USAGE (ce dernier basé uniquement sur ce journal).

**Écarté** : Dockerfile (build natif Render suffit, l'énoncé dit « et/ou » — inutile d'ajouter de la complexité).
