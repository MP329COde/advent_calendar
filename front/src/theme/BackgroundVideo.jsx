import { useTheme } from './useTheme'
import './BackgroundVideo.css'

function BackgroundVideo() {
  const { branding } = useTheme()
  const url = branding?.backgroundVideoUrl

  if (!url) return null

  return (
    <video className="app-background-video" src={url} autoPlay muted loop playsInline />
  )
}

export default BackgroundVideo
