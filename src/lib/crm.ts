/**
 * Camada de dados do CRM. Toda conversa com o PocketBase passa por aqui.
 *
 * Números do PocketBase chegam como number; campos opcionais podem vir null.
 * Nada é assumido: o que pode faltar é tratado como vazio.
 */
import pb from '@/lib/pocketbase/client'
import {
  totalDaLinha,
  type Cliente,
  type Lancamento,
  type Orcamento,
  type Produto,
} from '@/types/crm'

const normalizarCliente = (r: any): Cliente => ({
  ...r,
  name: r.name || '',
  nickname: r.nickname || '',
  doc: r.doc || '',
  active: r.active !== false,
})

// ---------------- CLIENTES ----------------

export async function listarClientes(busca = ''): Promise<Cliente[]> {
  const filtro = busca.trim()
    ? `name ~ "${busca.replace(/"/g, '')}" || nickname ~ "${busca.replace(/"/g, '')}" || doc ~ "${busca.replace(/"/g, '')}"`
    : ''
  const res = await pb.collection('clients').getFullList({
    sort: 'name',
    filter: filtro,
  })
  return res.map(normalizarCliente)
}

export async function obterCliente(id: string): Promise<Cliente> {
  return normalizarCliente(await pb.collection('clients').getOne(id))
}

export async function salvarCliente(dados: Partial<Cliente> & { name: string }, id?: string) {
  const corpo = { ...dados, active: dados.active !== false }
  return id ? pb.collection('clients').update(id, corpo) : pb.collection('clients').create(corpo)
}

export async function apagarCliente(id: string) {
  return pb.collection('clients').delete(id)
}

// ---------------- LANÇAMENTOS ----------------

export async function listarLancamentos(opcoes?: {
  clienteId?: string
  de?: string
  ate?: string
  tipo?: string
  /** Quando informado, devolve só os N mais recentes (abertura do painel). */
  limite?: number
}): Promise<Lancamento[]> {
  const partes: string[] = []
  if (opcoes?.clienteId) partes.push(`client = "${opcoes.clienteId}"`)
  if (opcoes?.de) partes.push(`date >= "${opcoes.de} 00:00:00"`)
  if (opcoes?.ate) partes.push(`date <= "${opcoes.ate} 23:59:59"`)
  if (opcoes?.tipo) partes.push(`kind = "${opcoes.tipo}"`)

  // `sort=-created` faz o PocketBase responder 400 nesta coleção (o campo
  // created é autodate e o índice composto não existe). Ordenar por date puro
  // funciona e é o que importa: o lançamento vive pela data do serviço.
  const opcoesReq = {
    sort: '-date',
    filter: partes.join(' && '),
    expand: 'client',
  }

  if (opcoes?.limite) {
    const res = await pb.collection('transactions').getList(1, opcoes.limite, opcoesReq)
    return res.items as unknown as Lancamento[]
  }

  const res = await pb.collection('transactions').getFullList(opcoesReq)
  return res as unknown as Lancamento[]
}

export async function salvarLancamento(dados: Partial<Lancamento>, id?: string) {
  // quantity/unit_price podem vir vazios do formulário: grava 0 para o cálculo
  const corpo = {
    ...dados,
    quantity: Number(dados.quantity ?? 0),
    unit_price: Number(dados.unit_price ?? 0),
  }
  return id
    ? pb.collection('transactions').update(id, corpo)
    : pb.collection('transactions').create(corpo)
}

export async function apagarLancamento(id: string) {
  return pb.collection('transactions').delete(id)
}

export async function marcarEnvio(ids: string[], situacao: 'PENDENTE' | 'ENVIADA') {
  await Promise.all(
    ids.map((id) =>
      pb.collection('transactions').update(id, {
        sent_to_finance: situacao,
        sent_at: situacao === 'ENVIADA' ? new Date().toISOString() : '',
      }),
    ),
  )
}

// ---------------- RESUMO POR CLIENTE (view) ----------------

/**
 * Lê a view `client_summary`: uma linha por cliente já com capital, consumo,
 * serviço, dinheiro, saldo e número de lançamentos somados no banco.
 *
 * Isso substitui carregar os 946 lançamentos na abertura do painel — que dava
 * ~1 MB de JSON no celular e fazia o app parecer travado (medido em 19/11).
 */
