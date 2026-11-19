import React, { useEffect, useState } from 'react'
import { getTeamMembers, createTeamMember } from '@/services/system'
import type { UserRecord } from '@/types/database'
import {
  UserCog,
  Plus,
  ShieldCheck,
  Mail,
  Calendar,
  Lock,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function TeamPage() {
  const [members, setMembers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog Criar Colaborador
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const data = await getTeamMembers()
      setMembers(data)
    } catch (err) {
      console.error('Erro ao buscar membros da equipe:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (password.length < 8) {
      setErrorMessage('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage('As senhas digitadas não coincidem.')
      return
    }

    setIsSaving(true)
    try {
      const newMember = await createTeamMember({
        name,
        email,
        password,
        passwordConfirm,
      })

      setMembers((prev) => [...prev, newMember])
      setSuccessMessage(
        `Colaborador ${name} criado com sucesso! Ele já pode acessar com o e-mail cadastrado.`,
      )
      setName('')
      setEmail('')
      setPassword('')
      setPasswordConfirm('')
      setTimeout(() => {
        setIsModalOpen(false)
        setSuccessMessage(null)
      }, 1500)
    } catch (err: unknown) {
      const errorObj = err as { message?: string }
      setErrorMessage(
        errorObj?.message ||
          'Erro ao criar conta de colaborador. Verifique se o e-mail já não existe.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Equipe LM SERVIÇOS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Contas de acesso da equipe técnica e administrativa, como o administrador e o
            colaborador maetros.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Colaborador
        </Button>
      </div>

      {/* Grid de Membros */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Carregando colaboradores...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((member) => {
            const isAdmin = member.email === 'felipev.lima1981@gmail.com'
            return (
              <Card
                key={member.id}
                className="border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
                      {member.name ? member.name.slice(0, 2).toUpperCase() : 'LM'}
                    </div>
                    {isAdmin ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
                        Administrador
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-300 text-slate-600">
                        Colaborador
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 mt-3">
                    {member.name || 'Colaborador sem nome'}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-mono">
                    {member.email}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Conta Ativa no Painel
                  </span>
                  <span>{new Date(member.created).toLocaleDateString('pt-BR')}</span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: Adicionar Colaborador */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Cadastrar Colaborador da Equipe
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Crie uma conta de acesso para um membro da equipe (como maetros ou outros técnicos).
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="my-2 border-emerald-500 bg-emerald-50 text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-xs font-semibold">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateMember} className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome do Colaborador *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Oliveira (Técnico)"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">E-mail corporativo *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@lmservicos.com.br"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Senha Provisória *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Confirmar Senha *</Label>
              <Input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repita a senha"
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? 'Cadastrando...' : 'Criar Colaborador'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
