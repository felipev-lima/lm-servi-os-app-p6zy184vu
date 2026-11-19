/**
 * Ficha do cliente — cadastro, histórico completo e saldo.
 *
 * O histórico mostra a razão social completa; o título usa o apelido. É onde
 * o Felipe consulta "quanto essa escola me deve" antes de atender.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { obterCliente, listarLancamentos, apagarLancamento } from '@/lib/crm'
import { brl, dataBR, totalDaLinha, TIPOS, type Cliente, type Lancamento } from '@/types/crm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Phone, Mail, MapPin, User, Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

export default function ClienteFicha() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = async () => {
    if (!id) return
    setCarregando(true)
    try {
      const [c, lcs] = await Promise.all([obterCliente(id), listarLancamentos({ clienteId: id })])
      setCliente(c)
      setLancamentos(lcs)
    } catch {
      toast.error('Cliente não encontrado.')
      navegar('/clientes')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const excluir = async (l: Lancamento) => {
    if (!confirm(`Excluir o lançamento "${l.description}"?\n\nEssa ação não pode ser desfeita.`))
      return
    try {
      await apagarLancamento(l.id)
      toast.success('Lançamento excluído.')
      void carregar()
    } catch {
      toast.error('Não foi possível excluir.')
    }
  }

  if (carregando || !cliente) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
      </div>
    )
  }

  const soma = (tipo: string) =>
    lancamentos
      .filter((l) => l.kind === tipo)
      .reduce(
        (s, l) =>
          s + Math.abs(totalDaLinha({ ...l, kind: tipo === 'DINHEIRO' ? 'CAPITAL' : l.kind })),
        0,
      )
  const capital = lancamentos
    .filter((l) => l.kind === 'CAPITAL')
    .reduce((s, l) => s + totalDaLinha(l), 0)
  const consumo = lancamentos
    .filter((l) => l.kind === 'CONSUMO')
    .reduce((s, l) => s + totalDaLinha(l), 0)
  const servico = lancamentos
    .filter((l) => l.kind === 'SERVICO')
    .reduce((s, l) => s + totalDaLinha(l), 0)
  // o dinheiro já vem negativo quando abate; soma direto
  const dinheiro = lancamentos
    .filter((l) => l.kind === 'DINHEIRO')
    .reduce((s, l) => s + totalDaLinha(l), 0)
  const saldoFinal = capital + consumo + servico + dinheiro

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navegar('/clientes')} className="h-8 px-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-black tracking-tight truncate">
            {cliente.nickname || cliente.name}
          </h1>
          {cliente.nickname && (
            <p className="text-[10px] text-muted-foreground truncate">{cliente.name}</p>
          )}
        </div>
        <Button
          asChild
          size="sm"
          className="h-8 bg-[#0F6A3A] hover:bg-[#0F6A3A]/90 text-white gap-1 shrink-0"
        >
          <Link to={`/lancamentos?cliente=${cliente.id}&novo=1`}>
            <Plus className="w-3.5 h-3.5" /> Lançar
          </Link>
        </Button>
      </div>

      {/* saldo e divisões */}
      <Card>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Saldo em aberto
            </span>
            <span
              className={`text-xl font-black font-mono ${
                saldoFinal > 0.005
                  ? 'text-amber-700'
                  : saldoFinal < -0.005
                    ? 'text-emerald-700'
                    : 'text-slate-400'
              }`}
            >
              {brl(saldoFinal)}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1 border-t">
            {[
              ['Capital', capital],
              ['Consumo', consumo],
              ['Serviço', servico],
              ['Dinheiro', dinheiro],
            ].map(([rot, val]) => (
              <div key={rot as string}>
                <span className="text-[8px] uppercase text-muted-foreground block">{rot}</span>
                <span className="text-[10px] font-bold font-mono">{brl(val as number)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* contato */}
      <Card>
        <CardContent className="p-3 space-y-1 text-[11px]">
          {cliente.contact_name && (
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-muted-foreground shrink-0" /> {cliente.contact_name}
            </div>
          )}
          {cliente.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
              <a href={`tel:${cliente.phone}`} className="text-[#0F6A3A] underline">
                {cliente.phone}
              </a>
            </div>
          )}
          {cliente.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-muted-foreground shrink-0" /> {cliente.email}
            </div>
          )}
          {cliente.address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
              <span>
                {cliente.address}
                {cliente.city ? ` — ${cliente.city}` : ''}
              </span>
            </div>
          )}
          {cliente.doc && (
            <p className="text-[10px] text-muted-foreground pt-1 border-t">
              {cliente.doc_type || 'CNPJ'}: {cliente.doc}
            </p>
          )}
          {!cliente.phone && !cliente.contact_name && (
            <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-1.5">
              Sem telefone nem contato cadastrado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* histórico */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Histórico ({lancamentos.length})</h2>
      </div>

      <div className="space-y-1.5">
        {lancamentos.map((l) => {
          const t = TIPOS[l.kind]
          const v = totalDaLinha(l)
          return (
            <Card key={l.id}>
              <CardContent className="p-2.5">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={`text-[8px] px-1.5 py-0 border ${t.cor} ${t.bg}`}>
                        {t.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{dataBR(l.date)}</span>
                    </div>
                    <p className="text-[11px] font-medium mt-0.5 break-words">{l.description}</p>
                    {l.details && <p className="text-[9px] text-muted-foreground">{l.details}</p>}
                    <p className="text-[9px] text-muted-foreground">
                      {Number(l.quantity ?? 0)} × {brl(Number(l.unit_price ?? 0))}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-xs font-bold block ${
                        v < 0 ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {brl(v)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => excluir(l)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                      aria-label="Excluir lançamento"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {lancamentos.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed rounded-xl">
            <p className="text-xs text-muted-foreground">
              Nenhum lançamento. Use <strong>Lançar</strong> para registrar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
