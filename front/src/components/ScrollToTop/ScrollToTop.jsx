import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}

export default ScrollToTop
