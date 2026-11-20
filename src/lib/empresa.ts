/**
 * Dados da empresa para o PDF.
 *
 * Uma única linha em `settings`: razão social, fantasia, CNPJ, endereço,
 * telefone, e-mail, logomarca e assinatura do diretor.
 * O PDF lê daqui — assim o Felipe troca a logo sem depender de mim.
 */
import pb from '@/lib/pocketbase/client'

export interface DadosEmpresa {
  id?: string
  razao_social?: string
  nome_fantasia?: string
  cnpj?: string
  ie?: string
  endereco?: string
  telefone?: string
  email?: string
  diretor_nome?: string
  logo?: string
  assinatura_diretor?: string
}

/** URL pública do arquivo guardado em settings */
export function urlArquivo(registro: DadosEmpresa, campo: 'logo' | 'assinatura_diretor') {
  const nome = registro[campo]
  if (!nome || !registro.id) return ''
  return `${pb.baseURL}/api/files/settings/${registro.id}/${nome}`
}

let cache: DadosEmpresa | null = null

export async function obterEmpresa(forcar = false): Promise<DadosEmpresa> {
  if (cache && !forcar) return cache
  try {
    const res = await pb.collection('settings').getFullList({ perPage: 1 } as any)
    cache = (res[0] as unknown as DadosEmpresa) || {}
  } catch {
    cache = {}
  }
  return cache
}

export function limparCacheEmpresa() {
  cache = null
}

export async function salvarEmpresa(dados: Partial<DadosEmpresa>): Promise<DadosEmpresa> {
  const atual = await obterEmpresa(true)
  const salvo = atual.id
    ? await pb.collection('settings').update(atual.id, dados as any)
    : await pb.collection('settings').create(dados as any)
  cache = salvo as unknown as DadosEmpresa
  return cache
}

/** Envia um arquivo (logo ou assinatura) para o registro da empresa */
export async function enviarArquivoEmpresa(
  campo: 'logo' | 'assinatura_diretor',
  arquivo: File,
): Promise<DadosEmpresa> {
  const atual = await obterEmpresa(true)
  const form = new FormData()
  form.append(campo, arquivo)
  const salvo = atual.id
    ? await pb.collection('settings').update(atual.id, form)
    : await pb.collection('settings').create(form)
  cache = salvo as unknown as DadosEmpresa
  return cache
}
