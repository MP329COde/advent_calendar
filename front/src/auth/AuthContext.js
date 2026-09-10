import { createContext } from 'react'

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
})

export default AuthContext
