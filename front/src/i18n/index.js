import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const STORAGE_KEY = 'preferred-language'

// Choix explicite uniquement (localStorage) : pas de détection automatique
// via la langue du navigateur, pour un rendu par défaut stable et
// prévisible (français) — notamment pour les tests e2e.
const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: storedLanguage === 'en' ? 'en' : 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
})

export function setLanguage(lang) {
  i18n.changeLanguage(lang)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang)
  }
}

export default i18n
