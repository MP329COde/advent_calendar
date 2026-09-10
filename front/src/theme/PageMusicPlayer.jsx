import { useRef, useState } from 'react'
import { useTheme } from './useTheme'
import { extractYoutubeId } from '../utils/youtube'
import './PageMusicPlayer.css'

/**
 * Lecteur de musique de page : fichier audio uploadé ou vidéo YouTube (via
 * youtube-nocookie.com, sans branding YouTube et avec un minimum de
 * tracking). La lecture démarre uniquement après une action de l'utilisateur
 * pour respecter les politiques d'autoplay des navigateurs.
 */
function PageMusicPlayer({ pageKey }) {
  const { theme } = useTheme() ?? {}
  const pageConfig = theme?.config?.pages?.[pageKey]
  const audioUrl = pageConfig?.musicUrl
  const youtubeId = extractYoutubeId(pageConfig?.musicYoutubeUrl)

  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  if (!audioUrl && !youtubeId) return null

  function toggle() {
    if (audioUrl && audioRef.current) {
      if (playing) audioRef.current.pause()
      else audioRef.current.play().catch(() => {})
    }
    setPlaying((prev) => !prev)
  }

  return (
    <div className="page-music-player" data-testid="page-music-player">
      <button
        type="button"
        className="page-music-player__toggle"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Mettre la musique en pause' : 'Lancer la musique de la page'}
      >
        {playing ? '⏸' : '🎵'}
      </button>

      {audioUrl && <audio ref={audioRef} src={audioUrl} loop preload="none" />}

      {youtubeId && playing && (
        <iframe
          className="page-music-player__youtube"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${youtubeId}`}
          title="Musique de la page"
          allow="autoplay; encrypted-media"
          data-testid="page-music-youtube"
        />
      )}
    </div>
  )
}

export default PageMusicPlayer
