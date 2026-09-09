# Politique de sécurité

## Versions supportées

Ce dépôt est un projet en développement actif. Seule la branche `main` (dernière version) est suivie pour les correctifs de sécurité.

| Version | Supportée |
| ------- | --------- |
| `main`  | ✅ |

## Signaler une vulnérabilité

Merci de ne **jamais** ouvrir une issue publique pour signaler une faille de sécurité (fuite de données, injection, secret exposé, faille d'authentification, etc.).

À la place :

1. Utiliser le signalement privé de vulnérabilités de GitHub : onglet **Security** → **Report a vulnerability** de ce dépôt.
2. Décrire le problème le plus précisément possible : étapes de reproduction, impact potentiel, version/commit concerné.
3. Une réponse sera apportée dès que possible pour évaluer et corriger le problème avant toute divulgation publique.

## Bonnes pratiques appliquées dans ce dépôt

- **Dependabot** : mises à jour automatiques des dépendances npm, images Docker et GitHub Actions (`.github/dependabot.yml`).
- **Dependabot alerts** : notification automatique en cas de vulnérabilité connue dans une dépendance.
- **Secret scanning + push protection** : détection et blocage des secrets (clés API, tokens, etc.) avant qu'ils ne soient poussés sur le dépôt.
- **Code scanning (CodeQL)** : analyse statique automatique du code (JavaScript/TypeScript et workflows GitHub Actions) à la recherche de vulnérabilités et d'erreurs courantes.
- **Protection de la branche `main`** : toute modification doit passer par une pull request avec la CI (lint + build/test) au vert avant fusion ; pas de force-push ni de suppression de branche autorisés.
- **Variables d'environnement** : aucun fichier `.env` réel ne doit être commité, se baser uniquement sur les fichiers `.env.example` fournis.

## Périmètre

Ce projet est un calendrier de l'avent à but pédagogique/communautaire, sans données sensibles d'utilisateurs finaux en production à ce stade. Toute vulnérabilité affectant l'intégrité du code, les secrets du dépôt ou la chaîne de déploiement (Docker/Kubernetes) est considérée comme prioritaire.
