import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWorkOrders, createWorkOrder, updateWorkOrderStatus } from '@/services/workOrders'
import { getClients } from '@/services/clients'
import type {
  WorkOrderRecord,
  ClientRecord,
  WorkOrderStatus,
  WorkOrderPriority,
} from '@/types/database'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrderRecord[]>([])
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Dialog Criar Nova Ordem
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<WorkOrderStatus>('novo')
  const [priority, setPriority] = useState<WorkOrderPriority>('media')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersData, clientsData] = await Promise.all([
        getWorkOrders({ status: statusFilter, search: searchTerm }),
        getClients(),
      ])
      setOrders(ordersData)
      setClients(clientsData)
      if (clientsData.length > 0 && !clientId) {
        setClientId(clientsData[0].id)
      }
    } catch (err) {
      console.error('Erro ao buscar ordens de serviço:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData()
    }, 250)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const handleStatusChange = async (orderId: string, newStatus: WorkOrderStatus) => {
    try {
      const updated = await updateWorkOrderStatus(orderId, newStatus)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Não foi possível alterar o status.')
    }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !description.trim()) return

    setIsSaving(true)
    try {
      const created = await createWorkOrder({
        client: clientId,
        description,
        status,
        priority,
        date,
        notes,
      })
      setOrders((prev) => [created, ...prev])
      setIsModalOpen(false)
      setDescription('')
      setNotes('')
    } catch (err) {
      console.error('Erro ao criar ordem de serviço:', err)
      alert('Erro ao criar ordem de serviço.')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = (s: WorkOrderStatus) => {
    switch (s) {
      case 'novo':
        return <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-medium">Novo</Badge>
      case 'em_andamento':
        return (
          <Badge className="bg-amber-600 hover:bg-amber-600 text-white font-medium">
            Em Andamento
          </Badge>
        )
      case 'concluido':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-medium">
            Concluído
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ordens de Serviço</h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento completo das OS com status: novo, em andamento ou concluído.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Criar Nova Ordem
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição da ordem..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('novo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'novo'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Novo
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('em_andamento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'em_andamento'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Em Andamento
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('concluido')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'concluido'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Concluído
          </button>
        </div>
      </div>

      {/* Lista de Ordens de Serviço */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Carregando ordens de serviço...
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-slate-200 text-center p-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhuma ordem de serviço encontrada
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Nenhuma ordem corresponde aos filtros selecionados.'
              : 'Comece criando uma nova ordem de serviço para sua equipe.'}
          </p>
          <div className="mt-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="bg-blue-600 text-white"
            >
              Criar Ordem Agora
            </Button>
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Descrição do Serviço</th>
                  <th className="px-5 py-3 font-semibold">Data Prevista</th>
                  <th className="px-5 py-3 font-semibold">Prioridade</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((wo) => {
                  const client = wo.expand?.client
                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {client?.name || 'Cliente Geral'}
                        </div>
                        {client?.phone && (
                          <div className="text-xs text-slate-500">{client.phone}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-md">
                        <p className="text-slate-800 line-clamp-2">{wo.description}</p>
                        {wo.notes && (
                          <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">
                            Obs: {wo.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {wo.date
                          ? new Date(wo.date + 'T00:00:00').toLocaleDateString('pt-BR')
                          : new Date(wo.created).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {wo.priority || 'média'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(wo.status)}
                          <select
                            value={wo.status}
                            onChange={(e) =>
                              handleStatusChange(wo.id, e.target.value as WorkOrderStatus)
                            }
                            className="text-xs font-medium bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
                            title="Mudar status da ordem"
                          >
                            <option value="novo">Novo</option>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="concluido">Concluído</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/painel/ordens-servico/${wo.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver Detalhes
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Criar Nova Ordem de Serviço */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Nova Ordem de Serviço
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Vincule um cliente e especifique o serviço para a equipe da LM SERVIÇOS executar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="clientSelect" className="text-xs font-semibold text-slate-700">
                  Cliente Vinculado *
                </Label>
                <Link to="/painel/clientes" className="text-xs text-blue-600 hover:underline">
                  + Novo Cliente
                </Link>
              </div>
              <select
                id="clientSelect"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {clients.length === 0 && <option value="">Nenhum cliente cadastrado</option>}
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                Descrição do Serviço a Executar *
              </Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Troca de disjuntores da bomba e fiação do térreo..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="statusSelect" className="text-xs font-semibold text-slate-700">
                  Status Inicial
                </Label>
                <select
                  id="statusSelect"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:outline-none"
                >
                  <option value="novo">Novo</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prioritySelect" className="text-xs font-semibold text-slate-700">
                  Prioridade
                </Label>
                <select
                  id="prioritySelect"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:outline-none"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateInput" className="text-xs font-semibold text-slate-700">
                  Data Prevista
                </Label>
                <Input
                  id="dateInput"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                Observações internas ou equipe designada
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Colaborador maetros responsável pela execução."
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
                disabled={isSaving || !clientId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? 'Criando OS...' : 'Salvar Ordem de Serviço'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
