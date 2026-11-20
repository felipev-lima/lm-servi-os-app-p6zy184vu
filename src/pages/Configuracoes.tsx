/**
 * Configurações da empresa — o que sai no PDF.
 *
 * Aqui o Felipe troca a logomarca, os dados e a assinatura do diretor sem
 * depender de mim. Tudo grava em `settings` e o PDF lê de lá.
 */
import { useEffect, useRef, useState } from 'react'
import {
  obterEmpresa,
  salvarEmpresa,
  enviarArquivoEmpresa,
  urlArquivo,
  limparCacheEmpresa,
  type DadosEmpresa,
} from '@/lib/empresa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import SignaturePad, { type SignaturePadRef } from '@/components/SignaturePad'
import {
  Building2,
  Upload,
  Loader2,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  PenLine,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function Configuracoes() {
  const [empresa, setEmpresa] = useState<DadosEmpresa>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [mostrarPad, setMostrarPad] = useState(false)
  const padRef = useRef<SignaturePadRef | null>(null)
  const inputLogo = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    obterEmpresa(true)
      .then(setEmpresa)
      .finally(() => setCarregando(false))
  }, [])

  const set = (campo: keyof DadosEmpresa, valor: string) =>
    setEmpresa((e) => ({ ...e, [campo]: valor }))

  const salvar = async () => {
    setSalvando(true)
    try {
      const salvo = await salvarEmpresa(empresa)
      setEmpresa(salvo)
      limparCacheEmpresa()
      toast.success('Dados da empresa salvos.')
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const enviarLogo = async (arquivo: File) => {
    setEnviando('logo')
    try {
      const salvo = await enviarArquivoEmpresa('logo', arquivo)
      setEmpresa(salvo)
      toast.success('Logomarca atualizada.')
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível enviar a logo.')
    } finally {
      setEnviando(null)
    }
  }

  const salvarAssinatura = async () => {
    const dataUrl = padRef.current?.exportar() || ''
    if (dataUrl.length < 3000) {
      toast.error('Desenhe a assinatura antes de salvar.')
      return
    }
    setEnviando('assinatura')
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const arquivo = new File([blob], 'assinatura-diretor.png', { type: 'image/png' })
      const salvo = await enviarArquivoEmpresa('assinatura_diretor', arquivo)
      setEmpresa(salvo)
      setMostrarPad(false)
      toast.success('Assinatura do diretor salva.')
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível salvar a assinatura.')
    } finally {
      setEnviando(null)
    }
  }

  const urlLogo = urlArquivo(empresa, 'logo')
  const urlAssinatura = urlArquivo(empresa, 'assinatura_diretor')

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-xl">
      <div>
        <h1 className="text-xl font-black tracking-tight">Configurações</h1>
        <p className="text-[11px] text-muted-foreground">
          Estes dados aparecem no PDF dos orçamentos e pedidos.
        </p>
      </div>

      {/* LOGO */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Logomarca
          </Label>

          <div className="flex items-center gap-3">
            <div className="w-24 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
              {urlLogo ? (
                <img
                  src={urlLogo}
                  alt="Logomarca"
                  className="max-w-full max-h-full object-contain p-1"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <input
                ref={inputLogo}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void enviarLogo(f)
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => inputLogo.current?.click()}
                disabled={enviando === 'logo'}
                className="h-8 text-[11px] gap-1.5 w-full"
              >
                {enviando === 'logo' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Trocar logomarca
              </Button>
              <p className="text-[9px] text-muted-foreground">
                PNG com fundo transparente fica melhor no PDF.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DADOS */}
      <Card>
        <CardContent className="p-3 space-y-2.5">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Dados da empresa
          </Label>

          <div className="space-y-1">
            <Label className="text-[11px]">Nome fantasia</Label>
            <Input
              value={empresa.nome_fantasia || ''}
              onChange={(e) => set('nome_fantasia', e.target.value)}
              className="h-9 text-xs uppercase"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Razão social</Label>
            <Input
              value={empresa.razao_social || ''}
              onChange={(e) => set('razao_social', e.target.value)}
              className="h-9 text-xs uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">CNPJ</Label>
              <Input
                value={empresa.cnpj || ''}
                onChange={(e) => set('cnpj', e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Inscrição estadual</Label>
              <Input
                value={empresa.ie || ''}
                onChange={(e) => set('ie', e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Endereço completo</Label>
            <Input
              value={empresa.endereco || ''}
              onChange={(e) => set('endereco', e.target.value)}
              className="h-9 text-xs uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Telefone</Label>
              <Input
                value={empresa.telefone || ''}
                onChange={(e) => set('telefone', e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">E-mail</Label>
              <Input
                value={empresa.email || ''}
                onChange={(e) => set('email', e.target.value.toLowerCase())}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ASSINATURA DO DIRETOR */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            <PenLine className="w-3.5 h-3.5" /> Assinatura do diretor
          </Label>

          <div className="space-y-1">
            <Label className="text-[11px]">Nome que aparece abaixo da assinatura</Label>
            <Input
              value={empresa.diretor_nome || ''}
              onChange={(e) => set('diretor_nome', e.target.value)}
              placeholder="FELIPE LIMA"
              className="h-9 text-xs uppercase"
            />
          </div>

          {urlAssinatura && !mostrarPad && (
            <div className="rounded-md border bg-slate-50 p-2 flex items-center gap-2">
              <img src={urlAssinatura} alt="Assinatura" className="h-12 object-contain" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMostrarPad(true)}
                className="h-7 text-[10px] ml-auto"
              >
                Trocar
              </Button>
            </div>
          )}

          {(!urlAssinatura || mostrarPad) && (
            <>
              <SignaturePad onCanvasReady={(r) => (padRef.current = r)} altura={120} />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={salvarAssinatura}
                  disabled={enviando === 'assinatura'}
                  className="h-8 text-[11px] bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white gap-1.5 flex-1"
                >
                  {enviando === 'assinatura' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Salvar assinatura
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => padRef.current?.limpar()}
                  className="h-8 text-[11px] gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={salvar}
        disabled={salvando}
        className="w-full h-10 bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white font-semibold gap-2"
      >
        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {salvando ? 'Salvando...' : 'Salvar dados'}
      </Button>
    </div>
  )
}
