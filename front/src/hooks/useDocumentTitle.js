import { useEffect } from 'react'
import { useTheme } from '../theme/useTheme'

const DEFAULT_SITE_NAME = "Calendrier de l'Avent"

function useDocumentTitle(pageTitle) {
  const { branding } = useTheme() ?? {}
  const siteName = branding?.platformName || DEFAULT_SITE_NAME

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · ${siteName}` : siteName
  }, [pageTitle, siteName])
}

export default useDocumentTitle
