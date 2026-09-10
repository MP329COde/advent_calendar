import { createContext } from 'react'

const ThemeContext = createContext({
  branding: null,
  theme: null,
  loading: true,
  refresh: () => {},
})

export default ThemeContext
