import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getWorkOrders, updateWorkOrderStatus } from '@/services/workOrders'
import { getQuotes, updateQuoteStatus } from '@/services/quotes'
import { getClients } from '@/services/clients'
import type {
  WorkOrderRecord,
  QuoteRecord,
  ClientRecord,
  WorkOrderStatus,
  QuoteStatus,
} from '@/types/database'
import { useRealtime } from '@/hooks/use-realtime'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Radio,
  ExternalLink,
  Phone,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Dashboard() {
  const [workOrders, setWorkOrders] = useState<WorkOrderRecord[]>([])
  const [quotes, setQuotes] = useState<QuoteRecord[]>([])
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [woData, quotesData, clientsData] = await Promise.all([
        getWorkOrders(),
        getQuotes(),
        getClients(),
      ])
      setWorkOrders(woData)
      setQuotes(quotesData)
      setClients(clientsData)
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Subscrições em tempo real para novos pedidos e ordens caírem na hora no painel
  useRealtime<QuoteRecord>('quotes', (sub) => {
    if (sub.action === 'create') {
      setQuotes((prev) => [sub.record, ...prev])
    } else if (sub.action === 'update') {
      setQuotes((prev) => prev.map((q) => (q.id === sub.record.id ? sub.record : q)))
    } else if (sub.action === 'delete') {
      setQuotes((prev) => prev.filter((q) => q.id !== sub.record.id))
    }
  })

  useRealtime<WorkOrderRecord>('work_orders', (sub) => {
    if (sub.action === 'create') {
      setWorkOrders((prev) => [sub.record, ...prev])
    } else if (sub.action === 'update') {
      setWorkOrders((prev) => prev.map((w) => (w.id === sub.record.id ? sub.record : w)))
    } else if (sub.action === 'delete') {
      setWorkOrders((prev) => prev.filter((w) => w.id !== sub.record.id))
    }
  })

  // Métricas
  const newWorkOrdersCount = workOrders.filter((w) => w.status === 'novo').length
  const inProgressWorkOrdersCount = workOrders.filter((w) => w.status === 'em_andamento').length
  const completedWorkOrdersCount = workOrders.filter((w) => w.status === 'concluido').length

  const pendingQuotesCount = quotes.filter((q) => q.status === 'pendente').length
  const approvedQuotesCount = quotes.filter((q) => q.status === 'aprovado').length
  const totalApprovedAmount = quotes
    .filter((q) => q.status === 'aprovado' || q.status === 'convertido_em_os')
    .reduce((sum, q) => sum + (Number(q.amount) || 0), 0)

  const handleStatusChange = async (orderId: string, newStatus: WorkOrderStatus) => {
    try {
      const updated = await updateWorkOrderStatus(orderId, newStatus)
      setWorkOrders((prev) => prev.map((w) => (w.id === orderId ? updated : w)))
    } catch (err) {
      console.error('Erro ao atualizar status da OS:', err)
    }
  }

  const handleQuoteStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      const updated = await updateQuoteStatus(quoteId, newStatus)
      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updated : q)))
    } catch (err) {
      console.error('Erro ao atualizar status do orçamento:', err)
    }
  }

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'novo':
        return <Badge className="bg-blue-600 hover:bg-blue-600 text-white">Novo</Badge>
      case 'em_andamento':
        return <Badge className="bg-amber-600 hover:bg-amber-600 text-white">Em Andamento</Badge>
      case 'concluido':
        return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Concluído</Badge>
    }
  }

  const getQuoteStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-500 bg-amber-50">
            Pendente
          </Badge>
        )
      case 'aprovado':
        return (
          <Badge variant="outline" className="text-emerald-700 border-emerald-500 bg-emerald-50">
            Aprovado
          </Badge>
        )
      case 'rejeitado':
        return (
          <Badge variant="outline" className="text-red-600 border-red-400 bg-red-50">
            Rejeitado
          </Badge>
        )
      case 'convertido_em_os':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-500 bg-blue-50">
            Convertido em OS
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Realtime */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Painel Operacional
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              Tempo Real Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Novos pedidos de orçamento e ordens de serviço chegam instantaneamente nesta tela.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/painel/ordens-servico">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1" />
              Nova Ordem de Serviço
            </Button>
          </Link>
          <Link to="/painel/orcamentos">
            <Button size="sm" variant="outline" className="border-slate-300">
              <Plus className="w-4 h-4 mr-1" />
              Novo Orçamento
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ordens em Aberto
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-slate-900">
              {newWorkOrdersCount + inProgressWorkOrdersCount}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-blue-600">{newWorkOrdersCount} novas</span>
              <span>•</span>
              <span className="font-semibold text-amber-600">
                {inProgressWorkOrdersCount} em andamento
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Orçamentos Pendentes
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-slate-900">{pendingQuotesCount}</div>
            <p className="text-xs text-slate-500 mt-1">Pedidos aguardando retorno da equipe</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total em Orçamentos Aprovados
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-emerald-700">
              R${' '}
              {totalApprovedAmount.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {approvedQuotesCount} orçamentos aprovados
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Base de Clientes
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-slate-900">{clients.length}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Cadastrados no sistema</span>
              <Link to="/painel/clientes" className="text-blue-600 hover:underline font-semibold">
                Ver todos
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Ordens de Serviço Recentes + Novos Pedidos de Orçamento do Site */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ordens de Serviço (8 col) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Ordens de Serviço em Aberto
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Acompanhe e altere o status das ordens em execução
                </CardDescription>
              </div>
              <Link
                to="/painel/ordens-servico"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Carregando ordens...</div>
              ) : workOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhuma ordem de serviço cadastrada no momento.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {workOrders.slice(0, 6).map((wo) => {
                    const clientName = wo.expand?.client?.name || 'Cliente Geral'
                    return (
                      <div
                        key={wo.id}
                        className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {clientName}
                            </span>
                            {getStatusBadge(wo.status)}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{wo.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>
                              Data: {wo.date || new Date(wo.created).toLocaleDateString('pt-BR')}
                            </span>
                            {wo.priority && (
                              <span className="capitalize font-medium text-slate-500">
                                • Prioridade: {wo.priority}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Switcher & Link to Details */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <select
                            value={wo.status}
                            onChange={(e) =>
                              handleStatusChange(wo.id, e.target.value as WorkOrderStatus)
                            }
                            className="text-xs font-medium bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
                          >
                            <option value="novo">Novo</option>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="concluido">Concluído</option>
                          </select>

                          <Link
                            to={`/painel/ordens-servico/${wo.id}`}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Ver Detalhes da Ordem"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Novos Pedidos de Orçamento do Site (5 col) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-slate-900">
                    Pedidos do Site (Chegam na Hora)
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Orçamentos enviados pelo formulário público do site
                </CardDescription>
              </div>
              <Link
                to="/painel/orcamentos"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Gerenciar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Carregando pedidos...</div>
              ) : quotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhum pedido de orçamento registrado ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {quotes.slice(0, 6).map((quote) => {
                    const clientName =
                      quote.client_name || quote.expand?.client?.name || 'Cliente via Site'
                    return (
                      <div
                        key={quote.id}
                        className="p-4 hover:bg-slate-50/80 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {clientName}
                          </span>
                          {getQuoteStatusBadge(quote.status)}
                        </div>

                        {quote.service_name && (
                          <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
                            {quote.service_name}
                          </div>
                        )}

                        {quote.notes && (
                          <p className="text-xs text-slate-600 line-clamp-2 italic">
                            "{quote.notes}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-slate-500 border-t border-slate-100">
                          <div className="flex items-center gap-3">
                            {quote.client_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {quote.client_phone}
                              </span>
                            )}
                            {quote.amount && quote.amount > 0 ? (
                              <span className="font-bold text-emerald-600">
                                R$ {quote.amount.toFixed(2)}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1">
                            <select
                              value={quote.status}
                              onChange={(e) =>
                                handleQuoteStatusChange(quote.id, e.target.value as QuoteStatus)
                              }
                              className="text-[11px] font-medium bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
                            >
                              <option value="pendente">Pendente</option>
                              <option value="aprovado">Aprovado</option>
                              <option value="rejeitado">Rejeitado</option>
                              <option value="convertido_em_os">Virou OS</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