export async function listarResumoClientes(): Promise<ResumoCliente[]> {
  const res = await pb.collection('client_summary').getFullList({ sort: '-saldo' })
  return res.map((r: any) => ({
    cliente: {
      id: r.id,
      name: r.name || '',
      nickname: r.nickname || '',
      doc: r.doc || '',
      phone: r.phone || '',
      active: r.active !== false,
      revisar: !!r.revisar,
    } as Cliente,
    capital: Number(r.capital || 0),
    consumo: Number(r.consumo || 0),
    servico: Number(r.servico || 0),
    dinheiro: Number(r.dinheiro || 0),
    saldo: Number(r.saldo || 0),
    lancamentos: Number(r.lancamentos || 0),
  }))
}

// ---------------- PRODUTOS ----------------

/**
 * Normaliza texto para busca: sem acento e em maiúscula.
 *
 * O catálogo é digitado em MAIÚSCULA COM acento ("CÂMERA"). Se a pessoa
 * digitar "camera", a comparação do banco não acha nada — então a busca é
 * feita sobre as duas formas: como veio e sem acento.
 */
function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

let cacheProdutos: Produto[] | null = null

/**
 * Catálogo de produtos.
 *
 * A busca é LOCAL, não no banco. Motivo medido: o catálogo é digitado em
 * MAIÚSCULA COM acento ("CÂMERA BULLET"), e a comparação do SQLite não ignora
 * acento — buscar "camera" devolvia ZERO resultados. Trazer as 1.511 linhas
 * (~150 KB) uma vez e filtrar na memória resolve o acento, ignora maiúscula e
 * ainda deixa a busca instantânea enquanto a pessoa digita.
 */
export async function listarProdutos(busca = '', limite = 0): Promise<Produto[]> {
  if (!cacheProdutos) {
    cacheProdutos = (await pb.collection('products').getFullList({
      sort: 'name',
    })) as unknown as Produto[]
  }

  const termo = semAcento(busca.trim().toLowerCase())
  let lista = cacheProdutos
  if (termo) {
    lista = cacheProdutos.filter(
      (p) =>
        semAcento((p.name || '').toLowerCase()).includes(termo) ||
        semAcento((p.category || '').toLowerCase()).includes(termo) ||
        semAcento((p.brand || '').toLowerCase()).includes(termo),
    )
  }
  return limite > 0 ? lista.slice(0, limite) : lista
}

/** Limpa o cache (chamado depois de gravar preço/tipo no cadastro). */
export function limparCacheProdutos() {
  cacheProdutos = null
}

export async function salvarProduto(dados: Partial<Produto>, id?: string) {
  return id ? pb.collection('products').update(id, dados) : pb.collection('products').create(dados)
}

// ---------------- ORÇAMENTOS ----------------

export async function obterOrcamento(id: string): Promise<Orcamento> {
  return (await pb.collection('quotes').getOne(id, {
    expand: 'client',
  })) as unknown as Orcamento
}

export async function listarOrcamentos(): Promise<Orcamento[]> {
  const res = await pb.collection('quotes').getFullList({
    sort: '-date',
    expand: 'client',
  })
  return res as unknown as Orcamento[]
}

export async function salvarOrcamento(dados: Partial<Orcamento>, id?: string) {
  return id ? pb.collection('quotes').update(id, dados) : pb.collection('quotes').create(dados)
}

export async function apagarOrcamento(id: string) {
  return pb.collection('quotes').delete(id)
}

// ---------------- INDICADORES ----------------

export interface ResumoCliente {
  cliente: Cliente
  capital: number
  consumo: number
  servico: number
  dinheiro: number
  saldo: number
  lancamentos: number
}

/** Agrupa lançamentos por cliente e calcula os totais de cada divisão */
export function resumirPorCliente(clientes: Cliente[], lancamentos: Lancamento[]): ResumoCliente[] {
  const mapa = new Map<string, ResumoCliente>()
  for (const c of clientes) {
    mapa.set(c.id, {
      cliente: c,
      capital: 0,
      consumo: 0,
      servico: 0,
      dinheiro: 0,
      saldo: 0,
      lancamentos: 0,
    })
  }
  for (const l of lancamentos) {
    const alvo = mapa.get(l.client)
    if (!alvo) continue
    // o sinal vem do valor gravado (pagamento negativo abate, crédito soma)
    const v = totalDaLinha(l)
    if (l.kind === 'CAPITAL') alvo.capital += v
    else if (l.kind === 'CONSUMO') alvo.consumo += v
    else if (l.kind === 'SERVICO') alvo.servico += v
    else alvo.dinheiro += v
    alvo.lancamentos += 1
  }
  for (const r of mapa.values()) {
    // dinheiro já entra com o sinal: soma tudo
    r.saldo = r.capital + r.consumo + r.servico + r.dinheiro
  }
  return Array.from(mapa.values())
}
