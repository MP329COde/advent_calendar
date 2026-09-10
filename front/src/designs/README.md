# Bibliothèque de designs

Ce dossier est l'endroit où déposer tes propres designs "faits main" pour le
calendrier de l'avent. Chaque design est un dossier autonome contenant sa
configuration, ses icônes et ses instructions. Rien ici n'est lu par le
serveur : tout est scanné automatiquement côté front au build (voir
`loadDesigns.js`), puis proposé à l'import dans **Admin > Thèmes**.

## Créer un nouveau design

1. Copie le dossier `_template/` et renomme-le (ex: `noel-nordique/`).
2. Remplis `design.json` **ou** `design.js` (voir les deux formats
   ci-dessous) — si les deux existent dans le même dossier, `design.js`
   l'emporte.
3. Dépose tes fichiers d'icônes dans le sous-dossier `icons/` (SVG de
   préférence, PNG/WebP acceptés).
4. Écris tes notes/instructions pour toi-même dans `INSTRUCTIONS.md` — ce
   fichier n'est jamais lu par l'application, c'est un espace libre.
5. Lance le front (`npm run dev`) : le design apparaît automatiquement dans
   Admin > Thèmes > "Bibliothèque de designs", sans rien déclarer ailleurs.
6. Clique sur "Importer comme thème" pour le copier en base de données. Il
   devient alors un thème classique, modifiable et activable comme les
   autres depuis l'Admin — y compris avec la roue des couleurs et les
   palettes suggérées (voir plus bas).

Les dossiers commençant par `_` (comme `_template`) sont ignorés par le scan
et ne sont jamais proposés à l'import.

## Faire le design directement en code (`design.js`)

Si `design.json` est trop limité (tu veux calculer une teinte, dériver des
variantes, factoriser une palette entre plusieurs designs...), remplace-le
par un `design.js` : c'est un module JS normal, exécuté au build par Vite.
Il peut exporter :
- l'objet de configuration directement (`export default { ... }`), ou
- une fonction `({ icons }) => ({ ... })` qui le calcule — `icons` donne les
  URLs déjà résolues des fichiers du sous-dossier `icons/` (ex:
  `icons['logo.svg']`).

Voir `_template/design.js` pour un exemple complet.

## Roue des couleurs et palettes suggérées

Dans Admin > Thèmes, chaque couleur d'un thème peut être réglée soit avec le
sélecteur natif, soit avec le bouton "🎨 Roue" qui ouvre une roue chromatique
(teinte + saturation par la position sur la roue, luminosité par un
curseur). Des palettes harmonieuses prêtes à l'emploi ("bonnes couleurs")
sont aussi proposées en un clic au-dessus des couleurs de chaque thème —
voir `paletteSuggestions.js` pour les modifier ou en ajouter.

## Vidéo de fond

Dans Admin > Identité de la plateforme, un champ permet d'uploader une
vidéo de fond (MP4/WebM, 50 Mo max) qui s'affiche en plein écran derrière
tout le site. Un design peut aussi la définir directement via
`branding.backgroundVideoUrl` dans `design.json`/`design.js` (chemin
relatif vers `icons/` ou URL absolue), elle sera appliquée automatiquement
lors de l'import.

## Format de `design.json`

```json
{
  "name": "Nom affiché dans l'admin",
  "description": "Une phrase pour se souvenir de l'intention du design",
  "colors": {
    "primary": "#9b1c1c",
    "secondary": "#c87512",
    "accent": "#D4AF37",
    "background": "#fffdf8",
    "surface": "#ffffff",
    "text": "#243047",
    "muted": "#6f5a55"
  },
  "typography": {
    "fontFamily": "system-ui",
    "headingFontFamily": "system-ui"
  },
  "shape": {
    "radius": 16
  },
  "branding": {
    "platformName": "Calendrier de l'Avent",
    "shortName": "Avent",
    "tagline": "",
    "logoUrl": "icons/logo.svg",
    "faviconUrl": "icons/favicon.svg",
    "backgroundVideoUrl": "icons/fond.mp4"
  }
}
```

- `colors`, `typography` et `shape` sont copiés tels quels dans la
  configuration du thème (voir `front/src/theme/applyThemeVariables.js` pour
  la liste des propriétés supportées).
- `branding` est optionnel. `logoUrl` / `faviconUrl` peuvent être soit un
  chemin relatif vers un fichier du sous-dossier `icons/` (ex:
  `icons/logo.svg`), soit une URL absolue déjà hébergée ailleurs.
- Tous les champs sont optionnels sauf `name`.
