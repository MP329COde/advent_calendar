# Advent Calendar

Application "calendrier de l'avent" : un défi / mini-projet par jour, du 1er au 24 décembre.

## Démarrage rapide (sans cloner le dépôt)

Les images `front` et `back` sont publiées publiquement sur GitHub Container Registry : il n'y a rien à builder, seul Docker (avec le plugin Compose) est nécessaire.

```bash
curl -O https://raw.githubusercontent.com/MP329COde/advent_calendar/main/docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

- Le front est accessible sur http://localhost:8080
- Le back est exposé sur http://localhost:3001
- La base SQLite du back (`database.db`) est conservée entre les redémarrages grâce au volume Docker `back_data`

Pour tout arrêter : `docker compose -f docker-compose.prod.yml down` (ajouter `-v` pour aussi supprimer les données).

Pour développer sur le projet (avec le code source, hot-reload, etc.), voir les sections suivantes.

## Structure du dépôt

```
advent_calendar/
├── back/                   # API backend (Express + Node.js + better-sqlite3)
├── front/                  # Application front (React + Vite)
├── k8s/                    # Manifestes Kubernetes (déploiement alternatif à Docker Compose)
├── docker-compose.yml      # Build front + back localement à partir du code source
├── docker-compose.prod.yml # Lance front + back à partir des images publiées sur GHCR (aucun build)
└── .github/                # Workflows CI/CD, Dependabot, templates d'issues et de pull requests
```

## Trame à suivre pour chaque jour

1. **Créer une issue** à partir du template "Jour du calendrier" (onglet *Issues* → *New issue*), en précisant le numéro du jour et l'objectif du défi.
2. **Créer une branche** dédiée depuis `main` : `jour-XX-description` (ex. `jour-03-formulaire-contact`).
3. **Développer** la fonctionnalité côté `front/` et/ou `back/` selon le besoin.
4. **Ouvrir une pull request** vers `main` avec le template fourni, en liant l'issue correspondante (`Closes #XX`).
5. **Vérifier que la CI passe** (lint + build) avant de merger.

## Prérequis

- Node.js >= 18
- npm
- Docker et Docker Compose (pour le déploiement local/serveur)
- kubectl (uniquement si déploiement sur Kubernetes)

## Installation en local (sans Docker)

### Backend

```bash
cd back
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd front
npm install
npm run dev
```

## Déploiement avec Docker Compose

Lance le front et le back ensemble en une seule commande, à la racine du dépôt (build à partir du code source) :

```bash
docker compose up --build -d
```

- Le front est servi sur http://localhost:8080
- Le back est exposé sur http://localhost:3001
- La base SQLite du back (`database.db`) est conservée entre les redémarrages grâce au volume Docker `back_data`

Pour tout arrêter :

```bash
docker compose down
```

Pour arrêter et supprimer aussi les données de la base :

```bash
docker compose down -v
```

> Pour lancer l'application sans builder les images (à partir des images déjà publiées sur GHCR), voir la section [Démarrage rapide](#démarrage-rapide-sans-cloner-le-dépôt) ci-dessus, qui utilise `docker-compose.prod.yml`.

## Registre d'images Docker (GitHub Container Registry)

Le workflow `.github/workflows/docker-publish.yml` construit et publie automatiquement les images Docker du `front` et du `back` sur le [GitHub Container Registry (GHCR)](https://docs.github.com/fr/packages/working-with-a-github-packages-registry/working-with-the-container-registry) à chaque push sur `main` (ainsi que sur les tags `v*.*.*`), en utilisant le `GITHUB_TOKEN` fourni automatiquement par GitHub Actions (aucun secret à configurer).

Images publiées (visibilité **publique**, `docker pull` fonctionne sans authentification) :

- `ghcr.io/mp329code/advent_calendar-back`
- `ghcr.io/mp329code/advent_calendar-front`

Tags générés automatiquement : `latest` (sur `main`), le nom de la branche, le SHA court du commit, et la version sémantique en cas de tag `vX.Y.Z`.

Récupérer une image en local :

```bash
docker pull ghcr.io/mp329code/advent_calendar-back:latest
docker pull ghcr.io/mp329code/advent_calendar-front:latest
```

Si la visibilité du package venait à être repassée en privé (onglet *Packages* du dépôt → sélectionner le package → *Package settings* → *Change visibility*), il faudrait alors créer un [Personal Access Token avec le scope `read:packages`](https://docs.github.com/fr/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry) et se connecter avec `docker login ghcr.io -u <utilisateur> -p <token>` (ou un `imagePullSecret` côté Kubernetes).

## Déploiement avec Kubernetes

Les manifestes se trouvent dans `k8s/advent-calendar.yaml` (PersistentVolumeClaim, Deployments et Services pour le front et le back). Les images utilisées pointent vers GHCR (`ghcr.io/mp329code/advent_calendar-back` et `ghcr.io/mp329code/advent_calendar-front`), publiées automatiquement par le workflow `docker-publish.yml` :

```bash
kubectl apply -f k8s/advent-calendar.yaml
```

Les images GHCR étant publiques, aucun `imagePullSecrets` n'est nécessaire. Si la visibilité du package était repassée en privé, ajouter un `imagePullSecrets` dans les Deployments pointant vers un secret Kubernetes créé avec :

```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=<utilisateur> \
  --docker-password=<token avec le scope read:packages>
```

Le service `advent-front` est de type `LoadBalancer` : selon le cluster, une IP externe sera attribuée automatiquement (ou utiliser `kubectl port-forward` en local avec Minikube/Kind).

## Conventions

- **Commits** : préfixer par le jour concerné, ex. `jour-03: ajoute le formulaire de contact`.
- **Branches** : `jour-XX-description-courte`.
- **Lint** : doit passer avant toute PR (`npm run lint` dans `front/`).
- **Variables d'environnement** : ne jamais commiter de fichier `.env`, se baser sur `.env.example`.

## CI/CD et mises à jour automatiques

- Le workflow `.github/workflows/ci.yml` lint et build automatiquement le `front`, installe/teste le `back`, et exécute les tests end-to-end Playwright du `front` à chaque push et pull request sur `main`.
- Le workflow `.github/workflows/docker-publish.yml` construit et publie les images Docker du `front` et du `back` sur GHCR à chaque push sur `main` (voir la section [Registre d'images Docker](#registre-dimages-docker-github-container-registry)).
- **Dependabot** (`.github/dependabot.yml`) ouvre automatiquement une pull request chaque semaine dès qu'une dépendance npm, une image Docker ou une action GitHub peut être mise à jour. Vérifier régulièrement l'onglet *Pull requests* et les fusionner après relecture (la CI doit être verte).
