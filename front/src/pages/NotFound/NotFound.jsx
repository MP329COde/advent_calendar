import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import './NotFound.css'

function NotFound() {
  const { t } = useTranslation()
  useDocumentTitle(t('notFound.title'))

  return (
    <div className="not-found">
      <h1 className="text-headline-lg">{t('notFound.title')}</h1>
      <p className="text-body-lg">{t('notFound.message')}</p>
      <Link to="/" className="not-found__link">
        {t('notFound.backHome')}
      </Link>
    </div>
  )
}

export default NotFound
