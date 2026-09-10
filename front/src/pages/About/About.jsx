import { Link } from 'react-router-dom'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import PageMusicPlayer from '../../theme/PageMusicPlayer'
import './About.css'

function About() {
  useDocumentTitle('À propos')

  return (
    <div className="about">
      <PageMusicPlayer pageKey="about" />
      <h1 className="text-headline-lg">À propos du calendrier</h1>
      <p className="text-body-lg">
        Chaque jour du 1er au 24 décembre, une nouvelle case se débloque et
        révèle un mini-projet à réaliser. Un défi par jour, pour progresser en
        s&apos;amusant jusqu&apos;à Noël.
      </p>
      <Link to="/" className="about__link">
        Retour au calendrier
      </Link>
    </div>
  )
}

export default About
