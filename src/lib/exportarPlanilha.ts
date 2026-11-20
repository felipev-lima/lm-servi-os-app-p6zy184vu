/**
 * Exportação para Excel sem biblioteca externa.
 *
 * O projeto não tem (e não pode ter, pelo template) uma lib de xlsx. Mas o
 * Excel abre nativamente um arquivo HTML com tabela salvo como `.xls` — é o
 * formato que o próprio Excel usa há décadas para "tabela da web".
 *
 * Vantagem: zero dependência, arquivo abre no Excel, no Numbers e no Google
 * Planilhas, com as colunas já formatadas e os subtotais coloridos.
 */

export interface ColunaPlanilha {
  titulo: string
  /** largura em px, usada no <col> */
  largura?: number
  /** alinhamento do conteúdo */
  alinhar?: 'left' | 'right' | 'center'
  /** formata como moeda brasileira */
  moeda?: boolean
}

export interface BlocoPlanilha {
  /** linhas acima da tabela (ex.: dados do cliente) */
  cabecalho?: { rotulo: string; valor: string }[]
  colunas: ColunaPlanilha[]
  linhas: (string | number | null)[][]
  /** linhas de total, com destaque */
  totais?: { rotulo: string; valor: number; cor?: string }[]
  titulo?: string
}

const escapar = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const moedaBR = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Monta o HTML (tabela) do bloco — usado tanto para tela quanto para o .xls */
export function montarTabelaHTML(bloco: BlocoPlanilha): string {
  const cols = bloco.colunas.map((c) => `<col style="width:${c.largura || 120}px">`).join('')

  const cabecalhoInfo = (bloco.cabecalho || [])
    .map(
      (l) =>
        `<tr><td colspan="2" style="font-weight:bold;background:#F2F2F2;border:1px solid #BFBFBF">${escapar(
          l.rotulo,
        )}</td><td colspan="${Math.max(1, bloco.colunas.length - 2)}" style="border:1px solid #BFBFBF">${escapar(
          l.valor,
        )}</td></tr>`,
    )
    .join('')

  const th = `<tr>${bloco.colunas
    .map(
      (c) =>
        `<th style="background:#0B3D91;color:#FFFFFF;font-weight:bold;border:1px solid #BFBFBF;padding:4px 6px;text-align:${
          c.alinhar || 'left'
        };font-size:11px">${escapar(c.titulo)}</th>`,
    )
    .join('')}</tr>`

  const corpo = bloco.linhas
    .map(
      (linha) =>
        `<tr>${linha
          .map((celula, i) => {
            const c = bloco.colunas[i]
            const alinhar = c?.alinhar || 'left'
            const valor =
              c?.moeda && typeof celula === 'number' ? moedaBR(celula) : escapar(celula ?? '')
            return `<td style="border:1px solid #D9D9D9;padding:3px 6px;text-align:${alinhar};font-size:11px">${valor}</td>`
          })
          .join('')}</tr>`,
    )
    .join('')

  const totais = (bloco.totais || [])
    .map(
      (t) =>
        `<tr><td colspan="${Math.max(1, bloco.colunas.length - 1)}" style="font-weight:bold;text-align:right;border:1px solid #BFBFBF;background:${
          t.cor || '#E8F0FB'
        };padding:4px 6px;font-size:11px">${escapar(t.rotulo)}</td><td style="font-weight:bold;text-align:right;border:1px solid #BFBFBF;background:${
          t.cor || '#E8F0FB'
        };padding:4px 6px;font-size:11px">${moedaBR(t.valor)}</td></tr>`,
    )
    .join('')

  const titulo = bloco.titulo
    ? `<tr><td colspan="${Math.max(1, bloco.colunas.length)}" style="font-weight:bold;font-size:13px;background:#0B3D91;color:#FFFFFF;padding:6px">${escapar(
        bloco.titulo,
      )}</td></tr>`
    : ''

  return `<table style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif">${titulo}${cabecalhoInfo}${th}${corpo}${totais}</table>`
}

/** Gera o arquivo .xls e dispara o download. */
export function baixarExcel(nomeArquivo: string, blocos: BlocoPlanilha[]): void {
  const conteudo = blocos.map(montarTabelaHTML).join('<br><br>')

  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Relatorio</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>${conteudo}</body></html>`

  const blob = new Blob(['\ufeff', html], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo.endsWith('.xls') ? nomeArquivo : `${nomeArquivo}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
