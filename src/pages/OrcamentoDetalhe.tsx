/**
 * Documento do orçamento / pedido — o que sai no PDF.
 *
 * Layout segue a proposta da planilha do Felipe: cabeçalho com a logomarca e
 * os dados da empresa, bloco do cliente, tabela de itens com tipo (capital /
 * consumo / serviço), valor unitário e total, condições de pagamento e as
 * assinaturas.
 *
 * Regras que vieram do uso real:
 *  - a razão social do cliente é o que aparece; o apelido NUNCA é impresso;
 *  - o total é calculado, não digitado;
 *  - quem não assinou não aparece: as colunas se ajustam.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obterOrcamento, salvarOrcamento, listarLancamentos, salvarLancamento } from '@/lib/crm'
import { obterEmpresa, urlArquivo, type DadosEmpresa } from '@/lib/empresa'
import pb from '@/lib/pocketbase/client'
import { brl, dataBR, TIPOS, type Orcamento, type ItemOrcamento } from '@/types/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import SignaturePad, { type SignaturePadRef } from '@/components/SignaturePad'
import {
  ArrowLeft,
  Loader2,
  Printer,
  Download,
  CheckCircle2,
  Truck,
  Receipt,
  Camera,
  PenLine,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export default function OrcamentoDetalhe() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [doc, setDoc] = useState<Orcamento | null>(null)
  const [empresa, setEmpresa] = useState<DadosEmpresa>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [entregador, setEntregador] = useState('')
  const [cargo, setCargo] = useState('')
  const [assinatura, setAssinatura] = useState<SignaturePadRef | null>(null)
  const [mostrarAssinatura, setMostrarAssinatura] = useState(false)
  const [fotos, setFotos] = useState<File[]>([])

  const carregar = async () => {
    if (!id) return
    setCarregando(true)
    try {
      const [d, e] = await Promise.all([obterOrcamento(id), obterEmpresa()])
      setDoc(d)
      setEmpresa(e)
      setEntregador(d.delivered_by_name || '')
      setCargo(d.delivered_by_role || '')
    } catch {
      toast.error('Documento não encontrado.')
      navegar('/orcamentos')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const itens: ItemOrcamento[] = doc?.items || []
  const total = itens.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)

  const urlLogo = urlArquivo(empresa, 'logo')
  const urlAssinaturaDiretor = urlArquivo(empresa, 'assinatura_diretor')

  /** Salva as assinaturas/entregador/fotos e avança o status */
  const registrarEntrega = async () => {
    if (!doc) return
    setSalvando(true)
    try {
      const form = new FormData()
      form.append('delivered_by_name', entregador.toUpperCase())
      form.append('delivered_by_role', cargo.toUpperCase())
      form.append('status', 'ENTREGUE')
      form.append('delivered_at', new Date().toISOString())

      const dataUrl = assinatura?.exportar() || ''
      if (dataUrl.length > 3000) {
        const blob = await (await fetch(dataUrl)).blob()
        form.append(
          'signature_client',
          new File([blob], 'assinatura-cliente.png', { type: 'image/png' }),
        )
      }
      for (const f of fotos) form.append('photos', f)

      await pb.collection('quotes').update(doc.id, form)
      toast.success('Entrega registrada com assinatura e fotos.')
      setMostrarAssinatura(false)
      setFotos([])
      void carregar()
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível registrar a entrega.')
    } finally {
      setSalvando(false)
    }
  }

  /**
   * Fatura: cria os lançamentos no financeiro a partir dos itens do pedido.
   *
   * É o que o Felipe pediu: "clico no botão faturado e ele me gera aquela
   * lista de materiais, similar à planilha, de cliente para cliente".
   * Cada item vira uma linha em `transactions` com o mesmo tipo (capital /
   * consumo / serviço), e o documento passa a FATURADO.
   */
  const faturar = async () => {
    if (!doc) return
    if (
      !confirm(
        `Faturar este pedido?\n\n${itens.length} item(ns) serão lançados no financeiro do cliente.`,
      )
    )
      return
    setSalvando(true)
    try {
      const existentes = await listarLancamentos({ clienteId: doc.client })
      const jaTem = existentes.some((l) => l.work_order_ref === `PEDIDO-${doc.id.slice(-6)}`)
      if (jaTem) {
        toast.error('Este pedido já foi faturado.')
        return
      }

      for (const it of itens) {
        await salvarLancamento({
          client: doc.client,
          date: new Date().toISOString(),
          kind: (it.kind || 'CONSUMO') as any,
          item_type: it.kind === 'SERVICO' ? 'SERVICO' : 'PRODUTO',
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          work_order_ref: `PEDIDO-${doc.id.slice(-6)}`,
          sent_to_finance: 'PENDENTE',
        })
      }

      await salvarOrcamento(
        { status: 'FATURADO', invoiced_at: new Date().toISOString() } as any,
        doc.id,
      )
      toast.success(`${itens.length} item(ns) lançados no faturamento.`)
      void carregar()
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível faturar.')
    } finally {
      setSalvando(false)
    }
  }

  /** Gera o PDF (html2pdf) e abre o menu do sistema para imprimir/enviar */
  const gerarPdf = async (imprimir = false) => {
    const alvo = document.getElementById('documento-pdf')
    if (!alvo) return
    try {
      toast.loading('Gerando PDF...', { id: 'pdf' })
      const { default: html2pdf } = await import('html2pdf.js')
      const nome = `PEDIDO-${(doc?.expand?.client?.nickname || 'CLIENTE').replace(/[^\wÀ-ÿ ]/g, '').replace(/\s+/g, '-')}.pdf`

      const blob: Blob = await (html2pdf() as any)
        .set({
          margin: 8,
          filename: nome,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(alvo)
        .outputPdf('blob')

      toast.success('PDF gerado.', { id: 'pdf' })

      const arquivo = new File([blob], nome, { type: 'application/pdf' })
      if (
        imprimir &&
        (navigator as any).share &&
        (navigator as any).canShare?.({ files: [arquivo] })
      ) {
        // no celular: abre o menu com "Imprimir" (AirPrint)
        await (navigator as any).share({ files: [arquivo], title: nome })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = nome
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 4000)
      }
    } catch (e: any) {
      toast.error('Não foi possível gerar o PDF.', { id: 'pdf' })
      console.error(e)
    }
  }

  if (carregando || !doc) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
      </div>
    )
  }

  const st = doc.status || 'ORCAMENTO'

  // monta a lista de assinaturas; quem não tem imagem aparece em branco
  const assinaturas: { nome: string; cargo: string; img: string }[] = [
    {
      nome: empresa.diretor_nome || 'FELIPE LIMA',
      cargo: 'DIRETOR',
      img: urlAssinaturaDiretor,
    },
  ]
  if (doc.delivered_by_name) {
    assinaturas.push({
      nome: doc.delivered_by_name,
      cargo: doc.delivered_by_role || 'ENTREGADOR',
      img: doc.signature_deliverer
        ? `${pb.baseURL}/api/files/quotes/${doc.id}/${doc.signature_deliverer}`
        : '',
    })
  }
  assinaturas.push({
    nome: doc.expand?.client?.name || 'CLIENTE',
    cargo: 'RECEBIDO POR',
    img: doc.signature_client
      ? `${pb.baseURL}/api/files/quotes/${doc.id}/${doc.signature_client}`
      : '',
  })
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navegar('/orcamentos')}
          className="h-8 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black truncate">
            {doc.expand?.client?.nickname || 'Documento'}
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {st} · {itens.length} item(ns) · {brl(total)}
          </p>
        </div>
      </div>

      {/* ações */}
      <div className="flex flex-wrap gap-1.5 print:hidden">
        <Button
          onClick={() => gerarPdf(false)}
          className="h-8 text-[11px] bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white gap-1.5 flex-1"
        >
          <Download className="w-3.5 h-3.5" /> Baixar PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => gerarPdf(true)}
          className="h-8 text-[11px] gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimir
        </Button>
        {st === 'PEDIDO' && (
          <Button
            variant="outline"
            onClick={() => setMostrarAssinatura(true)}
            className="h-8 text-[11px] gap-1.5 text-indigo-800"
          >
            <Truck className="w-3.5 h-3.5" /> Registrar entrega
          </Button>
        )}
        {(st === 'ENTREGUE' || st === 'PEDIDO') && (
          <Button
            variant="outline"
            onClick={faturar}
            disabled={salvando}
            className="h-8 text-[11px] gap-1.5 text-emerald-800"
          >
            <Receipt className="w-3.5 h-3.5" /> Faturar
          </Button>
        )}
      </div>

      {/* registrar entrega */}
      {mostrarAssinatura && (
        <Card className="border-indigo-300 print:hidden">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Registrar entrega</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarAssinatura(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Quem entregou</Label>
                <Input
                  value={entregador}
                  onChange={(e) => setEntregador(e.target.value)}
                  placeholder="LUCIANA"
                  className="h-8 text-xs uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Cargo</Label>
                <Input
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="VENDEDORA"
                  className="h-8 text-xs uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] flex items-center gap-1">
                <PenLine className="w-3 h-3" /> Assinatura do cliente
              </Label>
              <SignaturePad onCanvasReady={setAssinatura} altura={110} />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] flex items-center gap-1">
                <Camera className="w-3 h-3" /> Fotos do material entregue
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={(e) => setFotos(Array.from(e.target.files || []))}
                className="h-8 text-[10px]"
              />
              {fotos.length > 0 && (
                <p className="text-[9px] text-muted-foreground">
                  {fotos.length} foto(s) selecionada(s)
                </p>
              )}
            </div>

            <Button
              onClick={registrarEntrega}
              disabled={salvando}
              className="w-full h-9 bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white text-xs gap-1.5"
            >
              {salvando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Confirmar entrega
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ============ DOCUMENTO ============ */}
      <div id="documento-pdf" className="bg-white rounded-lg border p-4 space-y-3">
        {/* cabeçalho */}
        <div className="flex items-start gap-3 border-b-2 border-[#0B3D91] pb-2">
          {urlLogo ? (
            <img src={urlLogo} alt="Logomarca" className="h-16 w-auto object-contain" />
          ) : (
            <div className="h-16 w-16 rounded bg-[#0B3D91] text-white flex items-center justify-center font-black text-xl">
              LM
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-[#0B3D91] leading-tight">
              {empresa.nome_fantasia || 'LM SERVIÇOS'}
            </p>
            <p className="text-[8px] text-slate-600 leading-tight">{empresa.razao_social}</p>
            <p className="text-[8px] text-slate-600 leading-tight">
              CNPJ {empresa.cnpj}
              {empresa.ie ? ` · IE ${empresa.ie}` : ''}
            </p>
            <p className="text-[8px] text-slate-600 leading-tight">{empresa.endereco}</p>
            <p className="text-[8px] text-slate-600 leading-tight">
              {empresa.telefone} · {empresa.email}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] font-black uppercase text-[#0B3D91]">
              {st === 'ORCAMENTO'
                ? 'ORÇAMENTO'
                : st === 'PEDIDO'
                  ? 'PEDIDO'
                  : st === 'ENTREGUE'
                    ? 'ENTREGA'
                    : 'FATURADO'}
            </p>
            <p className="text-[8px] text-slate-600">
              Nº {doc.number || doc.id.slice(-6).toUpperCase()}
            </p>
            <p className="text-[8px] text-slate-600">{dataBR(doc.date || doc.created)}</p>
          </div>
        </div>

        {/* cliente */}
        <div className="bg-slate-50 rounded p-2 space-y-0.5">
          <p className="text-[9px] font-black text-slate-700 uppercase">Cliente</p>
          <p className="text-[10px] font-bold">{doc.expand?.client?.name}</p>
          <p className="text-[8px] text-slate-600">
            {doc.expand?.client?.doc ? `CNPJ/CPF ${doc.expand.client.doc}` : ''}
            {doc.expand?.client?.phone ? ` · ${doc.expand.client.phone}` : ''}
          </p>
          {doc.expand?.client?.address && (
            <p className="text-[8px] text-slate-600">
              {doc.expand.client.address}
              {doc.expand.client.city ? ` — ${doc.expand.client.city}` : ''}
            </p>
          )}
          {doc.expand?.client?.contact_name && (
            <p className="text-[8px] text-slate-600">Contato: {doc.expand.client.contact_name}</p>
          )}
        </div>

        {/* itens */}
        <table className="w-full text-[8.5px] border-collapse">
          <thead>
            <tr className="bg-[#0B3D91] text-white">
              <th className="p-1 text-left w-8">#</th>
              <th className="p-1 text-left w-12">TIPO</th>
              <th className="p-1 text-left">DESCRIÇÃO</th>
              <th className="p-1 text-right w-8">QTD</th>
              <th className="p-1 text-right w-16">UNIT.</th>
              <th className="p-1 text-right w-20">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it, i) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="p-1 text-slate-500">{i + 1}</td>
                <td className="p-1">
                  <span
                    className={`text-[7px] px-1 py-0.5 rounded font-bold ${
                      it.kind === 'CAPITAL'
                        ? 'bg-indigo-100 text-indigo-900'
                        : it.kind === 'SERVICO'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-sky-100 text-sky-900'
                    }`}
                  >
                    {it.kind === 'CAPITAL' ? 'CAP' : it.kind === 'SERVICO' ? 'SERV' : 'CONS'}
                  </span>
                </td>
                <td className="p-1">{it.description}</td>
                <td className="p-1 text-right font-mono">{Number(it.quantity)}</td>
                <td className="p-1 text-right font-mono">{brl(Number(it.unit_price))}</td>
                <td className="p-1 text-right font-mono font-bold">
                  {brl(Number(it.quantity) * Number(it.unit_price))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={5}
                className="p-1.5 text-right font-black text-[10px] border-t-2 border-[#0B3D91]"
              >
                TOTAL
              </td>
              <td className="p-1.5 text-right font-black font-mono text-[11px] border-t-2 border-[#0B3D91] text-[#0B3D91]">
                {brl(total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* condições */}
        <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-700 border-t pt-2">
          <div>
            <p className="font-bold text-[8.5px]">CONDIÇÕES DE PAGAMENTO</p>
            <p>{doc.payment_terms || 'A combinar / Conforme contrato'}</p>
          </div>
          <div>
            <p className="font-bold text-[8.5px]">ENTREGA</p>
            <p>{doc.delivery_terms || 'Imediato / Agendado'}</p>
            <p className="mt-1">
              <span className="font-bold">VALIDADE:</span> {doc.validity_days || 15} dias
            </p>
          </div>
        </div>

        {/* assinaturas */}
        <div
          className="grid gap-3 pt-4 border-t"
          style={{ gridTemplateColumns: `repeat(${assinaturas.length}, 1fr)` }}
        >
          {assinaturas.map((a) => (
            <div key={a.nome} className="text-center break-inside-avoid">
              <div className="h-10 flex items-end justify-center mb-1">
                {a.img ? (
                  <img src={a.img} alt="Assinatura" className="max-h-10 object-contain" />
                ) : (
                  <span className="text-[7px] text-slate-300">rubrica não cadastrada</span>
                )}
              </div>
              <div className="border-t border-slate-800 pt-0.5">
                <p className="text-[7.5px] font-bold truncate">{a.nome}</p>
                <p className="text-[6.5px] text-slate-500 uppercase">{a.cargo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
