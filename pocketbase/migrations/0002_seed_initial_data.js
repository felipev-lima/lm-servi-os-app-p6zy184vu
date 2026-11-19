migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Administrador inicial: felipev.lima1981@gmail.com
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'felipev.lima1981@gmail.com')
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('felipev.lima1981@gmail.com')
      admin.setPassword('LMServicos@2025')
      admin.setVerified(true)
      admin.set('name', 'Felipe Lima (Administrador)')
      app.save(admin)
    }

    // 2. Colaborador da equipe citado na especificação: maetros
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'maetros@lmservicos.com.br')
    } catch (_) {
      const collab = new Record(users)
      collab.setEmail('maetros@lmservicos.com.br')
      collab.setPassword('Maetros@2025')
      collab.setVerified(true)
      collab.set('name', 'Maetros (Colaborador)')
      app.save(collab)
    }

    // 3. Catálogo de Serviços da LM SERVIÇOS
    const servicesCol = app.findCollectionByNameOrId('services')
    const defaultServices = [
      {
        name: 'Manutenção Predial e Reparos Gerais',
        description:
          'Serviços completos de manutenção corretiva e preventiva em instalações comerciais e residenciais.',
        base_price: 350,
      },
      {
        name: 'Instalação e Manutenção Elétrica',
        description:
          'Quadros de distribuição, cabeamento, circuitos, iluminação LED e laudos técnicos.',
        base_price: 280,
      },
      {
        name: 'Instalações Hidráulicas e Desentupimento',
        description:
          "Conserto de vazamentos, substituição de tubulações, válvulas, registros e caixas d'água.",
        base_price: 220,
      },
      {
        name: 'Pintura Comercial e Residencial',
        description: 'Preparação de superfícies, emassamento, pintura interna, externa e texturas.',
        base_price: 800,
      },
      {
        name: 'Climatização e Ar Condicionado',
        description:
          'Higienização, carga de gás, instalação de splits e manutenção preventiva PMOC.',
        base_price: 250,
      },
    ]

    for (const s of defaultServices) {
      try {
        app.findFirstRecordByData('services', 'name', s.name)
      } catch (_) {
        const rec = new Record(servicesCol)
        rec.set('name', s.name)
        rec.set('description', s.description)
        rec.set('base_price', s.base_price)
        app.save(rec)
      }
    }

    // 4. Clientes iniciais (exemplo realista do FL Serviços)
    const clientsCol = app.findCollectionByNameOrId('clients')
    const sampleClients = [
      {
        name: 'Condomínio Edifício Solar das Palmeiras',
        phone: '(11) 98765-4321',
        email: 'contato@solardaspalmeiras.com.br',
        address: 'Av. Paulista, 1200 - Bela Vista, São Paulo - SP',
        notes: 'Cliente corporativo desde 2023. Síndico: Roberto Martins.',
      },
      {
        name: 'Indústria Metalmecânica Vale Real',
        phone: '(11) 97654-3210',
        email: 'manutencao@valereal.com.br',
        address: 'Rua das Indústrias, 450 - Mooca, São Paulo - SP',
        notes: 'Contrato de manutenção periódica de instalações.',
      },
      {
        name: 'Clínica Odontológica Dente & Arte',
        phone: '(11) 99123-8877',
        email: 'dra.carla@dentedarte.com.br',
        address: 'Rua Augusta, 2100 - Cerqueira César, São Paulo - SP',
        notes: 'Atendimento preferencial fora do horário comercial.',
      },
    ]

    const createdClients = []
    for (const c of sampleClients) {
      let clientRec
      try {
        clientRec = app.findFirstRecordByData('clients', 'name', c.name)
      } catch (_) {
        clientRec = new Record(clientsCol)
        clientRec.set('name', c.name)
        clientRec.set('phone', c.phone)
        clientRec.set('email', c.email)
        clientRec.set('address', c.address)
        clientRec.set('notes', c.notes)
        app.save(clientRec)
      }
      createdClients.push(clientRec)
    }

    // 5. Ordens de Serviço iniciais
    const woCol = app.findCollectionByNameOrId('work_orders')
    const sampleOrders = [
      {
        clientIndex: 0,
        description: 'Revisão completa do quadro de bombas e troca de disjuntor geral do térreo.',
        status: 'novo',
        date: '2025-05-10',
        priority: 'alta',
        notes: 'Ordem gerada após inspeção rotineira.',
      },
      {
        clientIndex: 1,
        description:
          'Reparo elétrico na linha de montagem e substituição de luminárias LED de alta potência.',
        status: 'em_andamento',
        date: '2025-05-08',
        priority: 'urgente',
        notes: 'Técnico maetros designado para execução.',
      },
      {
        clientIndex: 2,
        description: 'Pintura e impermeabilização da recepção e consultório principal.',
        status: 'concluido',
        date: '2025-05-02',
        priority: 'media',
        notes: 'Serviço finalizado com termo de aceite assinado.',
      },
    ]

    for (const wo of sampleOrders) {
      try {
        app.findFirstRecordByData('work_orders', 'description', wo.description)
      } catch (_) {
        const targetClient = createdClients[wo.clientIndex]
        if (targetClient) {
          const orderRec = new Record(woCol)
          orderRec.set('client', targetClient.id)
          orderRec.set('description', wo.description)
          orderRec.set('status', wo.status)
          orderRec.set('date', wo.date)
          orderRec.set('priority', wo.priority)
          orderRec.set('notes', wo.notes)
          app.save(orderRec)
        }
      }
    }

    // 6. Orçamentos iniciais
    const quotesCol = app.findCollectionByNameOrId('quotes')
    const sampleQuotes = [
      {
        clientIndex: 0,
        service_name: 'Manutenção Predial e Reparos Gerais',
        amount: 4500,
        status: 'pendente',
        items: JSON.stringify([
          {
            description: 'Mão de obra técnica especializada (3 dias)',
            quantity: 3,
            unit_price: 900,
            total: 2700,
          },
          {
            description: 'Material hidráulico e válvulas de retenção',
            quantity: 1,
            unit_price: 1800,
            total: 1800,
          },
        ]),
        notes: 'Aguardando aprovação da assembleia de condomínio.',
      },
      {
        clientIndex: 2,
        service_name: 'Climatização e Ar Condicionado',
        amount: 1250,
        status: 'aprovado',
        items: JSON.stringify([
          {
            description: 'Higienização completa e recarga de gás em 5 splits',
            quantity: 5,
            unit_price: 250,
            total: 1250,
          },
        ]),
        notes: 'Aprovado pela Dra. Carla. Agendamento para sábado.',
      },
    ]

    for (const q of sampleQuotes) {
      try {
        app.findFirstRecordByData('quotes', 'notes', q.notes)
      } catch (_) {
        const client = createdClients[q.clientIndex]
        const quoteRec = new Record(quotesCol)
        if (client) {
          quoteRec.set('client', client.id)
          quoteRec.set('client_name', client.getString('name'))
          quoteRec.set('client_email', client.getString('email'))
          quoteRec.set('client_phone', client.getString('phone'))
          quoteRec.set('client_address', client.getString('address'))
        }
        quoteRec.set('service_name', q.service_name)
        quoteRec.set('amount', q.amount)
        quoteRec.set('status', q.status)
        quoteRec.set('items', q.items)
        quoteRec.set('notes', q.notes)
        app.save(quoteRec)
      }
    }
  },
  (app) => {
    // rollback idempotent
  },
)
