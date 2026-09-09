# Advent Calendar

Application "calendrier de l'avent" : un défi / mini-projet par jour, du 1er au 24 décembre.

## Structure du dépôt

```
advent_calendar/
├── back/               # API backend (Express + Node.js + better-sqlite3)
├── front/              # Application front (React + Vite)
├── k8s/                # Manifestes Kubernetes (déploiement alternatif à Docker Compose)
├── docker-compose.yml  # Lance front + back ensemble en local ou sur un serveur
└── .github/            # Workflows CI/CD, Dependabot, templates d'issues et de pull requests
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

Lance le front et le back ensemble en une seule commande, à la racine du dépôt :

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

## Déploiement avec Kubernetes

Les manifestes se trouvent dans `k8s/advent-calendar.yaml` (PersistentVolumeClaim, Deployments et Services pour le front et le back). Après avoir construit et poussé les images (`advent_calendar-back` et `advent_calendar-front`) vers un registre accessible par le cluster :

```bash
kubectl apply -f k8s/advent-calendar.yaml
```

Le service `advent-front` est de type `LoadBalancer` : selon le cluster, une IP externe sera attribuée automatiquement (ou utiliser `kubectl port-forward` en local avec Minikube/Kind).

## Conventions

- **Commits** : préfixer par le jour concerné, ex. `jour-03: ajoute le formulaire de contact`.
- **Branches** : `jour-XX-description-courte`.
- **Lint** : doit passer avant toute PR (`npm run lint` dans `front/`).
- **Variables d'environnement** : ne jamais commiter de fichier `.env`, se baser sur `.env.example`.

## CI/CD et mises à jour automatiques

- Le workflow `.github/workflows/ci.yml` lint et build automatiquement le `front` et installe/teste le `back` à chaque push et pull request sur `main`.
- **Dependabot** (`.github/dependabot.yml`) ouvre automatiquement une pull request chaque semaine dès qu'une dépendance npm, une image Docker ou une action GitHub peut être mise à jour. Vérifier régulièrement l'onglet *Pull requests* et les fusionner après relecture (la CI doit être verte).
