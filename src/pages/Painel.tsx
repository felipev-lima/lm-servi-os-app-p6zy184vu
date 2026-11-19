/**
 * Painel — a primeira tela do dia.
 *
 * Responde três perguntas em um olhar: quanto tenho a receber, quanto recebi
 * neste mês e quem mais me deve. Todos os números são CALCULADOS dos
 * lançamentos — nada digitado à mão, como era na planilha.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarClientes, listarLancamentos, resumirPorCliente, type ResumoCliente } from '@/lib/crm'
import { brl, dataBR, totalDaLinha, TIPOS, type Lancamento } from '@/types/crm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, Users, Loader2, ArrowRight, AlertCircle, Plus } from 'lucide-react'

export default function Painel() {
  const [resumos, setResumos] = useState<ResumoCliente[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [clientes, lcs] = await Promise.all([listarClientes(), listarLancamentos()])
        setResumos(resumirPorCliente(clientes, lcs))
        setLancamentos(lcs)
      } finally {
        setCarregando(false)
      }
    })()
  }, [])

  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const aReceber = resumos.reduce((s, r) => s + (r.saldo > 0 ? r.saldo : 0), 0)
  const recebidoMes = lancamentos
    .filter((l) => l.kind === 'DINHEIRO' && (l.date || '').slice(0, 7) === mesAtual)
    .reduce((s, l) => s + Math.abs(totalDaLinha(l)), 0)
  const faturadoMes = lancamentos
    .filter((l) => l.kind !== 'DINHEIRO' && (l.date || '').slice(0, 7) === mesAtual)
    .reduce((s, l) => s + totalDaLinha(l), 0)
  const devedores = resumos.filter((r) => r.saldo > 0.005).sort((a, b) => b.saldo - a.saldo)
  const totalDevendo = devedores.reduce((s, r) => s + r.saldo, 0)

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
      </div>
    )
  }

  const cartoes = [
    {
      titulo: 'A receber',
      valor: brl(aReceber),
      detalhe: `${devedores.length} cliente(s) devendo`,
      icone: Wallet,
      cor: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
    },
    {
      titulo: 'Faturado no mês',
      valor: brl(faturadoMes),
      detalhe: 'capital + consumo + serviço',
      icone: TrendingUp,
      cor: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      titulo: 'Recebido no mês',
      valor: brl(recebidoMes),
      detalhe: 'pagamentos registrados',
      icone: Wallet,
      cor: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      titulo: 'Clientes',
      valor: String(resumos.length),
      detalhe: 'no cadastro',
      icone: Users,
      cor: 'text-slate-700',
      bg: 'bg-slate-50 border-slate-200',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Painel</h1>
          <p className="text-[11px] text-muted-foreground">
            Tudo calculado dos lançamentos — sem digitação de total
          </p>
        </div>
        <Button
          asChild
          className="bg-[#0F6A3A] hover:bg-[#0F6A3A]/90 text-white font-semibold h-9 gap-1.5 shrink-0"
        >
          <Link to="/lancamentos?novo=1">
            <Plus className="w-4 h-4" /> Lançar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {cartoes.map((c) => {
          const Icone = c.icone
          return (
            <Card key={c.titulo} className={`border ${c.bg}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase ${c.cor}`}>{c.titulo}</span>
                  <Icone className={`w-3.5 h-3.5 ${c.cor}`} />
                </div>
                <div className={`text-lg sm:text-xl font-black mt-1 ${c.cor}`}>{c.valor}</div>
                <p className="text-[9px] text-muted-foreground mt-0.5">{c.detalhe}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Maiores devedores
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Total em aberto: {brl(totalDevendo)}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="h-7 text-[10px] gap-1">
              <Link to="/clientes">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>

          <div className="space-y-1.5">
            {devedores.slice(0, 8).map((r) => (
              <Link
                key={r.cliente.id}
                to={`/clientes/${r.cliente.id}`}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card hover:border-[#0F6A3A]/50 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">
                    {r.cliente.nickname || r.cliente.name}
                  </p>
                  {r.cliente.nickname && (
                    <p className="text-[9px] text-muted-foreground truncate">{r.cliente.name}</p>
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-amber-800 shrink-0">
                  {brl(r.saldo)}
                </span>
              </Link>
            ))}

            {devedores.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum cliente com saldo em aberto.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3.5">
          <h2 className="text-sm font-bold mb-2">Últimos lançamentos</h2>
          <div className="space-y-1">
            {lancamentos.slice(0, 6).map((l) => {
              const t = TIPOS[l.kind]
              const v = totalDaLinha(l)
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-2 p-1.5 rounded border-b last:border-0 text-[11px]"
                >
                  <Badge className={`text-[8px] px-1.5 py-0 border ${t.cor} ${t.bg} shrink-0`}>
                    {t.label}
                  </Badge>
                  <span className="text-muted-foreground shrink-0">{dataBR(l.date)}</span>
                  <span className="truncate flex-1">
                    {l.expand?.client?.nickname || l.expand?.client?.name || l.description}
                  </span>
                  <span
                    className={`font-mono font-bold shrink-0 ${
                      v < 0 ? 'text-emerald-700' : 'text-slate-800'
                    }`}
                  >
                    {brl(v)}
                  </span>
                </div>
              )
            })}
            {lancamentos.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum lançamento ainda. Comece pelo botão <strong>Lançar</strong>.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
