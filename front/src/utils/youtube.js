// Accepte une URL YouTube classique, courte ou déjà un identifiant brut.
export function extractYoutubeId(input) {
  if (!input) return null
  const trimmed = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1) || null
    if (url.hostname.includes('youtube')) {
      return url.searchParams.get('v') || url.pathname.split('/embed/')[1] || null
    }
  } catch {
    return null
  }
  return null
}
