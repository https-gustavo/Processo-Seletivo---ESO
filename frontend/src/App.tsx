import { Route, Routes, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import TopBar from './components/TopBar'

const PaginaCosmeticos = lazy(() => import('./pages/PaginaCosmeticos'))
const DetalheCosmetico = lazy(() => import('./pages/DetalheCosmetico'))
const PaginaLogin = lazy(() => import('./pages/PaginaLogin'))
const PaginaCadastro = lazy(() => import('./pages/PaginaCadastro'))
const MinhasCompras = lazy(() => import('./pages/MinhasCompras'))
const PaginaInicial = lazy(() => import('./pages/PaginaInicial'))
const PerfilPage = lazy(() => import('./pages/Perfil'))
const UsuariosPage = lazy(() => import('./pages/Usuarios'))
const PerfilPublicoPage = lazy(() => import('./pages/PerfilPublico'))

export default function App() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  return (
    <div className={`container theme-ftv ${isLogin ? 'login-container' : ''}`}>
      <TopBar />
      <div className="page-shell">
        <Suspense fallback={<div className="page-loading" role="status" aria-live="polite">Carregando...</div>}>
          <Routes>
            <Route path="/" element={<PaginaInicial />} />
            <Route path="/home" element={<PaginaInicial />} />
            <Route path="/cosmetics" element={<PaginaCosmeticos />} />
            <Route path="/cosmetics/:id" element={<DetalheCosmetico />} />
            <Route path="/login" element={<PaginaLogin />} />
            <Route path="/register" element={<PaginaCadastro />} />
            <Route path="/me/purchases" element={<MinhasCompras />} />
            <Route path="/me" element={<PerfilPage />} />
            <Route path="/users" element={<UsuariosPage />} />
            <Route path="/users/:id" element={<PerfilPublicoPage />} />
          </Routes>
        </Suspense>
      </div>
      <footer className="footer" aria-label="Rodapé do site">
        <span className="copyright">Copyright © {new Date().getFullYear()} <a href="https://github.com/https-gustavo" target="_blank" rel="noopener noreferrer">Gustavo Menezes</a>. Todos os direitos reservados.</span>
      </footer>
    </div>
  )
}
