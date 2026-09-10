/**
 * Scanne automatiquement front/src/designs/ pour lister les designs
 * "faits main" (voir README.md de ce dossier). Un design = un sous-dossier
 * avec un design.json (données) OU un design.js (code, pour calculer une
 * palette, dériver des teintes, etc.) + un sous-dossier icons/. Les
 * dossiers préfixés par `_` (ex: _template) sont ignorés. Si les deux
 * fichiers existent, design.js est prioritaire.
 */
const jsonDesignModules = import.meta.glob('./*/design.json', { eager: true })
const jsDesignModules = import.meta.glob('./*/design.js', { eager: true })
const iconModules = import.meta.glob('./*/icons/*', { eager: true, query: '?url', import: 'default' })

function folderKeyFromPath(path) {
  // ex: './noel-nordique/design.json' -> 'noel-nordique'
  return path.split('/')[1]
}

function buildDesignModulesByFolder() {
  const byFolder = {}
  for (const [path, mod] of Object.entries(jsonDesignModules)) {
    byFolder[folderKeyFromPath(path)] = mod
  }
  // design.js est prioritaire sur design.json pour un même dossier.
  for (const [path, mod] of Object.entries(jsDesignModules)) {
    byFolder[folderKeyFromPath(path)] = mod
  }
  return byFolder
}

function buildIconsIndex() {
  const iconsByFolder = {}
  for (const [path, url] of Object.entries(iconModules)) {
    const folder = folderKeyFromPath(path)
    const filename = path.split('/').pop()
    iconsByFolder[folder] ??= {}
    iconsByFolder[folder][filename] = url
    iconsByFolder[folder][`icons/${filename}`] = url
  }
  return iconsByFolder
}

function resolveIconRef(ref, icons) {
  if (!ref || typeof ref !== 'string') return ref
  if (/^(https?:)?\//.test(ref) || ref.startsWith('data:')) return ref
  return icons?.[ref] ?? ref
}

export function loadDesigns() {
  const iconsByFolder = buildIconsIndex()
  const designModulesByFolder = buildDesignModulesByFolder()

  return Object.entries(designModulesByFolder)
    .map(([folder, mod]) => {
      const raw = mod.default ?? mod
      // Un design.js peut exporter directement l'objet, ou une fonction qui
      // le calcule (utile pour dériver des teintes, des dégradés, etc.).
      const design = typeof raw === 'function' ? raw({ icons: iconsByFolder[folder] ?? {} }) : raw
      const icons = iconsByFolder[folder] ?? {}

      return {
        folder,
        name: design.name ?? folder,
        description: design.description ?? '',
        config: {
          colors: design.colors ?? {},
          typography: design.typography ?? {},
          shape: design.shape ?? {},
        },
        branding: design.branding
          ? {
              ...design.branding,
              logoUrl: resolveIconRef(design.branding.logoUrl, icons),
              faviconUrl: resolveIconRef(design.branding.faviconUrl, icons),
              backgroundVideoUrl: resolveIconRef(design.branding.backgroundVideoUrl, icons),
            }
          : null,
        icons,
      }
    })
    .filter((design) => !design.folder.startsWith('_'))
    .sort((a, b) => a.name.localeCompare(b.name))
}
