/**
 * Cadastro / edição de cliente.
 *
 * Dois nomes, como ele pediu:
 *  - Razão social: completa, sai no PDF e no documento
 *  - Apelido: curto, SÓ para busca no CRM, nunca impresso
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obterCliente, salvarCliente } from '@/lib/crm'
import type { Cliente } from '@/types/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Info } from 'lucide-react'
import { toast } from 'sonner'

const VAZIO = {
  name: '',
  nickname: '',
  doc: '',
  doc_type: 'CNPJ' as 'CNPJ' | 'CPF',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  neighborhood: '',
  city: 'Macaé',
  state: 'RJ',
  notes: '',
  active: true,
}

export default function ClienteForm() {
  const { id } = useParams()
  const navegar = useNavigate()
  const editando = Boolean(id)
  const [form, setForm] = useState<any>(VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return
    obterCliente(id)
      .then((c) => setForm({ ...VAZIO, ...c }))
      .catch(() => toast.error('Cliente não encontrado.'))
      .finally(() => setCarregando(false))
  }, [id])

  const set = (campo: string, valor: any) => setForm((f: any) => ({ ...f, [campo]: valor }))

  const salvar = async () => {
    if (!form.name.trim()) {
      toast.error('A razão social é obrigatória.')
      return
    }
    setSalvando(true)
    try {
      const salvo: any = await salvarCliente(
        {
          ...form,
          name: form.name.trim().toUpperCase(),
          nickname: (form.nickname || '').trim().toUpperCase(),
        },
        id,
      )
      toast.success(editando ? 'Cliente atualizado.' : 'Cliente cadastrado.')
      navegar(`/clientes/${salvo.id}`)
    } catch (err: any) {
      const msg = err?.response?.data?.doc
        ? 'Já existe um cliente com esse CNPJ/CPF.'
        : err?.message || 'Não foi possível salvar.'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navegar(-1)} className="h-8 px-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-black tracking-tight">
          {editando ? 'Editar cliente' : 'Novo cliente'}
        </h1>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 flex gap-2">
        <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-900 leading-snug">
          <strong>Razão social</strong> aparece no PDF e no orçamento. <strong>Apelido</strong>{' '}
          serve só para você achar o cliente na busca — nenhum cliente vê.
        </p>
      </div>

      <Card>
        <CardContent className="p-3 space-y-2.5">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              Razão social <span className="text-red-600">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="CONSELHO ESCOLAR DA ESCOLA MUNICIPAL..."
              className="h-9 text-xs uppercase placeholder:normal-case"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              Apelido <span className="font-normal text-muted-foreground">(só para busca)</span>
            </Label>
            <Input
              value={form.nickname}
              onChange={(e) => set('nickname', e.target.value)}
              placeholder="ESCOLA PARQUE"
              className="h-9 text-xs uppercase placeholder:normal-case"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo</Label>
              <select
                value={form.doc_type}
                onChange={(e) => set('doc_type', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="CNPJ">CNPJ</option>
                <option value="CPF">CPF</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-semibold">Documento</Label>
              <Input
                value={form.doc}
                onChange={(e) => set('doc', e.target.value)}
                placeholder="00.000.000/0000-00"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Contato</Label>
              <Input
                value={form.contact_name}
                onChange={(e) => set('contact_name', e.target.value)}
                placeholder="Diretora Grazi"
                className="h-9 text-xs uppercase placeholder:normal-case"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(22) 90000-0000"
                inputMode="tel"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value.toLowerCase())}
              placeholder="escola@email.com"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Endereço</Label>
            <Input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Rua, número"
              className="h-9 text-xs uppercase placeholder:normal-case"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Bairro</Label>
              <Input
                value={form.neighborhood}
                onChange={(e) => set('neighborhood', e.target.value)}
                className="h-9 text-xs uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cidade</Label>
              <Input
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className="h-9 text-xs uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">UF</Label>
              <Input
                value={form.state}
                onChange={(e) => set('state', e.target.value.toUpperCase())}
                maxLength={2}
                className="h-9 text-xs uppercase"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Observações</Label>
            <Input
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Qualquer anotação"
              className="h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={salvar}
        disabled={salvando}
        className="w-full h-10 bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white font-semibold gap-2"
      >
        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {salvando ? 'Salvando...' : 'Salvar cliente'}
      </Button>
    </div>
  )
}
