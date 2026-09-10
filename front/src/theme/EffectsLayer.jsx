import { useLocation } from 'react-router-dom'
import { useTheme } from './useTheme'
import SnowOverlay from './SnowOverlay'
import StarsOverlay from './StarsOverlay'
import ConfettiOverlay from './ConfettiOverlay'
import LightsGarland from './LightsGarland'

// Une vidéo de fond est déjà coûteuse à décoder/compositer en continu : on
// plafonne les effets décoratifs superposés dans ce cas pour éviter les
// chutes de qualité/fluidité observées quand tout tourne en même temps.
const VIDEO_SNOW_DENSITY_CAP = 20

function EffectsLayer() {
  const { theme, branding } = useTheme() ?? {}
  const location = useLocation()
  const animation = theme?.config?.animation ?? {}
  const hasBackgroundVideo = Boolean(branding?.backgroundVideoUrl)

  if (location.pathname.toLowerCase().startsWith('/admin')) return null

  const snowDensity = animation.snowDensity ?? 36
  const effectiveSnowDensity = hasBackgroundVideo
    ? Math.min(snowDensity, VIDEO_SNOW_DENSITY_CAP)
    : snowDensity

  return (
    <>
      {animation.snow && (
        <SnowOverlay density={effectiveSnowDensity} size={animation.snowSize ?? 1} />
      )}
      {animation.stars && <StarsOverlay count={hasBackgroundVideo ? 10 : 24} />}
      {animation.confetti && <ConfettiOverlay />}
      {animation.lights && <LightsGarland />}
    </>
  )
}

export default EffectsLayer
