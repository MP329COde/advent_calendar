import { Route, Routes } from 'react-router-dom'
import './App.css'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import Home from './pages/Home/Home'
import About from './pages/About/About'
import NotFound from './pages/NotFound/NotFound'
import Admin from './pages/Admin/admin'

function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/About" element={<About />} />
          <Route path="/Admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
