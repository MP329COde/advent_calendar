import { useLocation } from 'react-router-dom'
import { useTheme } from './useTheme'
import SnowOverlay from './SnowOverlay'
import StarsOverlay from './StarsOverlay'
import ConfettiOverlay from './ConfettiOverlay'
import LightsGarland from './LightsGarland'

function EffectsLayer() {
  const { theme } = useTheme() ?? {}
  const location = useLocation()
  const animation = theme?.config?.animation ?? {}

  if (location.pathname.toLowerCase().startsWith('/admin')) return null

  return (
    <>
      {animation.snow && <SnowOverlay />}
      {animation.stars && <StarsOverlay />}
      {animation.confetti && <ConfettiOverlay />}
      {animation.lights && <LightsGarland />}
    </>
  )
}

export default EffectsLayer
