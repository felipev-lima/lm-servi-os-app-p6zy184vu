import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getServices } from '@/services/system'
import { createQuote } from '@/services/quotes'
import type { ServiceRecord } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Wrench,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
  HardHat,
  Send,
  Loader2,
} from 'lucide-react'

export default function Index() {
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [loadingServices, setLoadingServices] = useState(true)

  // Form states
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [description, setDescription] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null)

  useEffect(() => {
    getServices()
      .then((data) => {
        setServices(data)
        if (data.length > 0) {
          setServiceName(data[0].name)
        }
      })
      .catch((err) => console.error('Erro ao carregar serviços:', err))
      .finally(() => setLoadingServices(false))
  }, [])

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const newQuote = await createQuote({
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        client_address: clientAddress,
        service_name: serviceName,
        notes: description,
        status: 'pendente',
        items: [
          {
            description: description || `Solicitação via site: ${serviceName}`,
            quantity: 1,
            unit_price: 0,
            total: 0,
          },
        ],
      })

      setSubmittedOrderId(newQuote.id)
      setSubmittedSuccess(true)
      // Limpar formulário
      setClientName('')
      setClientPhone('')
      setClientEmail('')
      setClientAddress('')
      setDescription('')
    } catch (err) {
      console.error('Erro ao enviar pedido de orçamento:', err)
      alert('Erro ao enviar solicitação. Por favor, tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-md shadow-blue-500/30">
              LM
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white">LM SERVIÇOS</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/60">
                Construído com maetros
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#orcamento"
              className="hidden md:inline-flex text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Pedir Orçamento
            </a>
            <a
              href="#servicos"
              className="hidden md:inline-flex text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Nossos Serviços
            </a>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-600/30"
            >
              Área da Equipe
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-slate-950 to-slate-900/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Gestão Ágil • Qualidade Técnica • Resposta Rápida
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Soluções especializadas em manutenção e serviços prediais
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                A LM SERVIÇOS oferece suporte completo em instalações elétricas, hidráulica, pintura
                comercial e manutenção predial contínua. Solicite um orçamento sem compromisso e
                receba atendimento ágil.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#orcamento"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm"
                >
                  Solicitar Orçamento Grátis
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#servicos"
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-5 py-3 rounded-xl border border-slate-700 transition-colors text-sm"
                >
                  Conhecer Especialidades
                </a>
              </div>

              {/* Badges de confiança */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium">
                    Garantia em todos os serviços
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium">
                    Atendimento no mesmo dia
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <HardHat className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium">Equipe certificada</span>
                </div>
              </div>
            </div>

            {/* Quick Hero Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Central de Atendimento LM
                  </div>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Tanto clientes corporativos, condomínios quanto residências contam com o padrão LM
                  de excelência e acompanhamento em tempo real das ordens de serviço.
                </p>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Atendimento:</span>
                    <span className="font-semibold text-white">Segunda a Sábado, 07h às 19h</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Emergências:</span>
                    <span className="font-semibold text-emerald-400">Plantão Técnico 24h</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Sede:</span>
                    <span className="font-semibold text-white">São Paulo e Grande SP</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <a
                    href="#orcamento"
                    className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
                  >
                    Preencher formulário rápido de orçamento ↓
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços Section */}
      <section id="servicos" className="py-16 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Serviços Prestados pela LM SERVIÇOS
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Trabalhos executados com rigor técnico, ferramentas profissionais e garantia de
              entrega.
            </p>
          </div>

          {loadingServices ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-5 hover:border-blue-500/50 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800/80 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">
                      {svc.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {svc.description ||
                        'Execução técnica completa com materiais de primeira linha e laudo de entrega.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {svc.base_price ? (
                      <span className="text-slate-400">
                        A partir de{' '}
                        <strong className="text-emerald-400 font-semibold">
                          R$ {svc.base_price.toFixed(2)}
                        </strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">Sob consulta</span>
                    )}
                    <a
                      href="#orcamento"
                      onClick={() => setServiceName(svc.name)}
                      className="text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Pedir este <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Formulário de Orçamento Section */}
      <section id="orcamento" className="py-16 sm:py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/50">
              Atendimento Imediato
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              Peça seu Orçamento Sem Compromisso
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
              Preencha os dados abaixo. Sua solicitação é enviada diretamente para a equipe da LM
              SERVIÇOS e aparece na hora no painel operacional.
            </p>
          </div>

          <Card className="bg-slate-900/95 border-slate-800 shadow-2xl text-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                Formulário de Solicitação
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Nossa equipe técnica analisa a descrição e entra em contato rapidamente com a melhor
                proposta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submittedSuccess ? (
                <div className="p-8 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/60 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Solicitação enviada com sucesso!</h3>
                  <p className="text-sm text-emerald-200/90 max-w-md mx-auto">
                    Recebemos seu pedido de orçamento. A equipe da LM SERVIÇOS já visualizou a
                    notificação no painel e entrará em contato em breve.
                  </p>
                  {submittedOrderId && (
                    <p className="text-xs font-mono text-slate-400">
                      Código de rastreio interno:{' '}
                      <span className="text-emerald-400 font-semibold">{submittedOrderId}</span>
                    </p>
                  )}
                  <div className="pt-4 flex flex-wrap justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmittedSuccess(false)
                        setSubmittedOrderId(null)
                      }}
                      className="border-emerald-600/40 text-emerald-200 hover:bg-emerald-950/60"
                    >
                      Enviar outro orçamento
                    </Button>
                    <Link
                      to="/login"
                      className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                    >
                      Acessar painel (Equipe)
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitQuote} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName" className="text-xs font-semibold text-slate-300">
                        Seu Nome ou Razão Social *
                      </Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ex: Condomínio Solar / Roberto Lima"
                        required
                        className="bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientPhone" className="text-xs font-semibold text-slate-300">
                        Telefone / WhatsApp *
                      </Label>
                      <Input
                        id="clientPhone"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="(11) 98765-4321"
                        required
                        className="bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail" className="text-xs font-semibold text-slate-300">
                        E-mail para resposta
                      </Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="contato@empresa.com.br"
                        className="bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="clientAddress"
                        className="text-xs font-semibold text-slate-300"
                      >
                        Local do serviço (Endereço / Bairro / Cidade)
                      </Label>
                      <Input
                        id="clientAddress"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                        className="bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceName" className="text-xs font-semibold text-slate-300">
                      Tipo de Serviço Principal *
                    </Label>
                    <select
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      required
                      className="w-full rounded-md bg-slate-950 border border-slate-700 text-white p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {services.map((svc) => (
                        <option key={svc.id} value={svc.name}>
                          {svc.name}
                        </option>
                      ))}
                      <option value="Outro Serviço">Outro serviço sob demanda</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-semibold text-slate-300">
                      Descrição da necessidade ou detalhes do reparo *
                    </Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explique o que precisa ser feito, dimensões aproximadas, urgência ou preferência de data..."
                      required
                      className="bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 text-base shadow-lg shadow-blue-600/30"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Enviando para a LM SERVIÇOS...
                        </>
                      ) : (
                        <>
                          Enviar Pedido de Orçamento Agora
                          <Send className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-center text-slate-400 mt-2">
                      Ao enviar, seus dados são salvos em nosso banco integrado com o painel de
                      atendimento.
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">LM SERVIÇOS</span>
            <span>•</span>
            <span>Gestão Operacional (cópia FL Serviços c/ maetros)</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white underline">
              Login da Equipe
            </Link>
            <Link to="/esqueci-senha" className="text-slate-300 hover:text-white underline">
              Recuperar Senha
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
