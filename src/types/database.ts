import type { RecordModel } from 'pocketbase'

export interface UserRecord extends RecordModel {
  email: string
  name?: string
  avatar?: string
}

export interface ClientRecord extends RecordModel {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export type WorkOrderStatus = 'novo' | 'em_andamento' | 'concluido'
export type WorkOrderPriority = 'baixa' | 'media' | 'alta' | 'urgente'

export interface WorkOrderRecord extends RecordModel {
  client: string // ID do cliente
  description: string
  status: WorkOrderStatus
  date?: string
  notes?: string
  priority?: WorkOrderPriority
  expand?: {
    client?: ClientRecord
  }
}

export interface ServiceRecord extends RecordModel {
  name: string
  description?: string
  base_price?: number
}

export interface QuoteItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export type QuoteStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'convertido_em_os'

export interface QuoteRecord extends RecordModel {
  client?: string
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  service_name?: string
  items?: QuoteItem[] | string
  amount?: number
  status: QuoteStatus
  notes?: string
  expand?: {
    client?: ClientRecord
  }
}
