/**
 * Clientes — lista com busca por apelido, razão social ou CNPJ.
 *
 * O apelido é o que o Felipe usa no dia a dia ("ESCOLA PARK"), por isso ele
 * aparece em destaque e a razão social logo abaixo, menor.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarClientes, listarLancamentos, resumirPorCliente } from '@/lib/crm'
import type { ResumoCliente } from '@/lib/crm'
import { brl } from '@/types/crm'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Users, Plus, ChevronRight } from 'lucide-react'

export default function Clientes() {
  const [todos, setTodos] = useState<ResumoCliente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [soDevedores, setSoDevedores] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [clientes, lcs] = await Promise.all([listarClientes(), listarLancamentos()])
        setTodos(resumirPorCliente(clientes, lcs))
      } finally {
        setCarregando(false)
      }
    })()
  }, [])

  const filtrados = todos
    .filter((r) => {
      if (soDevedores && r.saldo <= 0.005) return false
      const t = busca.trim().toLowerCase()
      if (!t) return true
      return (
        r.cliente.name.toLowerCase().includes(t) ||
        (r.cliente.nickname || '').toLowerCase().includes(t) ||
        (r.cliente.doc || '').includes(t)
      )
    })
    .sort((a, b) => b.saldo - a.saldo || a.cliente.name.localeCompare(b.cliente.name))

  const totalDevedores = todos.filter((r) => r.saldo > 0.005).length
  const totalEmAberto = todos.reduce((s, r) => s + (r.saldo > 0 ? r.saldo : 0), 0)

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando clientes...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Clientes</h1>
          <p className="text-[11px] text-muted-foreground">
            {todos.length} cadastrados · {totalDevedores} devendo {brl(totalEmAberto)}
          </p>
        </div>
        <Button
          asChild
          className="bg-[#0F6A3A] hover:bg-[#0F6A3A]/90 text-white font-semibold h-9 gap-1.5 shrink-0"
        >
          <Link to="/clientes/novo">
            <Plus className="w-4 h-4" /> Novo
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por apelido, razão social ou CNPJ..."
            className="pl-9 h-10 text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant={!soDevedores ? 'default' : 'outline'}
            onClick={() => setSoDevedores(false)}
            className={`h-7 text-[10px] ${!soDevedores ? 'bg-slate-900 text-white' : ''}`}
          >
            Todos ({todos.length})
          </Button>
          <Button
            size="sm"
            variant={soDevedores ? 'default' : 'outline'}
            onClick={() => setSoDevedores(true)}
            className={`h-7 text-[10px] ${soDevedores ? 'bg-amber-600 text-white' : 'text-amber-700'}`}
          >
            Devendo ({totalDevedores})
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {filtrados.map((r) => (
          <Link key={r.cliente.id} to={`/clientes/${r.cliente.id}`}>
            <Card className="hover:border-[#0F6A3A]/50 transition">
              <CardContent className="p-2.5 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold truncate">
                      {r.cliente.nickname || r.cliente.name}
                    </span>
                    {r.cliente.revisar && (
                      <Badge className="text-[8px] px-1 py-0 bg-amber-100 text-amber-800 border-amber-300">
                        CONFERIR
                      </Badge>
                    )}
                  </div>
                  {r.cliente.nickname && (
                    <p className="text-[9px] text-muted-foreground truncate">{r.cliente.name}</p>
                  )}
                  <p className="text-[9px] text-muted-foreground">
                    {r.lancamentos} lançamento(s)
                    {r.cliente.doc ? ` · ${r.cliente.doc}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-mono text-xs font-bold block ${
                      r.saldo > 0.005
                        ? 'text-amber-800'
                        : r.saldo < -0.005
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {brl(r.saldo)}
                  </span>
                  <span className="text-[8px] text-muted-foreground">
                    {r.saldo > 0.005 ? 'em aberto' : r.saldo < -0.005 ? 'crédito' : 'quitado'}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtrados.length === 0 && (
          <div className="p-10 text-center border-2 border-dashed rounded-xl">
            <Users className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold">Nenhum cliente encontrado</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ajuste a busca ou cadastre um novo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
