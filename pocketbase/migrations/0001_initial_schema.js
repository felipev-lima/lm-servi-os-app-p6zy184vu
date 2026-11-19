migrate(
  (app) => {
    // 1. Clientes
    const clients = new Collection({
      name: 'clients',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clients_name ON clients (name)',
        'CREATE INDEX idx_clients_email ON clients (email)',
        'CREATE INDEX idx_clients_phone ON clients (phone)',
      ],
    })
    app.save(clients)

    // 2. Serviços da LM SERVIÇOS
    const services = new Collection({
      name: 'services',
      type: 'base',
      listRule: '', // leitura pública para formulário do site e equipe
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'base_price', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_services_name ON services (name)'],
    })
    app.save(services)

    const clientsId = clients.id

    // 3. Ordens de Serviço
    const workOrders = new Collection({
      name: 'work_orders',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clientsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'description', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['novo', 'em_andamento', 'concluido'],
          maxSelect: 1,
        },
        { name: 'date', type: 'text' }, // data formatada ou ISO
        { name: 'notes', type: 'text' },
        {
          name: 'priority',
          type: 'select',
          values: ['baixa', 'media', 'alta', 'urgente'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_wo_client ON work_orders (client)',
        'CREATE INDEX idx_wo_status ON work_orders (status)',
        'CREATE INDEX idx_wo_created ON work_orders (created)',
      ],
    })
    app.save(workOrders)

    // 4. Orçamentos
    // createRule pública para o formulário do site criar pedidos de orçamento sem login,
    // ou da equipe autenticada. list/view/update/delete apenas equipe autenticada.
    const quotes = new Collection({
      name: 'quotes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '', // público pode solicitar orçamento via formulário do site
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'client',
          type: 'relation',
          collectionId: clientsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'client_name', type: 'text' }, // Preenchido no formulário público se cliente ainda não existe
        { name: 'client_email', type: 'text' },
        { name: 'client_phone', type: 'text' },
        { name: 'client_address', type: 'text' },
        { name: 'service_name', type: 'text' }, // Nome do serviço solicitado
        { name: 'items', type: 'json' }, // Lista de itens [{ description, quantity, unit_price, total }]
        { name: 'amount', type: 'number' }, // Valor total do orçamento
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'aprovado', 'rejeitado', 'convertido_em_os'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_quotes_client ON quotes (client)',
        'CREATE INDEX idx_quotes_status ON quotes (status)',
        'CREATE INDEX idx_quotes_created ON quotes (created)',
      ],
    })
    app.save(quotes)
  },
  (app) => {
    const quotes = app.findCollectionByNameOrId('quotes')
    if (quotes) app.delete(quotes)

    const workOrders = app.findCollectionByNameOrId('work_orders')
    if (workOrders) app.delete(workOrders)

    const services = app.findCollectionByNameOrId('services')
    if (services) app.delete(services)

    const clients = app.findCollectionByNameOrId('clients')
    if (clients) app.delete(clients)
  },
)
