/**
 * Tipos do CRM da LM SERVIÇOS.
 *
 * Modelo espelha a planilha de orçamento do Felipe, com as quatro divisões
 * (CAPITAL / CONSUMO / SERVIÇO / DINHEIRO) que ele já usa há anos.
 */

export type TipoLancamento = 'CAPITAL' | 'CONSUMO' | 'SERVICO' | 'DINHEIRO'
export type TipoItem = 'PRODUTO' | 'SERVICO'
export type SituacaoEnvio = 'PENDENTE' | 'ENVIADA'
/** O fluxo real do Felipe: orçamento → pedido → entregue → faturado */
export type StatusOrcamento = 'ORCAMENTO' | 'PEDIDO' | 'ENTREGUE' | 'FATURADO' | 'CANCELADO'

export interface Produto {
  id: string
  name: string
  unit?: string
  category?: string
  brand?: string
  /** preço de venda — o que vai no orçamento */
  price?: number
  notes?: string
  active?: boolean
  fl_product_id?: string
  pending_review?: boolean
}

export interface Cliente {
  id: string
  /** Razão social completa — é o que sai no PDF e no documento */
  name: string
  /** Apelido curto — SÓ para busca no CRM, nunca impresso */
  nickname?: string
  doc?: string
  doc_type?: 'CNPJ' | 'CPF' | ''
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  neighborhood?: string
  city?: string
  state?: string
  notes?: string
  active?: boolean
  legacy_sheet?: string
  fl_client_id?: string
  revisar?: boolean
  created?: string
  updated?: string
}

export interface Lancamento {
  id: string
  client: string
  /** Data do serviço/venda (não a data de cadastro) */
  date: string
  kind: TipoLancamento
  item_type?: TipoItem
  description: string
  /** A "descrição detalhada" da planilha — uso interno */
  details?: string
  quantity?: number
  unit_price?: number
  work_order_ref?: string
  sent_to_finance?: SituacaoEnvio
  sent_at?: string
  notes?: string
  legacy_row?: string
  expand?: { client?: Cliente }
  created?: string
}

export interface ItemOrcamento {
  description: string
  quantity: number
  unit_price: number
  /** capital / consumo / serviço — igual à coluna TIPO da planilha */
  kind?: TipoLancamento
  unit?: string
  product_id?: string
}

export interface Orcamento {
  id: string
  client: string
  number?: number
  date?: string
  items?: ItemOrcamento[]
  service_value?: number
  status?: StatusOrcamento
  payment_terms?: string
  delivery_terms?: string
  validity_days?: number
  notes?: string
  delivered_at?: string
  invoiced_at?: string
  delivered_by_name?: string
  delivered_by_role?: string
  signature_client?: string
  signature_deliverer?: string
  photos?: string[]
  sent_to_finance?: SituacaoEnvio
  expand?: { client?: Cliente }
  created?: string
}

/** Rótulos e cores de cada divisão — iguais aos da planilha do Felipe */
export const TIPOS: Record<
  TipoLancamento,
  { label: string; descricao: string; cor: string; bg: string }
> = {
  // Paleta azul do CRM: capital (mais escuro) → serviço (mais claro),
  // mantendo DINHEIRO em verde porque é dinheiro que entrou.
  CAPITAL: {
    label: 'Capital',
    descricao: 'Equipamento permanente: DVR, câmera, switch, HD',
    cor: 'text-indigo-900 border-indigo-400',
    bg: 'bg-indigo-50',
  },
  CONSUMO: {
    label: 'Consumo',
    descricao: 'Material de instalação: cabo, conector, toner',
    cor: 'text-sky-800 border-sky-300',
    bg: 'bg-sky-50',
  },
  SERVICO: {
    label: 'Serviço',
    descricao: 'Mão de obra: instalação, manutenção, vistoria',
    cor: 'text-blue-800 border-blue-300',
    bg: 'bg-blue-50',
  },
  DINHEIRO: {
    label: 'Dinheiro',
    descricao: 'Pagamento recebido — abate do saldo',
    cor: 'text-emerald-800 border-emerald-300',
    bg: 'bg-emerald-50',
  },
}

/**
 * Total de uma linha = quantidade × valor unitário.
 *
 * O sinal vem do valor gravado, não do tipo. Isso é necessário porque a
 * planilha do Felipe tem casos legítimos dos dois sinais:
 *   - DINHEIRO negativo = pagamento que abate a dívida (o caso comum);
 *   - DINHEIRO positivo = crédito/devolução que soma;
 *   - CONSUMO/CAPITAL/SERVIÇO negativo = desconto naquele item.
 * Forçar o sinal por tipo distorcia o total (erro de R$ 7.882,66 na
 * importação inicial).
 */
export function totalDaLinha(l: Pick<Lancamento, 'kind' | 'quantity' | 'unit_price'>): number {
  return Number(l.quantity ?? 0) * Number(l.unit_price ?? 0)
}

/** Saldo de um conjunto de lançamentos (positivo = o cliente deve) */
export function saldo(lancamentos: Lancamento[]): number {
  return lancamentos.reduce((s, l) => s + totalDaLinha(l), 0)
}

/** Formata em reais */
export function brl(v: number): string {
  const n = Math.abs(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${v < 0 ? '- ' : ''}R$ ${n}`
}

/** Data ISO -> DD/MM/AAAA */
export function dataBR(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}
