import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calculator,
  UploadCloud,
  LogOut,
  Menu,
  X,
  Wrench,
  ShieldCheck,
  ExternalLink,
  UserCog,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/painel', label: 'Painel Geral', icon: LayoutDashboard },
    { to: '/painel/clientes', label: 'Clientes', icon: Users },
    { to: '/painel/ordens-servico', label: 'Ordens de Serviço', icon: FileText },
    { to: '/painel/orcamentos', label: 'Orçamentos', icon: Calculator },
    { to: '/painel/importar', label: 'Importar FL Serviços', icon: UploadCloud },
    { to: '/painel/equipe', label: 'Equipe e Colaboradores', icon: UserCog },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Topbar */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow">
            LM
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide">LM SERVIÇOS</div>
            <div className="text-[10px] text-slate-400">Gestão Integrada (ex-FL)</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:sticky md:top-0 inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-blue-500/20">
                LM
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight tracking-wide text-white">
                  LM SERVIÇOS
                </h1>
                <p className="text-xs text-blue-400 font-medium">Gestão Operacional</p>
              </div>
            </div>
          </div>

          {/* User badge */}
          <div className="p-4 mx-3 my-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-700/60 text-blue-200 flex items-center justify-center font-semibold text-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'LM'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-100">
                {user?.name || 'Equipe LM'}
              </p>
              <p className="text-xs truncate text-slate-400" title={user?.email}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/painel'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <NavLink
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-md transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Site Público
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
              Formulário
            </span>
          </NavLink>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start gap-2 bg-transparent text-red-400 border-red-950/60 hover:bg-red-950/30 hover:text-red-300 hover:border-red-900"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sair do Painel</span>
          </Button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
