/**
 * Lançamentos — a tela do dia a dia.
 *
 * É a linha da planilha do Felipe, sem a planilha: escolhe o cliente, o tipo
 * (capital/consumo/serviço/dinheiro), descreve, quantidade e valor. O total
 * aparece sozinho.
 *
 * Diferente da planilha:
 *  - o pagamento (DINHEIRO) é digitado POSITIVO e o sistema inverte
 *    (esquecer o sinal negativo era uma das fontes de erro);
 *  - o total nunca é digitado, sempre calculado;
 *  - a data é data de verdade, não texto.
 */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  listarClientes,
  listarLancamentos,
  salvarLancamento,
  apagarLancamento,
  marcarEnvio,
} from '@/lib/crm'
import {
  brl,
  dataBR,
  totalDaLinha,
  TIPOS,
  type Cliente,
  type Lancamento,
  type TipoLancamento,
} from '@/types/crm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Search,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  Circle,
  Send,
  Clock3,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

export default function Lancamentos() {
  const [params, setParams] = useSearchParams()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')
  const [filtroEnvio, setFiltroEnvio] = useState<string>('TODOS')

  // formulário
  const [aberto, setAberto] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [tipo, setTipo] = useState<TipoLancamento>('SERVICO')
  const [itemType, setItemType] = useState<'PRODUTO' | 'SERVICO'>('SERVICO')
  const [descricao, setDescricao] = useState('')
  const [detalhes, setDetalhes] = useState('')
  const [qtd, setQtd] = useState('1')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [osRef, setOsRef] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [cs, ls] = await Promise.all([listarClientes(), listarLancamentos()])
      setClientes(cs)
      setLancamentos(ls)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  // abre o formulário quando vem do painel/ficha (?novo=1)
  useEffect(() => {
    if (params.get('novo') === '1') {
      setAberto(true)
      const c = params.get('cliente')
      if (c) {
        setClienteId(c)
        const alvo = clientes.find((x) => x.id === c)
        if (alvo) setBuscaCliente(alvo.nickname || alvo.name)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, clientes])

  const total = useMemo(() => {
    const q = Number(qtd) || 0
    const u = Number(valor.replace(',', '.')) || 0
    const bruto = q * u
    return tipo === 'DINHEIRO' ? -Math.abs(bruto) : bruto
  }, [qtd, valor, tipo])

  const clientesFiltrados = useMemo(() => {
    const t = buscaCliente.trim().toLowerCase()
    if (!t) return clientes.slice(0, 6)
    return clientes
      .filter(
        (c) =>
          (c.nickname || '').toLowerCase().includes(t) ||
          c.name.toLowerCase().includes(t) ||
          (c.doc || '').includes(t),
      )
      .slice(0, 6)
  }, [clientes, buscaCliente])

  const limparForm = () => {
    setClienteId('')
    setBuscaCliente('')
    setTipo('SERVICO')
    setItemType('SERVICO')
    setDescricao('')
    setDetalhes('')
    setQtd('1')
    setValor('')
    setOsRef('')
    setData(new Date().toISOString().slice(0, 10))
  }

  const salvar = async () => {
    if (!clienteId) {
      toast.error('Escolha o cliente.')
      return
    }
    if (!descricao.trim()) {
      toast.error('Descreva o que foi feito ou vendido.')
      return
    }
    setSalvando(true)
    try {
      await salvarLancamento({
        client: clienteId,
        date: `${data} 12:00:00.000Z`,
        kind: tipo,
        item_type: itemType,
        description: descricao.trim(),
        details: detalhes.trim(),
        quantity: Number(qtd) || 0,
        unit_price: Math.abs(Number(valor.replace(',', '.')) || 0),
        work_order_ref: osRef.trim(),
        sent_to_finance: 'PENDENTE',
      })
      toast.success('Lançamento registrado.')
      setAberto(false)
      limparForm()
      const p = new URLSearchParams(params)
      p.delete('novo')
      p.delete('cliente')
      setParams(p, { replace: true })
      void carregar()
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (l: Lancamento) => {
    if (!confirm(`Excluir "${l.description}"?`)) return
    try {
      await apagarLancamento(l.id)
      toast.success('Excluído.')
      void carregar()
    } catch {
      toast.error('Não foi possível excluir.')
    }
  }

  const marcar = async (l: Lancamento, situacao: 'PENDENTE' | 'ENVIADA') => {
    await marcarEnvio([l.id], situacao)
    void carregar()
  }

  const filtrados = lancamentos.filter((l) => {
    if (filtroTipo !== 'TODOS' && l.kind !== filtroTipo) return false
    const envio = l.sent_to_finance || 'PENDENTE'
    if (filtroEnvio !== 'TODOS' && envio !== filtroEnvio) return false
    const t = busca.trim().toLowerCase()
    if (!t) return true
    const nome = (l.expand?.client?.nickname || l.expand?.client?.name || '').toLowerCase()
    return nome.includes(t) || l.description.toLowerCase().includes(t)
  })

  const somaFiltrada = filtrados.reduce((s, l) => s + totalDaLinha(l), 0)
  const pendentes = lancamentos.filter(
    (l) => (l.sent_to_finance || 'PENDENTE') === 'PENDENTE',
  ).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Lançamentos</h1>
          <p className="text-[11px] text-muted-foreground">
            {lancamentos.length} registros · {pendentes} a enviar ao financeiro
          </p>
        </div>
        <Button
          onClick={() => setAberto(true)}
          className="bg-[#0F6A3A] hover:bg-[#0F6A3A]/90 text-white font-semibold h-9 gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Lançar
        </Button>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente ou descrição..."
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={filtroTipo === 'TODOS' ? 'default' : 'outline'}
            onClick={() => setFiltroTipo('TODOS')}
            className={`h-7 text-[10px] ${filtroTipo === 'TODOS' ? 'bg-slate-900 text-white' : ''}`}
          >
            Todos
          </Button>
          {(['CAPITAL', 'CONSUMO', 'SERVICO', 'DINHEIRO'] as TipoLancamento[]).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={filtroTipo === k ? 'default' : 'outline'}
              onClick={() => setFiltroTipo(k)}
              className={`h-7 text-[10px] ${filtroTipo === k ? 'bg-slate-900 text-white' : ''}`}
            >
              {TIPOS[k].label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filtroEnvio === 'TODOS' ? 'default' : 'outline'}
            onClick={() => setFiltroEnvio('TODOS')}
            className={`h-7 text-[10px] ${filtroEnvio === 'TODOS' ? 'bg-slate-900 text-white' : ''}`}
          >
            <Filter className="w-3 h-3" /> Envio: todos
          </Button>
          <Button
            size="sm"
            variant={filtroEnvio === 'PENDENTE' ? 'default' : 'outline'}
            onClick={() => setFiltroEnvio('PENDENTE')}
            className={`h-7 text-[10px] gap-1 ${filtroEnvio === 'PENDENTE' ? 'bg-amber-600 text-white' : 'text-amber-700'}`}
          >
            <Clock3 className="w-3 h-3" /> Faltam enviar ({pendentes})
          </Button>
          <Button
            size="sm"
            variant={filtroEnvio === 'ENVIADA' ? 'default' : 'outline'}
            onClick={() => setFiltroEnvio('ENVIADA')}
            className={`h-7 text-[10px] gap-1 ${filtroEnvio === 'ENVIADA' ? 'bg-emerald-700 text-white' : 'text-emerald-700'}`}
          >
            <CheckCircle2 className="w-3 h-3" /> Enviados ({lancamentos.length - pendentes})
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] px-1">
        <span className="font-semibold">{filtrados.length} lançamento(s)</span>
        <span className="font-mono font-bold text-[#0F6A3A]">Total: {brl(somaFiltrada)}</span>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtrados.map((l) => {
            const t = TIPOS[l.kind]
            const v = totalDaLinha(l)
            const enviado = (l.sent_to_finance || 'PENDENTE') === 'ENVIADA'
            return (
              <Card key={l.id}>
                <CardContent className="p-2.5 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={`text-[8px] px-1.5 py-0 border ${t.cor} ${t.bg}`}>
                          {t.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{dataBR(l.date)}</span>
                        {enviado ? (
                          <Badge className="text-[8px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-300">
                            ENVIADO
                          </Badge>
                        ) : (
                          <Badge className="text-[8px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-300">
                            PENDENTE
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-bold mt-0.5 truncate">
                        {l.expand?.client?.nickname || l.expand?.client?.name || 'Cliente'}
                      </p>
                      <p className="text-[10px] break-words">{l.description}</p>
                      {l.details && <p className="text-[9px] text-muted-foreground">{l.details}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-xs font-bold block ${
                          v < 0 ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        {brl(v)}
                      </span>
                      <span className="text-[9px] text-muted-foreground block">
                        {Number(l.quantity ?? 0)} × {brl(Number(l.unit_price ?? 0))}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 pt-1 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => marcar(l, enviado ? 'PENDENTE' : 'ENVIADA')}
                      className={`h-6 text-[9px] flex-1 gap-1 ${
                        enviado ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {enviado ? (
                        <>
                          <Clock3 className="w-2.5 h-2.5" /> Marcar pendente
                        </>
                      ) : (
                        <>
                          <Send className="w-2.5 h-2.5" /> Marcar enviado
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => excluir(l)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filtrados.length === 0 && (
            <div className="p-10 text-center border-2 border-dashed rounded-xl">
              <p className="text-sm font-semibold">Nenhum lançamento</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Ajuste os filtros ou registre um novo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------- formulário ------- */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md w-[92vw] max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Novo lançamento</DialogTitle>
            <DialogDescription className="text-[11px]">
              O total é calculado sozinho. No pagamento, digite o valor positivo — o sistema abate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cliente</Label>
              <Input
                value={buscaCliente}
                onChange={(e) => {
                  setBuscaCliente(e.target.value)
                  setClienteId('')
                }}
                placeholder="Digite o apelido ou a razão social..."
                className="h-9 text-xs"
              />
              {!clienteId && buscaCliente && (
                <div className="border rounded-md divide-y max-h-32 overflow-y-auto">
                  {clientesFiltrados.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClienteId(c.id)
                        setBuscaCliente(c.nickname || c.name)
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-[#0F6A3A]/5"
                    >
                      <span className="text-[11px] font-semibold block">
                        {c.nickname || c.name}
                      </span>
                      {c.nickname && (
                        <span className="text-[9px] text-muted-foreground block">{c.name}</span>
                      )}
                    </button>
                  ))}
                  {clientesFiltrados.length === 0 && (
                    <p className="px-2 py-2 text-[10px] text-muted-foreground">
                      Nenhum cliente com esse nome.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo</Label>
              <div className="grid grid-cols-2 gap-1">
                {(['CAPITAL', 'CONSUMO', 'SERVICO', 'DINHEIRO'] as TipoLancamento[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setTipo(k)
                      setItemType(k === 'SERVICO' || k === 'DINHEIRO' ? 'SERVICO' : 'PRODUTO')
                    }}
                    className={`text-[10px] px-2 py-2 rounded-md border font-semibold ${
                      tipo === k
                        ? 'bg-[#0F6A3A] text-white border-[#0F6A3A]'
                        : 'bg-white hover:border-[#0F6A3A]/50'
                    }`}
                  >
                    {TIPOS[k].label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground">{TIPOS[tipo].descricao}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descrição</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={tipo === 'DINHEIRO' ? 'Pagamento recebido' : 'Câmera dome 4MP'}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Descrição detalhada{' '}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                placeholder="Detalhe para o histórico"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Quantidade</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor unitário</Label>
                <Input
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data</Label>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  OS <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  value={osRef}
                  onChange={(e) => setOsRef(e.target.value)}
                  placeholder="nº da OS"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg bg-[#0F6A3A]/5 border border-[#0F6A3A]/20 p-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold">Total do lançamento</span>
              <span
                className={`font-mono text-sm font-black ${
                  total < 0 ? 'text-emerald-700' : 'text-[#0F6A3A]'
                }`}
              >
                {brl(total)}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAberto(false)}
              className="h-9 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              disabled={salvando}
              className="h-9 text-xs bg-[#0F6A3A] hover:bg-[#0F6A3A]/90 text-white font-semibold gap-1.5"
            >
              {salvando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {salvando ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
