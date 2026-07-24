# AI_USAGE — Utilisation de Claude

## Méthode

J'ai utilisé **Claude Code** (Opus) comme exécutant, en gardant le cadrage, l'arbitrage et
la vérification de mon côté. Le travail s'est fait en trois temps :

1. **Construction** — brief initial dense (objectif, contraintes, anti-objectifs, critères
   de validation), plan validé avant tout code, puis exécution par incréments vérifiés.
2. **Revue d'architecture** — audit de ce que le code faisait réellement par rapport à ce
   que la documentation en disait, puis explicitation des ports & adapters et
   réorganisation en anneaux.
3. **Durcissement et cadrage du périmètre** — élimination du dernier couplage framework
   dans le cœur, regroupement du cœur sous `core/`, puis arrêt volontaire avant les
   patterns multi-produits.

Ce document consolide les échanges : le détail du parcours d'architecture (audits,
contradictions, décisions et alternatives écartées) est en section 3.

Le point important : l'essentiel de mon travail de décision est passé dans le **cadrage**,
la **contradiction** et la **délimitation du périmètre**, pas dans l'écriture de code.

---

## 1. Ce que j'ai demandé à Claude

### Tâches déléguées

- **Cadrage** : arborescence, découpage en étapes, identification des ambiguïtés de
  l'énoncé, questions ouvertes à trancher avant de coder.
- **Backend NestJS** : endpoint `GET /products`, DTO de validation, use case, repository
  in-memory derrière une abstraction, cache maison TTL + LRU, exception filter global,
  jeu de 72 produits, Swagger, health check.
- **Frontend React** : types de l'API, client `fetch`, store Zustand, hook `useProducts`,
  composants (table desktop / cards mobile, pagination, filtres), états loading / erreur /
  vide, synchronisation de l'état dans l'URL, accessibilité.
- **Tests** : unitaires sur le cache store et le use case, e2e supertest sur l'endpoint.
- **Audits et refactors d'architecture** (détaillés en section 3).
- **Déploiement et documentation** : `render.yaml`, README, ce fichier.

### Contraintes et anti-objectifs imposés dans le brief

Ce que j'ai explicitement **interdit** dès le départ, pour éviter la sur-ingénierie
typique d'un assistant laissé libre : pas de base de données, pas d'authentification, pas
de Redis, pas d'outillage monorepo (deux dossiers `api/` et `web/` suffisent). Et ce que
j'ai **exigé** : TypeScript strict sans aucun `any`, ESLint zéro warning toléré, et pour
chaque décision d'architecture non triviale une justification courte **plus l'alternative
écartée** — critère dicté par le fait que je dois pouvoir défendre chaque choix à l'oral.

### Problèmes que je cherchais à résoudre

- **Trancher l'ambiguïté de l'énoncé** : la Partie 1 est titrée « Backend SQL » mais les
  contraintes imposent « pas de base de données ». J'ai fait appliquer la contrainte
  (in-memory), avec la persistance derrière une abstraction pour qu'une implémentation SQL
  soit substituable sans toucher le cœur. C'est documenté en tête de README plutôt que
  passé sous silence.
- **Rendre le cache vérifiable par le relecteur**, et pas seulement présent dans le code :
  d'où le header `X-Cache: HIT|MISS`.
- **Garantir que la clé de cache soit sémantique et non syntaxique** : `?page=1&limit=10`
  et une requête sans paramètre doivent taper la même entrée. C'est le point où une
  implémentation naïve passe tous les tests fonctionnels tout en ratant l'objectif.
- **Garder la pagination correcte sous filtre** : `total` doit porter sur l'ensemble
  filtré, sinon `totalPages` et `hasNext` deviennent faux dès qu'un filtre est actif.
- **Vérifier que le vocabulaire d'architecture employé était mérité**, plutôt que de
  revendiquer un label sur la foi d'une arborescence.

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

- La séparation en couches avec inversion de dépendance : le cœur ne dépend que
  d'abstractions, câblées par tokens `Symbol` dans le composition root.
- La clé de cache normalisée (valeurs par défaut résolues en amont, ordre de champs fixe,
  catégorie en minuscules et trimmée), et le test qui vérifie que `Electronics` et
  `electronics` partagent la même entrée.
