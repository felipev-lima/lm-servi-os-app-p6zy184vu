import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Painel from '@/pages/Painel'
import Clientes from '@/pages/Clientes'
import ClienteFicha from '@/pages/ClienteFicha'
import ClienteForm from '@/pages/ClienteForm'
import Lancamentos from '@/pages/Lancamentos'
import Orcamentos from '@/pages/Orcamentos'
import Relatorios from '@/pages/Relatorios'
import Configuracoes from '@/pages/Configuracoes'
import NotFound from '@/pages/NotFound'

/** Bloqueia as telas internas para quem não entrou */
function Protegido({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth()
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }
  return usuario ? <>{children}</> : <Navigate to="/login" replace />
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <Protegido>
                <Layout />
              </Protegido>
            }
          >
            <Route path="/" element={<Painel />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/novo" element={<ClienteForm />} />
            <Route path="/clientes/:id" element={<ClienteFicha />} />
            <Route path="/clientes/:id/editar" element={<ClienteForm />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/orcamentos" element={<Orcamentos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
