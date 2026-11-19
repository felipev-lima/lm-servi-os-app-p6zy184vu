import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('felipev.lima1981@gmail.com')
  const [password, setPassword] = useState('LMServicos@2025')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirecionar se já logado
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/painel'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/painel'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setError(
        errorObj?.message || 'E-mail ou senha incorretos. Verifique suas credenciais de acesso.',
      )
    } finally {
      setLoading(false)
    }
  }

  const fillQuickAccount = (userEmail: string, userPass: string) => {
    setEmail(userEmail)
    setPassword(userPass)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-xl shadow-blue-500/25 mb-3">
            LM
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">LM SERVIÇOS</h1>
          <p className="text-sm text-slate-400 mt-1">Painel Administrativo da Equipe</p>
        </div>

        <Card className="border-slate-800 bg-white/95 backdrop-blur shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900">Entrar na conta</CardTitle>
            <CardDescription className="text-slate-600">
              Digite suas credenciais corporativas para gerenciar clientes, ordens e orçamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold">
                  E-mail institucional
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@lmservicos.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-slate-50 border-slate-300 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">
                    Senha de acesso
                  </Label>
                  <Link
                    to="/esqueci-senha"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 bg-slate-50 border-slate-300 focus:bg-white"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 shadow-md shadow-blue-600/20"
              >
                {loading ? 'Validando acesso...' : 'Acessar Painel'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            {/* Credenciais de demonstração rápida */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Contas da Equipe Pré-configuradas:
              </p>
              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('felipev.lima1981@gmail.com', 'LMServicos@2025')}
                  className="w-full text-left p-2 rounded-lg bg-blue-50/70 hover:bg-blue-100 border border-blue-200/60 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Felipe Lima (Administrador Inicial)
                    </div>
                    <div className="text-slate-600 font-mono text-[11px]">
                      felipev.lima1981@gmail.com
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-200/80 text-blue-900 font-medium px-2 py-0.5 rounded">
                    Preencher
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickAccount('maetros@lmservicos.com.br', 'Maetros@2025')}
                  className="w-full text-left p-2 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Maetros (Colaborador da Equipe)
                    </div>
                    <div className="text-slate-600 font-mono text-[11px]">
                      maetros@lmservicos.com.br
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-300 text-slate-800 font-medium px-2 py-0.5 rounded">
                    Preencher
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-center text-xs text-slate-500">
            <Link to="/" className="text-slate-500 hover:text-slate-800 hover:underline">
              ← Voltar ao site público / Pedir orçamento
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
