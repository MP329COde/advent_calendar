import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <p className="text-body-sm">
        © {year} Calendrier de l&apos;Avent — un défi par jour, du 1er au 24
        décembre.
      </p>
      <a
        className="site-footer__link text-body-sm"
        href="https://github.com/MP329COde/advent_calendar"
        target="_blank"
        rel="noreferrer"
      >
        <svg className="site-footer__icon" role="presentation" aria-hidden="true">
          <use href="/icons.svg#github-icon"></use>
        </svg>
        Voir le projet sur GitHub
      </a>
    </footer>
  )
}

export default Footer
