# Edpulse — Système de consultation de produits

API REST (NestJS) + interface (React) pour consulter un catalogue de produits
avec **pagination**, **filtrage** et **cache en mémoire**. Données stockées en
mémoire (aucune base de données, conformément à l'énoncé).

> **Note sur l'énoncé** — Le titre de la Partie 1 mentionne « SQL », mais les
> contraintes imposent explicitement « pas de base de données ». J'applique la
> contrainte : stockage **in-memory**. Le repository étant caché derrière
> l'interface `ProductRepository` (injectée par token), une implémentation SQL
> se substituerait **sans toucher une ligne du service** — voir
> [Décisions d'architecture](#décisions-darchitecture).

---

## Stack

| Couche       | Technologies                                                        |
| ------------ | ------------------------------------------------------------------- |
| Backend      | NestJS 10, TypeScript (strict), class-validator, Swagger            |
| Frontend     | React 18, TypeScript (strict), Vite, Tailwind CSS, Zustand          |
| Cache        | Cache maison en mémoire (TTL + éviction LRU)                        |
| Tests        | Jest (unitaires) + Supertest (e2e)                                  |
| Déploiement  | Render (web service + static site) via `render.yaml`                |

---

## Arborescence

```
edpulse-test/
├─ api/                         # Backend NestJS
│  ├─ src/
│  │  ├─ main.ts                # bootstrap : ValidationPipe, CORS, Swagger, filter
│  │  ├─ app.module.ts
│  │  ├─ health.controller.ts   # GET /health (health check PaaS)
│  │  ├─ common/
│  │  │  ├─ cache/              # CacheStore (interface) + impl in-memory TTL/LRU
│  │  │  └─ filters/            # exception filter global (format homogène)
│  │  └─ products/
│  │     ├─ products.controller.ts   # HTTP only, pose X-Cache
│  │     ├─ products.service.ts      # use case : cache -> repo -> {data, meta}
│  │     ├─ products.cache-key.ts    # clé de cache normalisée
│  │     ├─ dto/                      # QueryProductsDto + types de réponse
│  │     ├─ domain/                   # entity, enum, ProductRepository (interface)
│  │     ├─ repositories/             # impl in-memory du repository
│  │     └─ data/products.seed.ts     # ~72 produits
│  └─ test/                     # e2e supertest
│
├─ web/                         # Frontend React + Vite
│  └─ src/
│     ├─ App.tsx
│     ├─ types/product.ts       # types de l'API, centralisés
│     ├─ store/products.store.ts # Zustand (query + actions, sync URL)
│     ├─ hooks/useProducts.ts   # logique data + AbortController
│     ├─ lib/                    # api, url-state, format, constants
│     └─ components/             # ProductList/Table/Card, Pagination, Filters, états
│
├─ render.yaml                  # blueprint de déploiement Render
└─ docs/ai-journal.md           # journal des échanges avec Claude (base de AI_USAGE.md)
```

---

## API

### `GET /products`

| Param          | Type   | Défaut | Contraintes                                    |
| -------------- | ------ | ------ | ---------------------------------------------- |
| `page`         | number | `1`    | entier ≥ 1                                     |
| `limit`        | number | `10`   | entier 1–100                                   |
| `category`     | string | —      | optionnel, insensible à la casse               |
| `stock_status` | enum   | —      | `in_stock` \| `low_stock` \| `out_of_stock`    |

`category` et `stock_status` sont **combinables** (AND). La pagination reste
correcte lorsqu'un filtre est actif (`total` porte sur l'ensemble filtré).

**Réponse** :

```json
{
  "data": [
    { "id": 1, "name": "Casque Bluetooth Aura X", "category": "Electronics", "price": 129.99, "stock_status": "in_stock" }
  ],
  "meta": { "page": 1, "limit": 10, "total": 72, "totalPages": 8, "hasNext": true, "hasPrev": false }
}
```

**Header** `X-Cache: HIT|MISS` — rend le cache démontrable côté reviewer.

**Erreurs** — format homogène, `400` sur paramètre invalide :

```json
{ "statusCode": 400, "error": "Bad Request", "message": ["page doit être >= 1"], "timestamp": "2026-07-23T21:57:41.732Z", "path": "/products?page=0" }
```

Documentation interactive **Swagger** : `GET /docs`.

### Exemples curl

```bash
# Page 2, 5 par page
curl "http://localhost:3000/products?page=2&limit=5"

# Filtre catégorie (insensible à la casse)
curl "http://localhost:3000/products?category=electronics"

# Filtres combinés
curl "http://localhost:3000/products?category=Electronics&stock_status=in_stock"

# Démontrer le cache : 1er appel MISS, 2e HIT
curl -i "http://localhost:3000/products?category=Books" | grep -i x-cache
curl -i "http://localhost:3000/products?category=Books" | grep -i x-cache

# Erreur 400
curl -i "http://localhost:3000/products?page=0"
```

---

## Décisions d'architecture

### Principes SOLID appliqués

- **SRP (responsabilité unique)** — chaque couche a un seul rôle : le
  `ProductsController` ne fait que du HTTP (parse la query, pose `X-Cache`) ; le
  `ProductsService` porte le use case (cache → repository → assemblage) ; le
  repository ne fait que filtrer/trancher les données. Aucune logique métier
  dans le controller.
- **DIP (inversion de dépendance)** — le service dépend des **interfaces**
  `ProductRepository` et `CacheStore`, jamais des implémentations concrètes. Le
  câblage se fait par token (`Symbol`) dans `products.module.ts`. C'est la
  réponse directe à l'ambiguïté « SQL » : remplacer `InMemoryProductRepository`
  par une impl SQL ne touche ni le service ni le controller.
- **OCP (ouvert/fermé)** — changer de source de données ou de cache (Redis)
  = ajouter une classe + changer une ligne de binding, sans modifier le use case.
- **ISP / LSP** — interfaces minimales (`findManyPaginated`, `get/set/clear`) ;
  toute implémentation respectant le contrat est substituable.

### Autres choix (et alternatives écartées)

- **Cache maison plutôt que `CacheInterceptor` de Nest** — contrôle total sur la
  clé **normalisée** (défauts résolus, ordre stable, casse) et sur le header
  `X-Cache` démontrable. *Écarté* : l'interceptor masque ces deux aspects.
- **`Map` pour la LRU** — l'ordre d'insertion préservé donne une éviction O(1)
  (delete+set pour « rafraîchir »). *Écarté* : `lru-cache` (l'énoncé veut un
  cache maison).
- **Zustand côté front** — moins de boilerplate qu'un Context+reducer et pas de
  re-render global. *Écarté* : Context (re-render de tout l'arbre au moindre
  changement d'état).
- **Responsive en CSS (breakpoint `md`)** — bascule table/cards sans JS ni
  listener `resize`.
- **État dans l'URL** — rechargement et partage de lien conservent filtres +
  page (`history.replaceState` + `popstate`).

---

## Lancer en local

Pré-requis : **Node 20+**.

### Backend

```bash
cd api
npm install
cp .env.example .env      # ajustez si besoin
npm run start:dev         # http://localhost:3000  (Swagger: /docs)
```

### Frontend

```bash
cd web
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000
npm run dev               # http://localhost:5173
```

---

## Tests

```bash
cd api
npm test          # unitaires (service + cache) — 18 tests
npm run test:e2e  # e2e supertest sur l'endpoint — 7 tests
npm run lint      # ESLint (zéro warning toléré)
```

Couverture : pagination (1re/dernière page, hors bornes), filtres (catégorie,
statut, combinés, casse, inconnu), cache HIT/MISS + normalisation de clé,
éviction LRU + expiration TTL, et validation HTTP (400 sur `page<1`,
`limit>100`, enum inconnu, param non autorisé).

---

## Déploiement (Render)

Le fichier [`render.yaml`](./render.yaml) décrit les deux services. Procédure
pas-à-pas :

1. **Pousser le repo** sur GitHub (ou GitLab).
2. Sur [dashboard.render.com](https://dashboard.render.com) → **New** →
   **Blueprint** → sélectionner le repo. Render lit `render.yaml` et propose de
   créer `edpulse-api` (web service) et `edpulse-web` (static site).
3. Render demande les **deux variables** marquées `sync: false`. Au 1er passage,
   laissez des valeurs temporaires (elles seront corrigées à l'étape 5) ou
   procédez ainsi :
   - Créez d'abord les services (Apply).
   - Notez les URLs générées, par ex. `https://edpulse-api.onrender.com` et
     `https://edpulse-web.onrender.com`.
4. **Variables d'environnement à définir** :

   | Service      | Variable       | Valeur                                   |
   | ------------ | -------------- | ---------------------------------------- |
   | `edpulse-api`| `CORS_ORIGIN`  | URL du front, ex. `https://edpulse-web.onrender.com` |
   | `edpulse-web`| `VITE_API_URL` | URL de l'API, ex. `https://edpulse-api.onrender.com` |

   (Les autres — `NODE_VERSION`, `CACHE_TTL_MS`, `CACHE_MAX_ENTRIES` — sont déjà
   fixées dans `render.yaml`. Render fournit `PORT` automatiquement.)
5. Renseignez ces deux valeurs dans le dashboard puis **redeployez** les deux
   services (le static site doit être rebuild pour injecter `VITE_API_URL`).
6. Ouvrez l'URL du front : la liste doit se charger depuis l'API.

> Plan gratuit Render : le web service s'endort après inactivité, le premier
> appel peut prendre ~30 s (cold start). Sans incidence sur la correction.

---

## URLs de démo

| Service | URL |
| ------- | --- |
| Front   | _à compléter après déploiement_ |
| API     | _à compléter après déploiement_ |
| Swagger | _`<API>/docs`_ |
