import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import Home from './pages/Home/Home'
import About from './pages/About/About'
import NotFound from './pages/NotFound/NotFound'
import Admin from './pages/Admin/Admin'
import Setup from './pages/Setup/Setup'
import ThemeProvider from './theme/ThemeProvider'
import BackgroundVideo from './theme/BackgroundVideo'
import EffectsLayer from './theme/EffectsLayer'
import AuthProvider from './auth/AuthProvider'

function App() {
  const [setupStatus, setSetupStatus] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/setup')
      .then((res) => {
        if (!res.ok) throw new Error('Impossible de vérifier la configuration')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setSetupStatus(data)
      })
      .catch(() => {
        if (!cancelled) setSetupStatus({ isCompleted: true })
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (setupStatus === null) {
    return null
  }

  if (!setupStatus.isCompleted) {
    return (
      <Routes>
        <Route
          path="/setup"
          element={<Setup onSetupComplete={(data) => setSetupStatus(data)} />}
        />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    )
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <BackgroundVideo />
        <EffectsLayer />
        <ScrollToTop />
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/About" element={<About />} />
            <Route path="/Admin" element={<Admin />} />
            <Route path="/setup" element={<Navigate to="/Admin" replace />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
