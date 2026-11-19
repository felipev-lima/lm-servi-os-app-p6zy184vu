import React, { useEffect, useState } from 'react'
import { getQuotes, createQuote, updateQuoteStatus, deleteQuote } from '@/services/quotes'
import { getClients } from '@/services/clients'
import { createWorkOrder } from '@/services/workOrders'
import type { QuoteRecord, ClientRecord, QuoteStatus, QuoteItem } from '@/types/database'
import {
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Loader2,
  ExternalLink,
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

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([])
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')

  // Dialog Novo Orçamento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<QuoteStatus>('pendente')

  // Itens do orçamento
  const [items, setItems] = useState<QuoteItem[]>([
    { description: 'Mão de obra técnica especializada', quantity: 1, unit_price: 350, total: 350 },
  ])
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [quotesData, clientsData] = await Promise.all([
        getQuotes({ status: statusFilter }),
        getClients(),
      ])
      setQuotes(quotesData)
      setClients(clientsData)
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) => {
      const copy = [...prev]
      const current = { ...copy[index], [field]: value }

      if (field === 'quantity' || field === 'unit_price') {
        const qty = Number(field === 'quantity' ? value : current.quantity) || 0
        const price = Number(field === 'unit_price' ? value : current.unit_price) || 0
        current.total = qty * price
      }

      copy[index] = current
      return copy
    })
  }

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const selectedClient = clients.find((c) => c.id === clientId)
    const amountTotal = calculateTotal()

    try {
      const created = await createQuote({
        client: clientId || undefined,
        client_name: selectedClient?.name || undefined,
        client_email: selectedClient?.email || undefined,
        client_phone: selectedClient?.phone || undefined,
        client_address: selectedClient?.address || undefined,
        service_name: serviceName || 'Orçamento Geral',
        items,
        amount: amountTotal,
        status,
        notes,
      })

      setQuotes((prev) => [created, ...prev])
      setIsModalOpen(false)
      // reset
      setNotes('')
      setServiceName('')
      setItems([{ description: 'Mão de obra técnica', quantity: 1, unit_price: 350, total: 350 }])
    } catch (err) {
      console.error('Erro ao salvar orçamento:', err)
      alert('Não foi possível salvar o orçamento.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      const updated = await updateQuoteStatus(quoteId, newStatus)
      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updated : q)))
    } catch (err) {
      console.error('Erro ao atualizar status do orçamento:', err)
      alert('Erro ao atualizar status.')
    }
  }

  // Converter Orçamento Aprovado em Ordem de Serviço automaticamente
  const handleConvertToWorkOrder = async (quote: QuoteRecord) => {
    if (!confirm('Deseja converter este orçamento aprovado em uma Ordem de Serviço na equipe?'))
      return

    try {
      // Se não tem clienteId mas tem nome, buscar ou vincular
      let targetClientId = quote.client
      if (!targetClientId) {
        // Encontrar ou usar o primeiro cliente cadastrado
        targetClientId = clients[0]?.id
      }

      if (!targetClientId) {
        alert('Cadastre pelo menos um cliente para vincular a esta ordem de serviço.')
        return
      }

      const description = `[Origem Orçamento #${quote.id.slice(0, 6)}] ${quote.service_name || 'Serviço'}: ${
        quote.notes || 'Execução dos itens aprovados no orçamento.'
      }`

      await createWorkOrder({
        client: targetClientId,
        description,
        status: 'novo',
        priority: 'alta',
        date: new Date().toISOString().split('T')[0],
        notes: `Convertido do orçamento com valor de R$ ${quote.amount?.toFixed(2) || '0.00'}`,
      })

      // Atualiza o orçamento para status 'convertido_em_os'
      const updated = await updateQuoteStatus(quote.id, 'convertido_em_os')
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? updated : q)))

      alert('Ordem de serviço gerada com sucesso e colocada na fila "Novo"!')
    } catch (err) {
      console.error('Erro ao converter orçamento em OS:', err)
      alert('Erro ao converter em ordem de serviço.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover este orçamento?')) return
    try {
      await deleteQuote(id)
      setQuotes((prev) => prev.filter((q) => q.id !== id))
    } catch (err) {
      console.error('Erro ao deletar orçamento:', err)
    }
  }

  const getStatusBadge = (s: QuoteStatus) => {
    switch (s) {
      case 'pendente':
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
            Pendente
          </Badge>
        )
      case 'aprovado':
        return (
          <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
            Aprovado
          </Badge>
        )
      case 'rejeitado':
        return (
          <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50">
            Rejeitado
          </Badge>
        )
      case 'convertido_em_os':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
            Convertido em OS
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestão de Orçamentos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Criação de propostas com lista de itens, valores calculados e acompanhamento de
            aprovação.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Orçamento
        </Button>
      </div>

      {/* Tabs de Filtro de Status */}
      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('pendente')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'pendente'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          Pendentes
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('aprovado')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'aprovado'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Aprovados
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('convertido_em_os')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'convertido_em_os'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          Convertidos em OS
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('rejeitado')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === 'rejeitado'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          Rejeitados
        </button>
      </div>

      {/* Grid de Orçamentos */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          Carregando orçamentos...
        </div>
      ) : quotes.length === 0 ? (
        <Card className="border-slate-200 text-center p-12">
          <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum orçamento encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Crie seu primeiro orçamento técnico ou aguarde solicitações do site público.
          </p>
          <div className="mt-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="bg-blue-600 text-white"
            >
              Novo Orçamento
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {quotes.map((quote) => {
            const clientName = quote.client_name || quote.expand?.client?.name || 'Cliente Geral'
            const parsedItems: QuoteItem[] = Array.isArray(quote.items) ? quote.items : []

            return (
              <Card
                key={quote.id}
                className="border-slate-200 hover:border-blue-400 transition-colors shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{clientName}</span>
                        {getStatusBadge(quote.status)}
                      </div>
                      <p className="text-xs font-medium text-blue-700 mt-0.5">
                        {quote.service_name || 'Serviço Especializado'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-700">
                        R${' '}
                        {(Number(quote.amount) || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(quote.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs">
                  {/* Dados de Contato */}
                  {(quote.client_phone || quote.client_email || quote.client_address) && (
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-100 space-y-1 text-slate-600">
                      {quote.client_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quote.client_phone}</span>
                        </div>
                      )}
                      {quote.client_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quote.client_email}</span>
                        </div>
                      )}
                      {quote.client_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="line-clamp-1">{quote.client_address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lista de Itens do Orçamento */}
                  {parsedItems.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Composição do Valor:
                      </span>
                      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                        {parsedItems.map((item, idx) => (
                          <div key={idx} className="p-2 flex items-center justify-between bg-white">
                            <span className="text-slate-800 font-medium">
                              {item.quantity}x {item.description}
                            </span>
                            <span className="font-semibold text-slate-900 whitespace-nowrap">
                              R$ {(Number(item.total) || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {quote.notes && (
                    <div className="p-2.5 rounded bg-blue-50/50 border border-blue-100/60 text-slate-700 italic">
                      "{quote.notes}"
                    </div>
                  )}

                  {/* Ações e Mudança de Status */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Status:</span>
                      <select
                        value={quote.status}
                        onChange={(e) =>
                          handleStatusChange(quote.id, e.target.value as QuoteStatus)
                        }
                        className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-700"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="rejeitado">Rejeitado</option>
                        <option value="convertido_em_os">Virou OS</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {quote.status === 'aprovado' && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToWorkOrder(quote)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                          title="Gerar Ordem de Serviço na equipe"
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          Gerar OS
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(quote.id)}
                        className="h-7 w-7 text-slate-400 hover:text-red-600"
                        title="Excluir Orçamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: Criar Novo Orçamento com Itens */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Novo Orçamento</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Discrimine os itens, quantidades e valores para formar o orçamento da LM SERVIÇOS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuote} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Cliente Vinculado</Label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800"
                >
                  <option value="">Cliente Avulso / Formulário</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Tipo de Serviço</Label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Reforma Elétrica, Pintura, PMOC..."
                  required
                />
              </div>
            </div>

            {/* Linhas de Itens */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Itens do Orçamento
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="text-xs h-7 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Adicionar Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200"
                  >
                    <div className="col-span-6 sm:col-span-6">
                      <Input
                        placeholder="Descrição do item ou serviço..."
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="text-xs h-8 bg-white"
                        required
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', Number(e.target.value))
                        }
                        className="text-xs h-8 bg-white"
                        required
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Preço Unit. R$"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(index, 'unit_price', Number(e.target.value))
                        }
                        className="text-xs h-8 bg-white"
                        required
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totalizador */}
              <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">VALOR TOTAL CALCULADO:</span>
                <span className="text-lg font-black text-emerald-700">
                  R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <Label className="text-xs font-semibold text-slate-700">
                Observações ou Condições Comerciais
              </Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Validade da proposta por 15 dias. Pagamento 50% entrada e 50% entrega."
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
                {isSaving ? 'Salvando...' : 'Criar Orçamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
