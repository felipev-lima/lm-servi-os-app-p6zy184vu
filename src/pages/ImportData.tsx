import React, { useState } from 'react'
import { createClient } from '@/services/clients'
import { createWorkOrder } from '@/services/workOrders'
import { createQuote } from '@/services/quotes'
import type { WorkOrderStatus } from '@/types/database'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Download,
  Info,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ImportDataPage() {
  const [activeTab, setActiveTab] = useState<'clients' | 'orders'>('clients')
  const [isProcessing, setIsProcessing] = useState(false)
  const [rawText, setRawText] = useState('')
  const [resultLog, setResultLog] = useState<{
    success: boolean
    message: string
    importedCount: number
    errors: string[]
  } | null>(null)

  // Modelo CSV para Clientes
  const sampleClientsCSV = `Nome,Telefone,Email,Endereco,Observacoes
Hospital Santa Clara,(11) 98888-1122,manutencao@santaclara.med.br,Rua das Flores 100 - Centro,Contrato mensal do FL Servicos
Supermercado Nova Estrela,(11) 97777-3344,contato@novaestrela.com.br,Av Brasil 500 - Jardim Paulista,Manutencao eletrica e refrigeracao
Residencial Bela Vista,(11) 96666-5566,sindico@belavista.com.br,Rua das Acácias 45,Atendimento prioritario`

  // Modelo CSV para Ordens de Serviço
  const sampleOrdersCSV = `Cliente,Descricao,Status,Data,Prioridade,Observacoes
Hospital Santa Clara,Revisao periodica do gerador de emergencia e troca de oleo,novo,2025-05-15,urgente,Migrado do FL Servicos
Supermercado Nova Estrela,Reparo no sistema de exaustao e climatizacao da padaria,em_andamento,2025-05-12,alta,Tecnico maetros
Residencial Bela Vista,Substituicao de valvulas da caixa d'agua e boias,concluido,2025-05-04,media,Servico entregue sem pendencias`

  const parseCSVRows = (text: string) => {
    const lines = text
      .trim()
      .split('\n')
      .filter((l) => l.trim().length > 0)
    if (lines.length <= 1) return []

    // Identificar separador: vírgula ou ponto e vírgula (comum no Excel PT-BR)
    const headerLine = lines[0]
    const delimiter = headerLine.includes(';') ? ';' : ','

    const headers = headerLine.split(delimiter).map((h) =>
      h
        .trim()
        .replace(/^["']|["']$/g, '')
        .toLowerCase(),
    )

    const rows: Record<string, string>[] = []
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i]
      // Simples split respeitando delimitador comum
      const values = currentLine.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ''))
      const rowObj: Record<string, string> = {}
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || ''
      })
      rows.push(rowObj)
    }
    return rows
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawText(content)
    }
    reader.readAsText(file)
  }

  const handleImportClients = async (rows: Record<string, string>[]) => {
    let count = 0
    const errs: string[] = []

    for (const r of rows) {
      const name = r['nome'] || r['name'] || r['cliente'] || r['razao social']
      if (!name) {
        errs.push(`Linha ignorada: nome do cliente vazio.`)
        continue
      }

      try {
        await createClient({
          name,
          phone: r['telefone'] || r['phone'] || r['whatsapp'] || '',
          email: r['email'] || r['e-mail'] || '',
          address: r['endereco'] || r['endereço'] || r['address'] || '',
          notes: r['observacoes'] || r['observações'] || r['notes'] || 'Importado do FL Serviços',
        })
        count++
      } catch (err) {
        errs.push(`Erro ao importar cliente "${name}": ${(err as Error).message}`)
      }
    }

    setResultLog({
      success: count > 0,
      message: `Importação de clientes finalizada! ${count} registros cadastrados com sucesso.`,
      importedCount: count,
      errors: errs,
    })
  }

  const handleImportOrders = async (rows: Record<string, string>[]) => {
    let count = 0
    const errs: string[] = []

    for (const r of rows) {
      const clientName = r['cliente'] || r['nome'] || r['client'] || 'Cliente FL Serviços'
      const description = r['descricao'] || r['descrição'] || r['servico'] || r['description']
      if (!description) {
        errs.push(`Linha ignorada: descrição do serviço não informada.`)
        continue
      }

      // Validar ou criar cliente primeiro para garantir relacionamento
      let clientId: string
      try {
        const newClient = await createClient({
          name: clientName,
          phone: r['telefone'] || '',
          email: r['email'] || '',
          notes: 'Criado durante importação de OS do FL Serviços',
        })
        clientId = newClient.id
      } catch {
        errs.push(`Falha ao associar cliente "${clientName}".`)
        continue
      }

      let parsedStatus: WorkOrderStatus = 'novo'
      const rawStatus = (r['status'] || '').toLowerCase()
      if (rawStatus.includes('andamento') || rawStatus === 'em_andamento') {
        parsedStatus = 'em_andamento'
      } else if (
        rawStatus.includes('conclui') ||
        rawStatus === 'concluido' ||
        rawStatus === 'finalizado'
      ) {
        parsedStatus = 'concluido'
      }

      try {
        await createWorkOrder({
          client: clientId,
          description,
          status: parsedStatus,
          date: r['data'] || r['date'] || new Date().toISOString().split('T')[0],
          priority: (r['prioridade'] as any) || 'media',
          notes: r['observacoes'] || r['observações'] || 'Importado via planilha do FL Serviços',
        })
        count++
      } catch (err) {
        errs.push(`Erro ao criar OS "${description.slice(0, 20)}...": ${(err as Error).message}`)
      }
    }

    setResultLog({
      success: count > 0,
      message: `Importação de ordens finalizada! ${count} ordens migradas para a LM SERVIÇOS.`,
      importedCount: count,
      errors: errs,
    })
  }

  const handleExecuteImport = async () => {
    if (!rawText.trim()) {
      alert('Insira ou carregue o conteúdo CSV da planilha antes de continuar.')
      return
    }

    setIsProcessing(true)
    setResultLog(null)

    try {
      const rows = parseCSVRows(rawText)
      if (rows.length === 0) {
        setResultLog({
          success: false,
          message: 'Nenhuma linha válida encontrada no CSV. Verifique o cabeçalho e as linhas.',
          importedCount: 0,
          errors: ['Arquivo vazio ou formato ilegível.'],
        })
        return
      }

      if (activeTab === 'clients') {
        await handleImportClients(rows)
      } else {
        await handleImportOrders(rows)
      }
    } catch (err) {
      console.error('Erro geral ao importar:', err)
      setResultLog({
        success: false,
        message: 'Ocorreu um erro ao processar o arquivo de importação.',
        importedCount: 0,
        errors: [(err as Error).message],
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLoadSample = () => {
    if (activeTab === 'clients') {
      setRawText(sampleClientsCSV)
    } else {
      setRawText(sampleOrdersCSV)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Importar do FL Serviços
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              CSV / Excel
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Envie sua planilha exportada do sistema FL Serviços para migrar clientes e ordens para a
            LM SERVIÇOS.
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as 'clients' | 'orders')
          setResultLog(null)
        }}
        className="space-y-4"
      >
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger
            value="clients"
            className="text-xs font-bold gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            1. Importar Clientes
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="text-xs font-bold gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4" />
            2. Importar Ordens de Serviço
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Upload Form */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="p-5 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>
                    {activeTab === 'clients'
                      ? 'Planilha de Clientes'
                      : 'Planilha de Ordens de Serviço'}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadSample}
                    className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Carregar Exemplo FL Serviços
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Carregue um arquivo .csv exportado do Excel/Google Planilhas ou cole o texto
                  delimitado por vírgula ou ponto-e-vírgula.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* File picker */}
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
                  <FileSpreadsheet className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Selecione o arquivo CSV do seu computador
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Compatível com exportações do FL Serviços em UTF-8
                  </p>
                  <label className="mt-3 inline-block cursor-pointer">
                    <span className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors">
                      Procurar Arquivo CSV
                    </span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Textarea for pasting */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Ou cole os dados do CSV aqui:
                    </span>
                    {rawText && (
                      <button
                        type="button"
                        onClick={() => setRawText('')}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        Limpar texto
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Nome,Telefone,Email,Endereco,Observacoes&#10;Condominio Solar,(11) 98765-4321,contato@solar.com.br,Av Paulista 1200,Cliente ativo..."
                    className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <Button
                  onClick={handleExecuteImport}
                  disabled={isProcessing || !rawText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Importando dados para a LM SERVIÇOS...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Processar e Gravar Registros no Painel
                    </>
                  )}
                </Button>

                {/* Feedback Result */}
                {resultLog && (
                  <Alert
                    className={
                      resultLog.success
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-red-500 bg-red-50 text-red-900'
                    }
                  >
                    {resultLog.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className="text-xs">
                      <p className="font-bold">{resultLog.message}</p>
                      {resultLog.errors.length > 0 && (
                        <div className="mt-2 space-y-1 font-mono text-[11px]">
                          {resultLog.errors.slice(0, 5).map((e, idx) => (
                            <p key={idx}>• {e}</p>
                          ))}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Instructions & Column Mapping */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Instruções de Migração FL
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  A LM SERVIÇOS foi modelada para ser 100% compatível com a estrutura de dados
                  utilizada no FL Serviços.
                </p>

                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 space-y-1.5 text-blue-950">
                  <span className="font-bold block">Colunas esperadas (Clientes):</span>
                  <code className="text-[11px] block text-blue-800">
                    Nome, Telefone, Email, Endereco, Observacoes
                  </code>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 space-y-1.5 text-indigo-950">
                  <span className="font-bold block">Colunas esperadas (Ordens):</span>
                  <code className="text-[11px] block text-indigo-800">
                    Cliente, Descricao, Status, Data, Prioridade, Observacoes
                  </code>
                </div>

                <p className="text-[11px] text-slate-500">
                  Dica: Valores de status aceitos: <strong>novo</strong>,{' '}
                  <strong>em_andamento</strong> ou <strong>concluido</strong>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
