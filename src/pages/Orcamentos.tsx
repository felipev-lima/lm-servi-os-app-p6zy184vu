/**
 * Orçamentos e pedidos.
 *
 * O caminho que o Felipe descreveu:
 *   ORÇAMENTO → PEDIDO → ENTREGUE → FATURADO
 *
 * Cada documento guarda os itens com o MESMO formato da planilha dele:
 * data, tipo (capital/consumo/serviço/dinheiro), produto ou serviço,
 * nome, quantidade, valor unitário e valor total.
 */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  listarClientes,
  listarProdutos,
  listarOrcamentos,
  salvarOrcamento,
  apagarOrcamento,
  marcarEnvio,
  salvarProduto,
  limparCacheProdutos,
} from '@/lib/crm'
import {
  brl,
  dataBR,
  TIPOS,
  type Cliente,
  type Produto,
  type Orcamento,
  type ItemOrcamento,
  type TipoLancamento,
  type StatusOrcamento,
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
  FileText,
  Plus,
  Loader2,
  Trash2,
  Search,
  CheckCircle2,
  ArrowRight,
  Package,
  Truck,
  Receipt,
} from 'lucide-react'
import { toast } from 'sonner'

const FLUXO: { valor: StatusOrcamento; label: string; icone: any; cor: string }[] = [
  {
    valor: 'ORCAMENTO',
    label: 'Orçamento',
    icone: FileText,
    cor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    valor: 'PEDIDO',
    label: 'Pedido',
    icone: Package,
    cor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    valor: 'ENTREGUE',
    label: 'Entregue',
    icone: Truck,
    cor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    valor: 'FATURADO',
    label: 'Faturado',
    icone: Receipt,
    cor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
]

export default function Orcamentos() {
  const [params, setParams] = useSearchParams()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [docs, setDocs] = useState<Orcamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS')
  const [busca, setBusca] = useState('')

  // formulário
  const [aberto, setAberto] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [itens, setItens] = useState<ItemOrcamento[]>([])
  const [buscaProduto, setBuscaProduto] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [cs, ps, os] = await Promise.all([
        listarClientes(),
        listarProdutos(),
        listarOrcamentos(),
      ])
      setClientes(cs)
      setProdutos(ps)
      setDocs(os)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

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

  const clientesFiltrados = useMemo(() => {
    const t = buscaCliente.trim().toLowerCase()
    if (!t) return clientes.slice(0, 5)
    return clientes
      .filter(
        (c) =>
          (c.nickname || '').toLowerCase().includes(t) ||
          c.name.toLowerCase().includes(t) ||
          (c.doc || '').includes(t),
      )
      .slice(0, 5)
  }, [clientes, buscaCliente])

  /**
   * Filtro do catálogo.
   *
   * Compara SEM acento e SEM diferenciar maiúscula: o catálogo é digitado em
   * MAIÚSCULA COM acento ("CÂMERA BULLET") e o Felipe digita "camera". Sem
   * tirar o acento, a busca devolvia zero — que era o defeito relatado.
   */
  const produtosFiltrados = useMemo(() => {
    const normalizar = (s: string) =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    const t = normalizar(buscaProduto.trim())
    if (t.length < 2) return []
    return produtos
      .filter(
        (p) =>
          normalizar(p.name).includes(t) ||
          normalizar(p.category || '').includes(t) ||
          normalizar(p.brand || '').includes(t),
      )
      .slice(0, 8)
  }, [produtos, buscaProduto])

  const total = itens.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)

  const adicionarProduto = (p: Produto) => {
    setItens((prev) => [
      ...prev,
      {
        description: p.name,
        quantity: 1,
        // preço de tabela vem preenchido, mas o campo fica editável
        unit_price: Number(p.price || 0),
        // classificação vem pronta do cadastro (capital/consumo/serviço)
        kind: (p.default_kind || 'CONSUMO') as TipoLancamento,
        unit: p.unit || 'UN',
        product_id: p.id,
      },
    ])
    setBuscaProduto('')
  }

  /**
   * Grava no CADASTRO a classificação corrigida e/ou o preço novo.
   * Chamado quando o Felipe altera o tipo ou o preço de um item do orçamento
   * e responde "sim" na pergunta.
   */
  const gravarNoCadastro = async (item: any) => {
    if (!item.product_id) return
    try {
      await salvarProduto(
        { default_kind: item.kind, price: Number(item.unit_price) } as any,
        item.product_id,
      )
      limparCacheProdutos()
      toast.success('Cadastro do produto atualizado.')
    } catch {
      toast.error('Não foi possível atualizar o cadastro.')
    }
  }

  const adicionarLinhaVazia = () => {
    setItens((prev) => [
      ...prev,
      { description: '', quantity: 1, unit_price: 0, kind: 'SERVICO' as TipoLancamento },
    ])
  }

  /**
   * Ao mudar o TIPO ou o PREÇO de um produto que veio do cadastro, pergunta se
   * a correção vale só para este orçamento ou se atualiza a carteira.
   *
   * É o pedido do Felipe: "posso me perguntar se eu quero manter somente neste
   * orçamento, como preço especial, ou se quero salvar na planilha".
   */
  const alterarItem = (i: number, campo: string, valor: any) => {
    setItens((prev) => prev.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)))

    const item = itens[i]
    if (!item?.product_id) return
    if (campo !== 'kind' && campo !== 'unit_price') return

    const atualizado = { ...item, [campo]: valor }
    const rotulo =
      campo === 'kind'
        ? `o tipo para ${TIPOS[valor as TipoLancamento]?.label || valor}`
        : `o preço para ${brl(Number(valor) || 0)}`

    // pergunta só depois do React atualizar o estado do item
    setTimeout(() => {
      const gravar = confirm(
        `Você mudou ${rotulo}.\n\n` +
          `OK = atualizar também o CADASTRO do produto (vale para os próximos orçamentos)\n` +
          `Cancelar = usar só neste orçamento`,
      )
      if (gravar) void gravarNoCadastro(atualizado)
    }, 120)
  }

  const removerItem = (i: number) => setItens((prev) => prev.filter((_, j) => j !== i))

  const salvar = async () => {
    if (!clienteId) {
      toast.error('Escolha o cliente.')
      return
    }
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return
    }
    setSalvando(true)
    try {
      await salvarOrcamento({
        client: clienteId,
        date: new Date().toISOString(),
        items: itens,
        status: 'ORCAMENTO',
        payment_terms: 'A combinar / Conforme contrato',
        delivery_terms: 'Imediato / Agendado',
        validity_days: 15,
      } as any)
      toast.success('Orçamento criado.')
      setAberto(false)
      setItens([])
      setClienteId('')
      setBuscaCliente('')
      setParams(new URLSearchParams(), { replace: true })
      void carregar()
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const avancar = async (doc: Orcamento) => {
    const ordem: StatusOrcamento[] = ['ORCAMENTO', 'PEDIDO', 'ENTREGUE', 'FATURADO']
    const atual = doc.status || 'ORCAMENTO'
    const prox = ordem[ordem.indexOf(atual) + 1]
    if (!prox) return
    const dados: any = { status: prox }
    if (prox === 'ENTREGUE') dados.delivered_at = new Date().toISOString()
    if (prox === 'FATURADO') dados.invoiced_at = new Date().toISOString()
    await salvarOrcamento(dados, doc.id)
    toast.success(`Agora está como ${FLUXO.find((f) => f.valor === prox)?.label}.`)
    void carregar()
  }

  const excluir = async (doc: Orcamento) => {
    if (!confirm('Excluir este documento?')) return
    await apagarOrcamento(doc.id)
    toast.success('Excluído.')
    void carregar()
  }

  const filtrados = docs.filter((d) => {
    if (filtroStatus !== 'TODOS' && (d.status || 'ORCAMENTO') !== filtroStatus) return false
    const t = busca.trim().toLowerCase()
    if (!t) return true
    const nome = (d.expand?.client?.nickname || d.expand?.client?.name || '').toLowerCase()
    return nome.includes(t)
  })

  const totalItensDoc = (d: Orcamento) =>
    (d.items || []).reduce(
      (s: number, i: any) => s + Number(i.quantity || 0) * Number(i.unit_price || 0),
      0,
    )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Orçamentos e Pedidos</h1>
          <p className="text-[11px] text-muted-foreground">
            Orçamento → Pedido → Entregue → Faturado
          </p>
        </div>
        <Button
          onClick={() => setAberto(true)}
          className="bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white font-semibold h-9 gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Button
          size="sm"
          variant={filtroStatus === 'TODOS' ? 'default' : 'outline'}
          onClick={() => setFiltroStatus('TODOS')}
          className={`h-7 text-[10px] ${filtroStatus === 'TODOS' ? 'bg-slate-900 text-white' : ''}`}
        >
          Todos ({docs.length})
        </Button>
        {FLUXO.map((f) => {
          const n = docs.filter((d) => (d.status || 'ORCAMENTO') === f.valor).length
          return (
            <Button
              key={f.valor}
              size="sm"
              variant={filtroStatus === f.valor ? 'default' : 'outline'}
              onClick={() => setFiltroStatus(f.valor)}
              className={`h-7 text-[10px] ${filtroStatus === f.valor ? 'bg-slate-900 text-white' : ''}`}
            >
              {f.label} ({n})
            </Button>
          )
        })}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente..."
          className="pl-9 h-9 text-xs"
        />
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtrados.map((d) => {
            const st = FLUXO.find((f) => f.valor === (d.status || 'ORCAMENTO')) || FLUXO[0]
            const Icone = st.icone
            const podeAvancar = (d.status || 'ORCAMENTO') !== 'FATURADO'
            return (
              <Card key={d.id}>
                <CardContent className="p-2.5 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={`text-[8px] px-1.5 py-0 border gap-0.5 ${st.cor}`}>
                          <Icone className="w-2.5 h-2.5" /> {st.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {dataBR(d.date || d.created)}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold mt-0.5 truncate">
                        {d.expand?.client?.nickname || d.expand?.client?.name || 'Cliente'}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {(d.items || []).length} item(ns)
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#0B3D91] shrink-0">
                      {brl(totalItensDoc(d))}
                    </span>
                  </div>

                  <div className="flex gap-1 pt-1 border-t">
                    {podeAvancar && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => avancar(d)}
                        className="h-6 text-[9px] flex-1 gap-1 text-[#0B3D91]"
                      >
                        <ArrowRight className="w-2.5 h-2.5" />
                        Marcar como{' '}
                        {FLUXO[FLUXO.findIndex((f) => f.valor === (d.status || 'ORCAMENTO')) + 1]
                          ?.label || ''}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => excluir(d)}
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
              <FileText className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold">Nenhum documento</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Crie um orçamento para começar o processo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------- NOVO ORÇAMENTO ---------- */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Novo orçamento</DialogTitle>
            <DialogDescription className="text-[11px]">
              Busque o produto na carteira — preço e unidade vêm preenchidos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cliente</Label>
              <Input
                value={buscaCliente}
                onChange={(e) => {
                  setBuscaCliente(e.target.value)
                  setClienteId('')
                }}
                placeholder="Apelido, razão social ou CNPJ..."
                className="h-9 text-xs"
              />
              {!clienteId && buscaCliente && (
                <div className="border rounded-md divide-y max-h-28 overflow-y-auto">
                  {clientesFiltrados.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClienteId(c.id)
                        setBuscaCliente(c.nickname || c.name)
                      }}
                      className="w-full text-left px-2 py-1.5 hover:bg-[#0B3D91]/5"
                    >
                      <span className="text-[11px] font-semibold block">
                        {c.nickname || c.name}
                      </span>
                      {c.nickname && (
                        <span className="text-[9px] text-muted-foreground block">{c.name}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Adicionar produto da carteira</Label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  placeholder="Digite 2 letras: cabo, camera, dvr..."
                  className="pl-8 h-9 text-xs"
                />
              </div>
              {produtosFiltrados.length > 0 && (
                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                  {produtosFiltrados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => adicionarProduto(p)}
                      className="w-full text-left px-2 py-1.5 hover:bg-[#0B3D91]/5 flex items-center gap-1.5"
                    >
                      <Badge
                        className={`text-[7px] px-1 py-0 border shrink-0 ${
                          TIPOS[(p.default_kind || 'CONSUMO') as TipoLancamento].cor
                        } ${TIPOS[(p.default_kind || 'CONSUMO') as TipoLancamento].bg}`}
                      >
                        {TIPOS[(p.default_kind || 'CONSUMO') as TipoLancamento].label}
                      </Badge>
                      <span className="text-[10px] truncate flex-1">{p.name}</span>
                      <span className="text-[10px] font-mono font-bold shrink-0">
                        {brl(Number(p.price || 0))}/{p.unit || 'UN'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Itens ({itens.length})</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={adicionarLinhaVazia}
                  className="h-6 text-[9px] gap-1"
                >
                  <Plus className="w-2.5 h-2.5" /> Linha em branco
                </Button>
              </div>

              {itens.map((it, i) => (
                <div key={i} className="border rounded-md p-2 space-y-1.5 bg-card">
                  <div className="flex gap-1">
                    <Input
                      value={it.description}
                      onChange={(e) => alterarItem(i, 'description', e.target.value)}
                      placeholder="Descrição do item"
                      className="h-8 text-[10px] flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removerItem(i)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 shrink-0"
                      aria-label="Remover item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <select
                      value={it.kind || 'CONSUMO'}
                      onChange={(e) => alterarItem(i, 'kind', e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-1 text-[9px]"
                    >
                      {(['CAPITAL', 'CONSUMO', 'SERVICO'] as TipoLancamento[]).map((k) => (
                        <option key={k} value={k}>
                          {TIPOS[k].label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => alterarItem(i, 'quantity', e.target.value)}
                      placeholder="Qtd"
                      className="h-8 text-[10px]"
                    />
                    <Input
                      inputMode="decimal"
                      value={it.unit_price}
                      onChange={(e) => alterarItem(i, 'unit_price', e.target.value)}
                      placeholder="Unit."
                      className="h-8 text-[10px]"
                    />
                    <div className="h-8 flex items-center justify-end pr-1 text-[10px] font-mono font-bold">
                      {brl(Number(it.quantity || 0) * Number(it.unit_price || 0))}
                    </div>
                  </div>
                </div>
              ))}

              {itens.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                  Busque um produto acima ou adicione uma linha em branco.
                </p>
              )}
            </div>

            <div className="rounded-lg bg-[#0B3D91]/5 border border-[#0B3D91]/20 p-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold">Total do orçamento</span>
              <span className="font-mono text-sm font-black text-[#0B3D91]">{brl(total)}</span>
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
              className="h-9 text-xs bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white font-semibold gap-1.5"
            >
              {salvando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {salvando ? 'Salvando...' : 'Criar orçamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
