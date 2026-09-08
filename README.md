# Advent Calendar

Application "calendrier de l'avent" : un défi / mini-projet par jour, du 1er au 24 décembre.

## Structure du dépôt

```
advent_calendar/
├── back/     # API backend (Express + Node.js + better-sqlite3)
├── front/    # Application front (React + Vite)
└── .github/  # Workflows CI/CD, templates d'issues et de pull requests
```

## Trame à suivre pour chaque jour

1. **Créer une issue** à partir du template "Jour du calendrier" (onglet *Issues* → *New issue*), en précisant le numéro du jour et l'objectif du défi.
2. **Créer une branche** dédiée depuis `main` : `jour-XX-description` (ex. `jour-03-formulaire-contact`).
3. **Développer** la fonctionnalité côté `front/` et/ou `back/` selon le besoin.
4. **Ouvrir une pull request** vers `main` avec le template fourni, en liant l'issue correspondante (`Closes #XX`).
5. **Vérifier que la CI passe** (lint + build) avant de merger.

## Prérequis

- Node.js ≥ 18
- npm

## Installation

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

## Conventions

- **Commits** : préfixer par le jour concerné, ex. `jour-03: ajoute le formulaire de contact`.
- **Branches** : `jour-XX-description-courte`.
- **Lint** : doit passer avant toute PR (`npm run lint` dans `front/`).
- **Variables d'environnement** : ne jamais commiter de fichier `.env`, se baser sur `.env.example`.

## CI/CD

Le workflow `.github/workflows/ci.yml` lint et build automatiquement le `front` et installe/teste le `back` à chaque push et pull request sur `main`.
