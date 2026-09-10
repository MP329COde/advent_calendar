/**
 * Alternative à design.json : ce fichier est un vrai module JS, tu peux donc
 * calculer ta palette (dériver des teintes, boucler sur des variantes,
 * importer une palette partagée...) au lieu d'écrire du JSON statique.
 * Renomme-le en design.js dans ton propre dossier (supprime design.json) si
 * tu veux partir de cet exemple plutôt que du JSON.
 *
 * Peut exporter soit un objet directement, soit une fonction ({ icons }) qui
 * retourne cet objet — `icons` donne accès aux URLs déjà résolues du
 * sous-dossier icons/ (ex: icons['logo.svg']).
 */
const base = {
  primary: '#9b1c1c',
  secondary: '#166534',
  accent: '#D4AF37',
}

export default function design({ icons }) {
  return {
    name: 'Nom de ton design (code)',
    description: 'Exemple de design généré en code plutôt qu\'en JSON',
    colors: {
      ...base,
      background: '#fffdf8',
      surface: '#ffffff',
      text: '#243047',
      muted: '#6f5a55',
    },
    typography: {
      fontFamily: 'system-ui',
      headingFontFamily: 'system-ui',
    },
    shape: {
      radius: 16,
    },
    branding: {
      platformName: '',
      shortName: '',
      tagline: '',
      logoUrl: icons['logo.svg'] ?? null,
      faviconUrl: icons['favicon.svg'] ?? null,
    },
  }
}
