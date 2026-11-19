import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, LogIn } from 'lucide-react'

export default function Login() {
  const { usuario, entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to="/" replace />

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email, senha)
    } catch (err: any) {
      setErro(
        err?.status === 400
          ? 'E-mail ou senha incorretos.'
          : err?.message || 'Não foi possível entrar. Tente de novo.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#0B3D91] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg">
            LM
          </div>
          <h1 className="text-xl font-black tracking-tight">LM SERVIÇOS</h1>
          <p className="text-xs text-muted-foreground">Gestão de clientes, vendas e faturamento</p>
        </div>

        <form onSubmit={submeter} className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="h-10 text-sm"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Senha</Label>
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-10 text-sm"
              required
            />
          </div>

          {erro && (
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {erro}
            </p>
          )}

          <Button
            type="submit"
            disabled={enviando}
            className="w-full h-10 bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white font-semibold gap-2"
          >
            {enviando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {enviando ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
