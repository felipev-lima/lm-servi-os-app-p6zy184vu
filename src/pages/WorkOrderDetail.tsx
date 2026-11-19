import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  getWorkOrderById,
  updateWorkOrderStatus,
  updateWorkOrder,
  deleteWorkOrder,
} from '@/services/workOrders'
import type { WorkOrderRecord, WorkOrderStatus, WorkOrderPriority } from '@/types/database'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit3,
  FileText,
  Save,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<WorkOrderRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<WorkOrderStatus>('novo')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Modo de edição completa
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editPriority, setEditPriority] = useState<WorkOrderPriority>('media')
  const [editDate, setEditDate] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const fetchOrder = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getWorkOrderById(id)
      setOrder(data)
      setStatus(data.status)
      setEditDescription(data.description)
      setEditNotes(data.notes || '')
      setEditPriority(data.priority || 'media')
      setEditDate(data.date || '')
    } catch (err) {
      console.error('Erro ao carregar detalhes da ordem:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (!id) return
    setIsUpdatingStatus(true)
    try {
      const updated = await updateWorkOrderStatus(id, newStatus)
      setOrder(updated)
      setStatus(newStatus)
    } catch (err) {
      console.error('Erro ao alterar status:', err)
      alert('Não foi possível alterar o status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setIsSavingEdit(true)
    try {
      const updated = await updateWorkOrder(id, {
        description: editDescription,
        notes: editNotes,
        priority: editPriority,
        date: editDate,
      })
      setOrder(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Erro ao salvar alterações:', err)
      alert('Erro ao salvar dados da ordem.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Deseja realmente remover esta ordem de serviço permanentemente?')) return

    try {
      await deleteWorkOrder(id)
      navigate('/painel/ordens-servico')
    } catch (err) {
      console.error('Erro ao deletar ordem:', err)
      alert('Não foi possível excluir a ordem.')
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        Carregando detalhes da ordem de serviço...
      </div>
    )
  }

  if (!order) {
    return (
      <Card className="p-12 text-center border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Ordem de Serviço não encontrada</h2>
        <p className="text-xs text-slate-500 mt-1">
          O registro pode ter sido excluído ou não existe.
        </p>
        <Link to="/painel/ordens-servico" className="mt-4 inline-block">
          <Button variant="outline">Voltar para a Lista</Button>
        </Link>
      </Card>
    )
  }

  const client = order.expand?.client

  return (
    <div className="space-y-6">
      {/* Top Bar com Navegação e Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/painel/ordens-servico"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ordem #{order.id.slice(0, 8)}
              </h1>
              <Badge
                className={
                  status === 'concluido'
                    ? 'bg-emerald-600'
                    : status === 'em_andamento'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                }
              >
                {status === 'concluido'
                  ? 'Concluído'
                  : status === 'em_andamento'
                    ? 'Em Andamento'
                    : 'Novo'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Criada em {new Date(order.created).toLocaleDateString('pt-BR')} às{' '}
              {new Date(order.created).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs border-slate-300"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              Editar Ordem
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="text-xs"
            >
              Cancelar Edição
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Seletor Rápido de Mudança de Status */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/50">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-blue-950">Alteração Rápida de Status</h3>
            <p className="text-xs text-blue-800/80">
              Mude a etapa da ordem de serviço para refletir imediatamente no painel e relatórios.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('novo')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                status === 'novo'
                  ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-600 ring-offset-2'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              Novo
            </button>
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('em_andamento')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                status === 'em_andamento'
                  ? 'bg-amber-600 text-white shadow-amber-500/25 ring-2 ring-amber-600 ring-offset-2'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              Em Andamento
            </button>
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('concluido')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                status === 'concluido'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-600 ring-offset-2'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              Concluído
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de 2 Colunas: Descrição do Serviço vs Dados do Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Principal: Detalhes do Serviço */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Descrição e Especificação do Serviço
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Instruções técnicas para a equipe e histórico de execução
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Descrição Principal
                    </span>
                    <p className="mt-1 text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {order.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Data Prevista
                      </span>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {order.date
                          ? new Date(order.date + 'T00:00:00').toLocaleDateString('pt-BR')
                          : 'Não agendada'}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Prioridade
                      </span>
                      <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
                        {order.priority || 'Média'}
                      </p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Observações da Equipe / Técnico
                      </span>
                      <div className="mt-1 p-3 rounded-lg bg-slate-50 text-xs text-slate-700 italic border border-slate-200">
                        {order.notes}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Descrição do Serviço *
                    </Label>
                    <Textarea
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Data Prevista</Label>
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Prioridade</Label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as WorkOrderPriority)}
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Observações Internas
                    </Label>
                    <Textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Ex: Peças a comprar, técnico maetros responsável..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSavingEdit}
                      className="bg-blue-600 text-white"
                    >
                      {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral: Dados Completos do Cliente */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Dados Completos do Cliente
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Informações para contato e deslocamento
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {client ? (
                <>
                  <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                      <p className="text-[11px] text-slate-500">Cliente cadastrado no sistema</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {client.phone && (
                      <div className="flex items-start gap-2.5">
                        <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase">
                            Telefone
                          </span>
                          <p className="font-semibold text-slate-800 text-sm">{client.phone}</p>
                        </div>
                      </div>
                    )}

                    {client.email && (
                      <div className="flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase">
                            E-mail
                          </span>
                          <p className="text-slate-800 font-medium">{client.email}</p>
                        </div>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase">
                            Endereço do Local
                          </span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {client.address}
                          </p>
                        </div>
                      </div>
                    )}

                    {client.notes && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          Anotações do Cliente
                        </span>
                        <p className="text-slate-600 italic mt-0.5">{client.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      to="/painel/clientes"
                      className="text-xs font-semibold text-blue-600 hover:underline block text-center"
                    >
                      Ver perfil completo e outros serviços deste cliente →
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-slate-400">
                  Nenhum cliente específico vinculado a esta ordem.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
