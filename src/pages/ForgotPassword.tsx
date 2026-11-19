import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
import { Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'

export default function ForgotPassword() {
  const { requestPasswordReset, confirmPasswordReset } = useAuth()
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get('token')

  // Se houver token na URL, entra em modo de definir nova senha
  const [isResetMode, setIsResetMode] = useState(!!urlToken)
  const [token, setToken] = useState(urlToken || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccessMessage(
        `E-mail de recuperação enviado com sucesso para ${email}! Verifique sua caixa de entrada ou spam e clique no link recebido.`,
      )
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setError(
        errorObj?.message ||
          'Não foi possível solicitar a recuperação. Verifique o e-mail digitado.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas não conferem. Digite a mesma senha em ambos os campos.')
      return
    }

    setLoading(true)
    try {
      await confirmPasswordReset(token, password, passwordConfirm)
      setSuccessMessage(
        'Sua nova senha foi redefinida com sucesso! Você já pode fazer login no painel.',
      )
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setError(
        errorObj?.message ||
          'Token de recuperação inválido ou expirado. Tente solicitar novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-xl shadow-blue-500/25 mb-3">
            LM
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">LM SERVIÇOS</h1>
          <p className="text-sm text-slate-400 mt-1">Recuperação de Acesso da Equipe</p>
        </div>

        <Card className="border-slate-800 bg-white/95 backdrop-blur shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900">
              {isResetMode ? 'Definir nova senha' : 'Esqueci minha senha'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {isResetMode
                ? 'Insira o token recebido por e-mail e escolha uma senha segura.'
                : 'Informe seu e-mail de colaborador para enviarmos o link de recuperação de acesso.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="mb-4 border-emerald-500/40 bg-emerald-50 text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {!isResetMode ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold">
                    E-mail do colaborador
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@lmservicos.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9 bg-slate-50 border-slate-300 focus:bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                >
                  {loading ? 'Enviando link...' : 'Enviar link de recuperação'}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Já tem o token de redefinição? Clique aqui para definir nova senha
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-slate-700 font-semibold">
                    Token de redefinição recebido
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="token"
                      type="text"
                      placeholder="Cole aqui o token recebido no e-mail"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      className="pl-9 bg-slate-50 border-slate-300 focus:bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-9 bg-slate-50 border-slate-300 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm" className="text-slate-700 font-semibold">
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="passwordConfirm"
                      type="password"
                      placeholder="Repita a nova senha"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                      className="pl-9 bg-slate-50 border-slate-300 focus:bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                >
                  {loading ? 'Redefinindo...' : 'Salvar nova senha'}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetMode(false)}
                    className="text-xs text-slate-600 hover:underline"
                  >
                    Voltar para solicitar novo e-mail
                  </button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="pt-0 flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar para o Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