- La LRU obtenue par l'ordre d'insertion de `Map` (suppression puis réinsertion à la
  lecture pour « rafraîchir » l'entrée) : O(1) sans structure annexe.
- Côté front : `AbortController` pour annuler la requête devenue obsolète, l'état poussé
  dans la query string avec support du retour navigateur, la bascule table/cards en CSS au
  breakpoint `md` plutôt qu'en JS avec un listener `resize`.

### Adapté ou renforcé

- **`noUncheckedIndexedAccess` activé côté front** en plus de `strict`, ce qui force à
  traiter les accès indexés potentiellement `undefined`.
- **`.gitattributes` ajouté en réaction à un symptôme réel** : le premier commit a produit
  une trentaine de warnings « LF will be replaced by CRLF ». Normaliser les fins de ligne à
  LF dans le dépôt était nécessaire pour que le repo soit propre vu depuis un autre OS que
  ma machine Windows.
- **Correction du formatage via le pipeline plutôt qu'à la main** : les passages de lint ont
  remonté des erreurs Prettier (90 au premier, 2 après refactor). Traitées par
  `eslint --fix`, puis relint pour confirmer. C'est le rôle d'avoir configuré la chaîne
  avant d'écrire le code.
- **Vérification au runtime, pas seulement à la compilation.** Je n'ai pas considéré une
  étape comme terminée parce que `tsc` passait. L'API a été démarrée et interrogée :
  `/health`, métadonnées de pagination (`total: 72`), `X-Cache` passant de `MISS` à `HIT`
  sur deux appels identiques, filtre combiné `Electronics` + `in_stock` renvoyant 7
  résultats, format d'erreur `400` sur `page=0`.
- **Lockfiles committés** après avoir noté que le `buildCommand` du `render.yaml` utilise
  `npm ci`, qui échoue sans eux.

---

## 3. Le parcours d'architecture

C'est la partie où l'IA a le plus servi de **contradicteur** plutôt que d'exécutant.

### Étape 1 — audit d'une affirmation

Le README parlait d'« architecture propre » et le code exposait des interfaces derrière des
tokens d'injection. J'ai demandé si on pouvait légitimement parler d'architecture
hexagonale, en signalant que je ne voyais **ni ports ni adapters nommés**.

L'audit a confirmé le soupçon et surtout identifié un défaut que je n'avais pas vu : le use
case manipulait directement `QueryProductsDto` et `PaginatedProductsResponse`, deux classes
porteuses de décorateurs Swagger et `class-validator`. Autrement dit **la couche HTTP
fuyait jusque dans le cœur applicatif**. Les sorties (persistance, cache) étaient des
abstractions propres, mais l'entrée non — l'hexagone était asymétrique.

### Étape 2 — hexagonal réel

Correction du défaut, pas seulement du vocabulaire :

- Le use case ne connaît plus **aucun** DTO. Il expose un modèle de requête et un modèle de
  réponse en types de domaine ; l'adapter HTTP traduit dans les deux sens (dont le
  renommage `stock_status` → `stockStatus`, qui matérialise la frontière).
- Symétrie rétablie : le controller dépend d'un **port primaire** via token, plus de la
  classe concrète du use case.
- Vocabulaire aligné : `.interface.ts` → `.port.ts`, `ProductsService` →
  `ListProductsUseCase`.

### Étape 3 — Clean Architecture, volontairement partielle

J'ai demandé une **explication avant exécution** pour comprendre ce qui distingue réellement
les deux modèles. Conclusion : sur ce code, Clean et hexagonal décrivent la même chose avec
un vocabulaire différent, et il ne restait que trois écarts. J'en ai retenu un
(réorganisation en anneaux : `entities/`, `use-cases/boundaries/`, `interface-adapters/`,
`infrastructure/`) et écarté deux (détail en section 4).

### Étape 4 — élimination du dernier couplage framework

Un second audit a relevé que le use case importait encore `@nestjs/common` pour
`@Injectable` et `@Inject` — couplage pragmatique très répandu en NestJS, mais qui contredit
l'indépendance du cœur. J'ai décidé de l'éliminer :

- Le use case est devenu une **classe nue** : constructeur ordinaire, zéro import framework.
- Le composition root l'instancie explicitement par `useFactory` + `inject`, ce qui est
  exactement son rôle : c'est le seul endroit autorisé à connaître à la fois les contrats et
  le framework.
