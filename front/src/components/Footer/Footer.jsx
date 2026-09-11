import { useTranslation } from 'react-i18next'
import './Footer.css'

function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <p className="text-body-sm">{t('footer.copyright', { year })}</p>
      <a
        className="site-footer__link text-body-sm"
        href="https://github.com/MP329COde/advent_calendar"
        target="_blank"
        rel="noreferrer"
      >
        <svg className="site-footer__icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#github-icon"></use>
        </svg>
        {t('footer.githubLink')}
      </a>
    </footer>
  )
}

export default Footer
