import React, { useEffect, useState } from 'react'
import { getClients, createClient, updateClient, deleteClient } from '@/services/clients'
import { getWorkOrders } from '@/services/workOrders'
import type { ClientRecord, WorkOrderRecord } from '@/types/database'
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  History,
  FileText,
  Clock,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Dialog State: Cadastrar ou Editar
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Dialog State: Histórico de Serviços do Cliente
  const [historyClient, setHistoryClient] = useState<ClientRecord | null>(null)
  const [clientOrders, setClientOrders] = useState<WorkOrderRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchClients = async (query?: string) => {
    setLoading(true)
    try {
      const data = await getClients(query)
      setClients(data)
    } catch (err) {
      console.error('Erro ao buscar clientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchClients(search)
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [search])

  const handleOpenCreate = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (client: ClientRecord) => {
    setEditingClient(client)
    setFormData({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      notes: client.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, formData)
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? updated : c)))
      } else {
        const created = await createClient(formData)
        setClients((prev) => [created, ...prev])
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Erro ao salvar cliente:', err)
      alert('Erro ao salvar os dados do cliente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o cliente "${name}"?`)) return

    try {
      await deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Erro ao deletar cliente:', err)
      alert('Não foi possível remover o cliente. Ele pode ter ordens de serviço associadas.')
    }
  }

  const handleOpenHistory = async (client: ClientRecord) => {
    setHistoryClient(client)
    setLoadingHistory(true)
    try {
      const orders = await getWorkOrders({ clientId: client.id })
      setClientOrders(orders)
    } catch (err) {
      console.error('Erro ao buscar ordens do cliente:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com Busca e Criação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Clientes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastro completo, histórico de serviços e busca de clientes da LM SERVIÇOS.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Cadastrar Novo Cliente
        </Button>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome, e-mail ou telefone..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            Limpar
          </Button>
        )}
      </div>

      {/* Grid de Clientes */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Carregando clientes...
        </div>
      ) : clients.length === 0 ? (
        <Card className="border-slate-200 text-center p-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'Nenhum resultado para a busca. Tente outros termos.'
              : 'Cadastre o primeiro cliente da LM SERVIÇOS ou importe sua planilha do FL Serviços.'}
          </p>
          <div className="mt-4">
            <Button onClick={handleOpenCreate} size="sm" className="bg-blue-600 text-white">
              Cadastrar Agora
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="border-slate-200 hover:border-blue-400 transition-colors shadow-sm flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {client.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(client)}
                      className="h-8 w-8 text-slate-500 hover:text-blue-600"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2 line-clamp-1">
                  {client.name}
                </CardTitle>
                {client.notes && (
                  <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {client.notes}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-2 text-xs text-slate-600">
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-700">{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-slate-600">{client.address}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Cadastrado em {new Date(client.created).toLocaleDateString('pt-BR')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenHistory(client)}
                    className="text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2.5"
                  >
                    <History className="w-3.5 h-3.5 mr-1" />
                    Histórico
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Cadastrar ou Editar Cliente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Preencha os dados do cliente para constar nas ordens de serviço e orçamentos da LM
              SERVIÇOS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveClient} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                Nome completo ou Razão Social *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Condomínio Edifício Paulista"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  E-mail de contato
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@cliente.com.br"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                Endereço completo
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, complemento, bairro, cidade - UF"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                Observações internas
              </Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Particularidades do local, síndico responsável, horários de barulho permitidos..."
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
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving
                  ? 'Salvando...'
                  : editingClient
                    ? 'Salvar Alterações'
                    : 'Cadastrar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Histórico de Serviços do Cliente */}
      <Dialog open={!!historyClient} onOpenChange={(open) => !open && setHistoryClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Histórico de Serviços: {historyClient?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Todas as ordens de serviço executadas ou em andamento para este cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {loadingHistory ? (
              <div className="p-8 text-center text-slate-400 text-xs">Carregando histórico...</div>
            ) : clientOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border rounded-lg bg-slate-50">
                Nenhuma ordem de serviço registrada para este cliente até o momento.
              </div>
            ) : (
              <div className="space-y-3">
                {clientOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">
                        {wo.date || new Date(wo.created).toLocaleDateString('pt-BR')}
                      </span>
                      <Badge
                        className={
                          wo.status === 'concluido'
                            ? 'bg-emerald-600'
                            : wo.status === 'em_andamento'
                              ? 'bg-amber-600'
                              : 'bg-blue-600'
                        }
                      >
                        {wo.status === 'concluido'
                          ? 'Concluído'
                          : wo.status === 'em_andamento'
                            ? 'Em Andamento'
                            : 'Novo'}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium text-slate-800">{wo.description}</p>

                    {wo.notes && <p className="text-xs text-slate-500 italic">Obs: {wo.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryClient(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
