import { useEffect, useRef } from 'react'
import { useTheme } from './useTheme'
import './BackgroundVideo.css'

// Décoder et compositer une vidéo en continu est coûteux : on la met en
// pause dès que l'onglet n'est pas visible pour éviter de gaspiller du GPU
// (et de dégrader la fluidité des autres animations) en arrière-plan.
function usePauseWhenHidden(videoRef) {
  useEffect(() => {
    function handleVisibility() {
      const video = videoRef.current
      if (!video) return
      if (document.hidden) {
        video.pause()
      } else {
        video.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [videoRef])
}

function BackgroundVideo() {
  const { branding } = useTheme()
  const url = branding?.backgroundVideoUrl
  const videoRef = useRef(null)
  usePauseWhenHidden(videoRef)

  if (!url) return null

  return (
    <video
      ref={videoRef}
      className="app-background-video"
      src={url}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
    />
  )
}

export default BackgroundVideo
