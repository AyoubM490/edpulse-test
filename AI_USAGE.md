# AI_USAGE — Utilisation de Claude

## Méthode

J'ai utilisé **Claude Code** (Opus) comme exécutant, en gardant le cadrage et la
vérification de mon côté. Le déroulé réel a été :

1. Rédaction d'un **brief initial dense** posant l'objectif, les contraintes, les
   anti-objectifs et les critères de validation — brief que j'ai travaillé avec Claude
   (interface chat) avant de le donner à Claude Code, précisément pour ne rien laisser
   d'implicite.
2. Exigence d'un **plan validé avant tout code**, avec liste de questions ouvertes.
3. Exécution par **incréments commitables**, chacun vérifié (build, lint, tests, puis
   appels HTTP réels sur l'API démarrée) avant de passer au suivant.
4. Tenue d'un journal des décisions au fil de l'eau : [`docs/ai-journal.md`](./docs/ai-journal.md).

Le point important de cette méthode : l'essentiel de mon travail de décision est passé
**dans le brief**, pas dans la correction a posteriori. Les garde-fous étant posés en
amont, il y a eu peu de dérives à rattraper en cours de route.

---

## 1. Ce que j'ai demandé à Claude

### Tâches déléguées

- **Cadrage** : arborescence, découpage en étapes, identification des ambiguïtés de
  l'énoncé, questions ouvertes à trancher avant de coder.
- **Backend NestJS** : endpoint `GET /products`, DTO de validation, service (use case),
  repository in-memory derrière interface, cache maison TTL + LRU, exception filter
  global, jeu de 72 produits, Swagger, health check.
- **Frontend React** : types de l'API, client `fetch`, store Zustand, hook `useProducts`,
  composants (table desktop / cards mobile, pagination, filtres), états loading / erreur /
  vide, synchronisation de l'état dans l'URL, accessibilité.
- **Tests** : unitaires sur le cache store et le service, e2e supertest sur l'endpoint.
- **Déploiement et documentation** : `render.yaml`, README, ce fichier.

### Contraintes et anti-objectifs imposés dans le brief

Ce que j'ai explicitement **interdit** dès le départ, pour éviter la sur-ingénierie
typique d'un assistant laissé libre : pas de base de données, pas d'authentification,
pas de Redis, pas d'outillage monorepo (deux dossiers `api/` et `web/` suffisent).
Et ce que j'ai **exigé** : TypeScript strict sans aucun `any`, ESLint zéro warning
toléré, et pour chaque décision d'architecture non triviale une justification courte
**plus l'alternative écartée** — critère dicté par le fait que je dois pouvoir défendre
chaque choix à l'oral.

### Problèmes que je cherchais à résoudre

- **Trancher l'ambiguïté de l'énoncé** : la Partie 1 est titrée « Backend SQL » mais les
  contraintes imposent « pas de base de données ». J'ai fait appliquer la contrainte
  (in-memory), avec le repository derrière l'interface `ProductRepository` pour qu'une
  implémentation SQL soit substituable sans toucher le use case. C'est documenté en tête
  de README plutôt que passé sous silence.
- **Rendre le cache vérifiable par le relecteur**, et pas seulement présent dans le code :
  d'où le header `X-Cache: HIT|MISS`.
- **Garantir que la clé de cache soit sémantique et non syntaxique** : `?page=1&limit=10`
  et une requête sans paramètre doivent taper la même entrée. C'est le point où une
  implémentation naïve passe tous les tests fonctionnels tout en ratant l'objectif.
- **Garder la pagination correcte sous filtre** : `total` doit porter sur l'ensemble
  filtré, sinon `totalPages` et `hasNext` deviennent faux dès qu'un filtre est actif.
- **Éviter les incohérences d'affichage** liées aux requêtes concurrentes, et préserver
  l'état au rechargement ou au partage de lien.

---

## 2. Comment j'ai utilisé les suggestions

### Validé après arbitrage

Claude a livré un plan avec cinq questions ouvertes ; j'ai validé ses propositions par
défaut, chacune correspondant à ce que j'aurais choisi :

| Question | Décision retenue |
| --- | --- |
| Filtrage « catégorie **OU** statut » de l'énoncé | Les deux filtres indépendants, combinables en `AND` — surensemble de l'exigence, sans coût |
| Plateforme de déploiement | Render (web service + static site via `render.yaml`) |
| Exécution en production | `nest build` puis `node dist/main` (pas de `ts-node`) |
| Runtime | Node 20 LTS |
| Historique git | Repo à la racine, commits incrémentaux |

### Adopté directement

- L'architecture en couches : controller strictement HTTP → service (use case) →
  repository et cache derrière interfaces, câblage par tokens `Symbol` dans le module.
  Elle répond à la fois aux principes SOLID demandés et à l'ambiguïté SQL.
- La clé de cache normalisée (valeurs par défaut résolues par le DTO, ordre de champs
  fixe, catégorie en minuscules et trimmée), et le test qui vérifie que `Electronics` et
  `electronics` partagent la même entrée.
- La LRU obtenue par l'ordre d'insertion de `Map` (suppression puis réinsertion à la
  lecture pour « rafraîchir » l'entrée) : O(1) sans structure annexe.
- Côté front : `AbortController` pour annuler la requête devenue obsolète, l'état poussé
  dans la query string avec support du retour navigateur, la bascule table/cards en CSS
  au breakpoint `md` plutôt qu'en JS avec un listener `resize`.

### Adapté ou renforcé

- **`noUncheckedIndexedAccess` activé côté front** en plus de `strict`, ce qui force à
  traiter les accès indexés potentiellement `undefined`.
- **`.gitattributes` ajouté en réaction à un symptôme réel** : le premier commit a
  produit une trentaine de warnings « LF will be replaced by CRLF ». Normaliser les fins
  de ligne à LF dans le dépôt était nécessaire pour que le repo soit propre vu depuis un
  autre OS que ma machine Windows.
- **Correction du formatage via le pipeline plutôt qu'à la main** : le premier passage de
  lint a remonté 90 erreurs Prettier sur les fichiers de test. Traitées par
  `eslint --fix`, puis relint pour confirmer. C'est exactement le rôle d'avoir configuré
  la chaîne avant d'écrire le code.
- **Vérification au runtime, pas seulement à la compilation.** Je n'ai pas considéré une
  étape comme terminée parce que `tsc` passait. L'API a été démarrée et interrogée :
  `/health`, métadonnées de pagination (`page=2&limit=5` → `total: 72`, `totalPages: 15`),
  `X-Cache` passant de `MISS` à `HIT` sur deux appels identiques, filtre combiné
  `Electronics` + `in_stock` renvoyant 7 résultats, et format d'erreur `400` sur `page=0`.
- **Lockfiles committés** après avoir noté que le `buildCommand` du `render.yaml` utilise
  `npm ci`, qui échoue sans eux.

---

## 3. Ce que j'ai rejeté, et pourquoi

### Écarté en amont, dans le brief

Ces exclusions sont dans mes consignes initiales, pour que l'assistant ne les propose
même pas :

- **Outillage monorepo** (pnpm workspaces, Nx, Turbo) — deux applications qui ne
  partagent qu'une forme de payload ne justifient pas une couche d'outillage à configurer
  puis à expliquer, d'autant qu'elles sont déployées comme deux services distincts.
- **Redis** — il n'y a aucune écriture dans ce système : les entrées de cache ne peuvent
  qu'expirer. Toute machinerie d'invalidation serait du code mort.
- **Base de données et ORM** — la contrainte de l'énoncé, respectée, sans se fermer la
  porte : l'interface repository laisse le remplacement ouvert.
- **Authentification** — hors périmètre d'un endpoint de lecture publique.

### Écarté après arbitrage explicite

- **`CacheInterceptor` de NestJS** — c'était la première proposition. Rejetée pour deux
  raisons : l'énoncé demande d'**implémenter** un système de cache, et déléguer à un
  module intégré escamote précisément la logique évaluée ; et un interceptor travaille au
  niveau HTTP, où il indexe sur l'URL de la requête. On perd la normalisation de la clé,
  puisque le DTO validé — celui qui porte les valeurs par défaut résolues — n'existe pas
  encore à ce moment-là. Le cache est donc resté dans la couche use case, derrière son
  interface.
- **Bibliothèque `lru-cache`** — même raisonnement : le cache doit être maison et lisible.
  Une `Map` donne l'éviction LRU en O(1) et tient en une classe que je peux expliquer
  ligne par ligne.
- **Context API + reducer** côté front — écarté au profit de Zustand : un Context
  déclenche un re-render de tout le sous-arbre au moindre changement d'état, et demande
  plus de boilerplate pour un bénéfice nul ici.
- **Fly.io** — écarté au profit de Render. Critère : la procédure de déploiement doit
  pouvoir être suivie sans réfléchir par quelqu'un qui découvre le repo. Un blueprint
  déclaratif à deux services répond mieux à ça.
- **Dockerfile** — envisagé, puis abandonné : le build natif de Render suffit pour un
  service Node et un site statique. Ajouter une image à maintenir aurait été de la
  complexité sans contrepartie.
- **`404` quand `page` dépasse `totalPages`** — une page vide dans une collection paginée
  n'est pas une ressource absente. L'API renvoie `200` avec `data: []` et un `meta`
  cohérent, ce qui permet au front d'afficher un état vide plutôt qu'une erreur.

---

## Ce que je retiens

Le levier n'a pas été la vitesse de génération, mais la qualité du cadrage : contraintes
explicites, anti-objectifs nommés, critère de validation posé d'avance (« je dois pouvoir
défendre chaque décision »), et vérification systématique par exécution réelle plutôt que
par lecture du code produit. Les deux ou trois points où j'ai dû reprendre la main —
normalisation de la clé de cache, fins de ligne, formatage — étaient tous détectables
parce que la chaîne de vérification existait avant le code.
