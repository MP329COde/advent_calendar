import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import PageMusicPlayer from '../../theme/PageMusicPlayer'
import './About.css'

function About() {
  const { t } = useTranslation()
  useDocumentTitle(t('about.title'))

  return (
    <div className="about">
      <PageMusicPlayer pageKey="about" />
      <h1 className="text-headline-lg">{t('about.title')}</h1>
      <p className="text-body-lg">{t('about.description')}</p>
      <Link to="/" className="about__link">
        {t('about.backHome')}
      </Link>
    </div>
  )
}

export default About
