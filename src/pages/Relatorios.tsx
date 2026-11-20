/**
 * Relatórios — a visão do cliente no formato da planilha do Felipe.
 *
 * É o pedido central: em vez de abrir PDF por PDF, escolher o cliente e ver
 * TODOS os itens já lançados numa lista com data, tipo, produto/serviço,
 * descrição, quantidade, valor unitário e total — igual à aba da planilha.
 *
 * Também gera o arquivo .xls com o mesmo layout, para ele guardar ou enviar.
 */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listarResumoClientes, listarLancamentos, type ResumoCliente } from '@/lib/crm'
import { brl, dataBR, totalDaLinha, TIPOS, type Lancamento, type TipoLancamento } from '@/types/crm'
import { baixarExcel, type BlocoPlanilha } from '@/lib/exportarPlanilha'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Loader2,
  FileSpreadsheet,
  Printer,
  Users,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'

export default function Relatorios() {
  const [params, setParams] = useSearchParams()
  const [resumos, setResumos] = useState<ResumoCliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(params.get('cliente'))
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [carregandoItens, setCarregandoItens] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setResumos(await listarResumoClientes())
      } finally {
        setCarregando(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!clienteId) return
    setCarregandoItens(true)
    listarLancamentos({ clienteId })
      .then(setLancamentos)
      .finally(() => setCarregandoItens(false))
  }, [clienteId])

  const cliente = resumos.find((r) => r.cliente.id === clienteId)?.cliente

  /** lista filtrada de clientes para escolher */
  const listaClientes = useMemo(() => {
    const normalizar = (s: string) =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    const t = normalizar(busca.trim())
    const base = t
      ? resumos.filter(
          (r) =>
            normalizar(r.cliente.name).includes(t) ||
            normalizar(r.cliente.nickname || '').includes(t) ||
            (r.cliente.doc || '').includes(t),
        )
      : resumos
    return base.sort((a, b) => b.saldo - a.saldo)
  }, [resumos, busca])

  /** linhas no formato da planilha */
  const linhas = useMemo(
    () =>
      lancamentos.map((l) => [
        dataBR(l.date),
        TIPOS[l.kind]?.label || l.kind,
        l.item_type === 'SERVICO' ? 'Serviço' : 'Produto',
        l.description || '',
        l.details || '',
        Number(l.quantity ?? 0),
        Number(l.unit_price ?? 0),
        totalDaLinha(l),
      ]),
    [lancamentos],
  )

  const somaTipo = (k: TipoLancamento) =>
    lancamentos.filter((l) => l.kind === k).reduce((s, l) => s + totalDaLinha(l), 0)

  const capital = somaTipo('CAPITAL')
  const consumo = somaTipo('CONSUMO')
  const servico = somaTipo('SERVICO')
  const dinheiro = somaTipo('DINHEIRO')
  const total = capital + consumo + servico + dinheiro

  const bloco: BlocoPlanilha | null = cliente
    ? {
        titulo: `RELATÓRIO DE LANÇAMENTOS — ${cliente.nickname || cliente.name}`,
        cabecalho: [
          { rotulo: 'CLIENTE:', valor: cliente.name },
          { rotulo: 'CNPJ/CPF:', valor: cliente.doc || '—' },
          { rotulo: 'TELEFONE:', valor: cliente.phone || '—' },
          { rotulo: 'EMITIDO EM:', valor: new Date().toLocaleDateString('pt-BR') },
        ],
        colunas: [
          { titulo: 'DATA', largura: 80, alinhar: 'center' },
          { titulo: 'TIPO', largura: 90, alinhar: 'center' },
          { titulo: 'PRODUTO / SERVIÇO', largura: 110, alinhar: 'center' },
          { titulo: 'DESCRIÇÃO DETALHADA', largura: 320 },
          { titulo: 'OBSERVAÇÃO', largura: 150 },
          { titulo: 'QTD', largura: 55, alinhar: 'right' },
          { titulo: 'VALOR UNIT. (R$)', largura: 105, alinhar: 'right', moeda: true },
          { titulo: 'VALOR TOTAL (R$)', largura: 110, alinhar: 'right', moeda: true },
        ],
        linhas,
        totais: [
          { rotulo: 'SUB TOTAL CAPITAL', valor: capital, cor: '#EDE9FE' },
          { rotulo: 'SUB TOTAL CONSUMO', valor: consumo, cor: '#FEF3C7' },
          { rotulo: 'SUB TOTAL SERVIÇO', valor: servico, cor: '#DBEAFE' },
          { rotulo: 'SUB TOTAL DINHEIRO', valor: dinheiro, cor: '#D1FAE5' },
          { rotulo: 'DÉBITO TOTAL', valor: total, cor: '#0B3D91' },
        ],
      }
    : null

  const exportar = () => {
    if (!bloco || !cliente) return
    const nome = `RELATORIO-${(cliente.nickname || cliente.name)
      .replace(/[^\wÀ-ÿ ]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40)}`
    baixarExcel(nome, [bloco])
  }

  // ---------- lista de clientes ----------
  if (!clienteId) {
    return (
      <div className="space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Relatórios</h1>
          <p className="text-[11px] text-muted-foreground">
            Escolha o cliente e veja todos os itens lançados — no formato da planilha.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente por apelido, razão social ou CNPJ..."
            className="pl-9 h-10 text-sm"
          />
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="space-y-1.5">
            {listaClientes.map((r) => (
              <button
                key={r.cliente.id}
                type="button"
                onClick={() => {
                  setClienteId(r.cliente.id)
                  const p = new URLSearchParams(params)
                  p.set('cliente', r.cliente.id)
                  setParams(p, { replace: true })
                }}
                className="w-full text-left p-2.5 rounded-lg border bg-card hover:border-[#0B3D91]/50 transition flex items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">
                    {r.cliente.nickname || r.cliente.name}
                  </p>
                  {r.cliente.nickname && (
                    <p className="text-[9px] text-muted-foreground truncate">{r.cliente.name}</p>
                  )}
                  <p className="text-[9px] text-muted-foreground">{r.lancamentos} lançamento(s)</p>
                </div>
                <span
                  className={`font-mono text-xs font-bold shrink-0 ${
                    r.saldo > 0.005
                      ? 'text-amber-800'
                      : r.saldo < -0.005
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                  }`}
                >
                  {brl(r.saldo)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}

            {listaClientes.length === 0 && (
              <div className="p-10 text-center border-2 border-dashed rounded-xl">
                <Users className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-semibold">Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ---------- relatório do cliente ----------
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setClienteId(null)
            const p = new URLSearchParams(params)
            p.delete('cliente')
            setParams(p, { replace: true })
          }}
          className="h-8 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-black truncate">
            {cliente?.nickname || cliente?.name || 'Cliente'}
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {lancamentos.length} lançamento(s) · formato da planilha
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 print:hidden">
        <Button
          onClick={exportar}
          disabled={!bloco || lancamentos.length === 0}
          className="h-8 text-[11px] bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white gap-1.5 flex-1"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Baixar Excel
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          disabled={lancamentos.length === 0}
          className="h-8 text-[11px] gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimir
        </Button>
      </div>

      {carregandoItens ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando itens...
        </div>
      ) : lancamentos.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed rounded-xl">
          <FileSpreadsheet className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold">Nenhum lançamento</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Este cliente ainda não tem itens lançados.
          </p>
        </div>
      ) : (
        <>
          {/* resumo das divisões */}
          <Card>
            <CardContent className="p-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                ['CAPITAL', capital],
                ['CONSUMO', consumo],
                ['SERVIÇO', servico],
                ['DINHEIRO', dinheiro],
                ['DÉBITO', total],
              ].map(([rot, val]) => (
                <div key={rot as string}>
                  <span className="text-[8px] uppercase text-muted-foreground block">{rot}</span>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      rot === 'DÉBITO'
                        ? (val as number) > 0
                          ? 'text-amber-800'
                          : 'text-emerald-700'
                        : ''
                    }`}
                  >
                    {brl(val as number)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* tabela no formato da planilha */}
          <Card className="overflow-x-auto">
            <CardContent className="p-0">
              <table className="w-full text-[10px] border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#0B3D91] text-white">
                    {[
                      'DATA',
                      'TIPO',
                      'PRODUTO/SERV.',
                      'DESCRIÇÃO DETALHADA',
                      'QTD',
                      'VALOR UNIT.',
                      'VALOR TOTAL',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`p-1.5 font-bold text-left ${i >= 4 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((l) => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-1.5 whitespace-nowrap">{dataBR(l.date)}</td>
                      <td className="p-1.5">
                        {/* texto colorido em vez de <Badge>: numa lista de 70+
                            itens cada Badge custa 3 elementos no DOM, e o
                            celular sente a diferença */}
                        <span
                          className={`text-[8px] px-1 py-0.5 rounded border font-bold ${
                            TIPOS[l.kind]?.cor
                          } ${TIPOS[l.kind]?.bg}`}
                        >
                          {TIPOS[l.kind]?.label}
                        </span>
                      </td>
                      <td className="p-1.5 text-muted-foreground">
                        {l.item_type === 'SERVICO' ? 'Serviço' : 'Produto'}
                      </td>
                      <td className="p-1.5 max-w-[280px]">{l.description}</td>
                      <td className="p-1.5 text-right font-mono">{Number(l.quantity ?? 0)}</td>
                      <td className="p-1.5 text-right font-mono">
                        {brl(Number(l.unit_price ?? 0))}
                      </td>
                      <td
                        className={`p-1.5 text-right font-mono font-bold ${
                          totalDaLinha(l) < 0 ? 'text-emerald-700' : ''
                        }`}
                      >
                        {brl(totalDaLinha(l))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {[
                    ['SUB TOTAL CAPITAL', capital, 'bg-violet-50'],
                    ['SUB TOTAL CONSUMO', consumo, 'bg-amber-50'],
                    ['SUB TOTAL SERVIÇO', servico, 'bg-blue-50'],
                    ['SUB TOTAL DINHEIRO', dinheiro, 'bg-emerald-50'],
                  ].map(([rot, val, cor]) => (
                    <tr key={rot as string} className={cor as string}>
                      <td colSpan={6} className="p-1.5 text-right font-bold">
                        {rot}
                      </td>
                      <td className="p-1.5 text-right font-mono font-bold">{brl(val as number)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#0B3D91] text-white">
                    <td colSpan={6} className="p-2 text-right font-black">
                      DÉBITO TOTAL
                    </td>
                    <td className="p-2 text-right font-mono font-black">{brl(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
