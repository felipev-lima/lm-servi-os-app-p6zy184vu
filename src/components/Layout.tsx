/**
 * Estrutura comum: cabeçalho verde, menu (desktop e celular) e área de conteúdo.
 *
 * O Felipe usa muito no celular, então o menu vira gaveta abaixo de lg e os
 * alvos de toque têm no mínimo 40px.
 */
import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const MENU = [
  { nome: 'Painel', href: '/', icone: LayoutDashboard },
  { nome: 'Clientes', href: '/clientes', icone: Users },
  { nome: 'Lançamentos', href: '/lancamentos', icone: Receipt },
  { nome: 'Orçamentos', href: '/orcamentos', icone: FileText },
  { nome: 'Relatórios', href: '/relatorios', icone: FileSpreadsheet },
]

export default function Layout() {
  const { usuario, sair } = useAuth()
  const local = useLocation()
  const [aberto, setAberto] = useState(false)

  const ativo = (href: string) =>
    href === '/' ? local.pathname === '/' : local.pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0B3D91] to-[#1E6FD9] text-white shadow-md print:hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white text-[#0B3D91] flex items-center justify-center font-black text-base">
              LM
            </div>
            <div className="leading-none">
              <span className="font-black text-sm sm:text-base tracking-tight block">
                LM SERVIÇOS
              </span>
              <span className="text-[9px] text-white/80 tracking-wider uppercase block mt-0.5">
                Gestão
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {MENU.map((m) => {
              const Icone = m.icone
              return (
                <Link
                  key={m.href}
                  to={m.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    ativo(m.href) ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icone className="w-4 h-4" />
                  {m.nome}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">
            <div className="hidden sm:block text-right mr-1">
              <span className="text-[11px] font-bold block leading-tight">
                {usuario?.name || usuario?.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={sair}
              className="text-white hover:bg-white/10 h-8 px-2"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAberto(!aberto)}
              className="md:hidden text-white hover:bg-white/10 h-8 w-8 p-0"
              aria-label="Menu"
            >
              {aberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {aberto && (
          <div className="md:hidden bg-[#0B3D91] border-t border-white/10 px-3 py-2 space-y-1">
            {MENU.map((m) => {
              const Icone = m.icone
              return (
                <Link
                  key={m.href}
                  to={m.href}
                  onClick={() => setAberto(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    ativo(m.href) ? 'bg-white/20 text-white' : 'text-white/80'
                  }`}
                >
                  <Icone className="w-4 h-4" />
                  {m.nome}
                </Link>
              )
            })}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-5 py-4">
        <Outlet />
      </main>

      <footer className="py-3 text-center text-[10px] text-muted-foreground print:hidden">
        LM SERVIÇOS • Gestão de clientes, vendas e faturamento
      </footer>
    </div>
  )
}
