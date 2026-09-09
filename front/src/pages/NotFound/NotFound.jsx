import { Link } from 'react-router-dom'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import './NotFound.css'

function NotFound() {
  useDocumentTitle('Page introuvable')

  return (
    <div className="not-found">
      <h1 className="text-headline-lg">Page introuvable</h1>
      <p className="text-body-lg">
        Cette page n&apos;existe pas, ou plus.
      </p>
      <Link to="/" className="not-found__link">
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}

export default NotFound
