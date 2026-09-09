import { useEffect } from 'react'

const SITE_NAME = "Calendrier de l'Avent"

function useDocumentTitle(pageTitle) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · ${SITE_NAME}` : SITE_NAME
  }, [pageTitle])
}

export default useDocumentTitle