- **Le test unitaire n'importe plus `@nestjs/testing`** : un `new ListProductsUseCase(repo,
  cache)` suffit. C'est l'artefact que je retiens le plus de tout le projet — une
  démonstration exécutable que le cœur est découplé, et non une affirmation dans un README.

Le repository, lui, garde son `@Injectable()` : c'est de l'infrastructure, le framework y est
légitime. La pureté s'applique au centre, pas aux bords.

### Étape 5 — regroupement du cœur sous `core/`

J'ai proposé de regrouper `entities/` et `use-cases/` sous un dossier `core/`, pour que la
frontière du cœur soit visible dans l'arborescence au lieu de reposer sur une convention
implicite. Retenu, avec une exception justifiée : le port du cache reste dans `common/`,
parce que c'est un **shared kernel** — un contrat générique sans métier, partageable entre
modules, qui n'appartient donc pas au cœur « produits ».

### Ce qui prouve que ces refactors n'ont rien cassé

- **Une baseline verte établie avant de toucher au code**, rejouée après chaque étape.
- **Les tests e2e n'ont pas changé d'une seule ligne** et restent verts. Comme ils portent
  sur le contrat HTTP (`{ data, meta }`, headers, codes d'erreur), c'est la démonstration
  que toute cette réorganisation est invisible de l'extérieur.
- **La règle de dépendance est vérifiée mécaniquement**, pas affirmée : `entities/`
  n'importe rien du tout, et le cœur ne contient aucune référence à `interface-adapters`,
  `infrastructure`, `@nestjs/*`, `class-validator` ou `express`. C'est une contrainte qu'on
  peut rejouer en une commande.
- **Un trou de couverture identifié et compensé** : les tests unitaires ne démarrent pas le
  module NestJS, donc le nouveau câblage par `useFactory` — et notamment l'ordre du tableau
  `inject` — n'est couvert par aucun test. Vérifié par un démarrage réel de l'application
  suivi de deux appels HTTP (`X-Cache: MISS` puis `HIT`). Sans ce contrôle, une erreur
  d'ordre d'injection ne se serait manifestée qu'en production.

### Deux incidents d'exécution, et ce qu'ils m'ont appris

- **`git rm` en échec sur des fichiers non indexés.** La commande étant atomique, elle a
  tout refusé en bloc, laissant momentanément l'ancienne **et** la nouvelle arborescence
  dans `src/` avec des imports orphelins. Détecté par l'inventaire systématique des fichiers
  et la recherche de références aux anciens chemins. Le reste du code compilait très bien —
  c'est l'argument le plus concret pour ne jamais faire confiance à une étape non vérifiée.
- **Un verrou de fichier sous Windows.** Un déplacement de dossier a échoué en
  `Permission denied` : un process Node laissé vivant par un smoke test antérieur tenait le
  répertoire. Le déblocage s'est fait par un `taskkill` sur tous les processus Node — un
  instrument brutal, qui aurait pu emporter d'autres travaux en cours sur ma machine. Leçon
  retenue : un smoke test lancé par un agent doit être terminé explicitement, pas laissé
  s'éteindre tout seul.
- **Une vérification qui produit un faux positif.** Après le déplacement, la recherche
  d'anciens chemins a signalé deux imports `'../../entities/product'` apparemment non
  corrigés. Ils étaient en réalité justes : `entities/` et `use-cases/` ayant bougé
  ensemble, leur chemin relatif mutuel est inchangé. Un correctif appliqué sans réfléchir
  aurait cassé la compilation.

---

## 4. Ce que j'ai rejeté, et pourquoi

### Le cadrage de Claude sur le compromis Clean

Claude m'a présenté un tableau opposant « Clean pragmatique ~85 % de fidélité » à « Clean
textbook 100 % », ce qui laissait entendre que la version pragmatique avait une
**faiblesse** sur l'absence de Presenter / output port. J'ai contesté cette lecture : en
HTTP synchrone il n'y a pas d'arbitrage à faire, l'output port est simplement inutile.
Claude a reconnu que le tableau induisait en erreur — « fidélité au texte » n'est pas
« qualité ».

J'ai aussi vérifié le mécanisme sous-jacent plutôt que de l'accepter : l'output port est la
**seule** des deux frontières où une inversion de dépendance est réellement mobilisée (le
use case possède l'interface, l'anneau externe l'implémente). L'input port, lui, va déjà
dans le bon sens et n'inverse rien. C'est précisément cette inversion que le `return` du
controller plus la sérialisation NestJS rendent superflue.

### Le Presenter / output port

Écarté. Il ne rapporte quelque chose que s'il y a plusieurs sorties pour un même use case,
une logique de présentation lourde, ou un flux asynchrone multi-canal. Ici : une seule
sortie JSON, un formatage trivial. L'implémenter aurait imposé un `execute()` retournant
`void`, un ViewModel mutable et une instance par requête — de la cérémonie pour réinventer
un chemin de retour que le framework fournit déjà.

### L'entité « riche »

Écarté. Ce domaine est un catalogue en lecture seule sans aucune règle métier d'entreprise à
encapsuler. Ajouter un `isAvailable()` ou un invariant `price >= 0` que personne n'appelle
aurait été du cargo-cult : de la forme sans la substance. Le commentaire en tête de
`core/entities/product.ts` assume ce choix et indique où un vrai invariant devra vivre le
jour où il apparaîtra.

### Les patterns multi-produits, malgré l'intérêt du sujet

La discussion a dérivé vers l'organisation d'un cœur métier partagé entre plusieurs
produits : Shared Kernel co-possédé, bounded context autonome exposé par un Open Host
Service, Anti-Corruption Layer côté consommateur, classification core / supporting /
generic. **J'ai explicitement arrêté là et refusé de l'implémenter** : l'énoncé demande une
architecture propre pour un endpoint de lecture, pas une plateforme multi-produits. Ce qui
rendrait l'extraction possible plus tard — un cœur sans dépendance technique, des contrats
en ports, des implémentations traitées comme des détails — est déjà en place ; ce n'est pas
un travail supplémentaire à faire maintenant.

Deux conclusions de cette discussion me paraissent utiles à garder, même sans code associé :

- **Fusionner les cœurs métier de plusieurs produits serait une erreur**, pas une
  optimisation : on n'obtiendrait qu'un monolithe distribué et des frontières perdues (le
  même mot ne désigne pas le même concept dans deux contextes). Seul le générique sans
  métier — un port de cache, une pagination — se partage.
- **Un use case n'a pas vocation à monter dans un cœur partagé.** C'est une *Application
  Business Rule*, spécifique à une application par définition ; l'y mettre forcerait les
  autres produits à porter du code qu'ils n'utilisent pas. À cette échelle, seuls les
  entités et les ports communs se partagent. Cela délimite d'ailleurs mon propre choix de
  l'étape 5 : le dossier `core/` est une commodité mono-produit, pas une frontière définitive.

### Écarté en amont, dans le brief initial

- **Outillage monorepo** (pnpm workspaces, Nx, Turbo) — deux applications qui ne partagent
  qu'une forme de payload ne justifient pas une couche d'outillage à configurer puis à
  expliquer, d'autant qu'elles sont déployées comme deux services distincts.
- **Redis** — aucune écriture dans ce système : les entrées de cache ne peuvent qu'expirer.
  Toute machinerie d'invalidation serait du code mort.
- **Base de données et ORM** — la contrainte de l'énoncé, respectée, sans se fermer la
  porte : l'abstraction de persistance laisse le remplacement ouvert.
- **Authentification** — hors périmètre d'un endpoint de lecture publique.

### Écarté après arbitrage technique

- **`CacheInterceptor` de NestJS** — c'était la première proposition. Rejetée pour deux
  raisons : l'énoncé demande d'**implémenter** un système de cache, et déléguer à un module
  intégré escamote précisément la logique évaluée ; et un interceptor travaille au niveau
  HTTP, où il indexe sur l'URL. On perd la normalisation de la clé, puisque les valeurs par
  défaut ne sont pas encore résolues à ce moment-là.
- **Bibliothèque `lru-cache`** — même raisonnement : le cache doit être maison et lisible.
  Une `Map` donne l'éviction LRU en O(1) et tient en une classe explicable ligne par ligne.
- **Context API + reducer** côté front — écarté au profit de Zustand : un Context déclenche
  un re-render de tout le sous-arbre au moindre changement d'état, pour un bénéfice nul ici.
- **Fly.io** — écarté au profit de Render. Critère : la procédure de déploiement doit
  pouvoir être suivie sans réfléchir par quelqu'un qui découvre le repo.
- **Dockerfile** — envisagé, puis abandonné : le build natif de Render suffit.
- **`404` quand `page` dépasse `totalPages`** — une page vide dans une collection paginée
  n'est pas une ressource absente. L'API renvoie `200` avec `data: []` et un `meta`
  cohérent, ce qui permet au front d'afficher un état vide plutôt qu'une erreur.

---

## Ce que je retiens

Le levier n'a pas été la vitesse de génération. Il a été triple.

**Le cadrage** : contraintes explicites, anti-objectifs nommés, critère de validation posé
d'avance (« je dois pouvoir défendre chaque décision »).

**La contradiction** : les apports les plus utiles sont venus de désaccords. Mon soupçon sur
le vocabulaire employé a fait remonter une vraie fuite de la couche HTTP dans le cœur. Ma
contestation d'un tableau de compromis trompeur a clarifié qu'un pattern absent n'est pas un
pattern manquant. Et interroger la limite de mon propre regroupement `core/` a montré
pourquoi un use case ne se partage pas entre produits.

**La délimitation du périmètre** : un assistant explore volontiers aussi loin qu'on le
laisse aller. La discussion sur les patterns DDD multi-produits était intéressante et
entièrement hors sujet pour ce livrable — décider où s'arrêter fait partie du travail.

Reste un enseignement plus prosaïque : une étape non vérifiée est une étape non faite. Les
deux seuls incidents réels — une arborescence dupliquée après un `git rm` en échec, un
verrou de fichier tenu par un process laissé vivant — n'ont été rattrapés que parce que la
vérification était systématique, et non parce que le code refusait de compiler.