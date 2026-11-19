import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'

// Páginas Públicas
import Index from './pages/Index'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import NotFound from './pages/NotFound'

// Páginas do Painel
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import WorkOrders from './pages/WorkOrders'
import WorkOrderDetail from './pages/WorkOrderDetail'
import Quotes from './pages/Quotes'
import ImportData from './pages/ImportData'
import Team from './pages/Team'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />

          {/* Rotas Autenticadas do Painel */}
          <Route
            path="/painel"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/clientes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Clients />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/ordens-servico"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WorkOrders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/ordens-servico/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WorkOrderDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/orcamentos"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Quotes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/importar"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ImportData />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel/equipe"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Team />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
