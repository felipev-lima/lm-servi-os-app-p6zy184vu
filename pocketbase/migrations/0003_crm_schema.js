/**
 * 0003 — Esquema do CRM de gestão da LM SERVIÇOS.
 *
 * Substitui as coleções genéricas criadas automaticamente (0001) por um modelo
 * que reflete como o Felipe realmente trabalha: a planilha dele de orçamento,
 * com as quatro divisões CAPITAL / CONSUMO / SERVIÇO / DINHEIRO.
 *
 * Decisões que vêm da análise da planilha real (71+ abas, 946 lançamentos):
 *
 * 1. Cliente tem DOIS nomes:
 *    - `name`     razão social completa — é o que sai no PDF e no documento
 *    - `nickname` apelido curto — SÓ para busca no CRM, nunca impresso
 *    O Felipe não memoriza razões sociais longas e usa apelidos
 *    ("ESCOLA PARK", "ESCOLA LUCIANA").
 *
 * 2. Lançamento é a linha da planilha: data, tipo, descrição, qtd, unitário.
 *    O total NÃO é gravado — é calculado, para nunca divergir.
 *
 * 3. `kind` substitui o "produto/serviço" da planilha (que era sempre igual ao
 *    tipo) e serve para relatório separado de venda de produto e de serviço.
 */
migrate(
  (app) => {
    // ---------- CLIENTES ----------
    let clients
    try {
      clients = app.findCollectionByNameOrId('clients')
    } catch (_) {
      clients = null
    }
    if (!clients) {
      clients = new Collection({
        name: 'clients',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
      })
    }

    const camposCliente = [
      { name: 'name', type: 'text', required: true }, // razão social
      { name: 'nickname', type: 'text' }, // apelido, uso interno
      { name: 'doc', type: 'text' }, // CNPJ / CPF
      { name: 'doc_type', type: 'select', values: ['CNPJ', 'CPF', ''], maxSelect: 1 },
      { name: 'contact_name', type: 'text' }, // quem atende lá
      { name: 'phone', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'address', type: 'text' },
      { name: 'neighborhood', type: 'text' },
      { name: 'city', type: 'text' },
      { name: 'state', type: 'text' },
      { name: 'notes', type: 'text' },
      { name: 'active', type: 'bool' },
      // origem/rastreio da importação
      { name: 'legacy_sheet', type: 'text' }, // nome da aba de onde veio
      { name: 'fl_client_id', type: 'text' }, // id no app da FL, se casou
      { name: 'revisar', type: 'bool' }, // true = nome/fantasia a conferir
    ]
    for (const f of camposCliente) {
      if (!clients.fields.getByName(f.name)) clients.fields.add(new Field(f))
    }
    // índice comum (o PocketBase não aceita índice parcial com WHERE)
    clients.addIndex('CREATE INDEX idx_clients_doc ON clients (doc)')
    clients.addIndex('CREATE INDEX idx_clients_name ON clients (name)')
    clients.addIndex('CREATE INDEX idx_clients_nick ON clients (nickname)')
    app.save(clients)
    const clientsId = clients.id

    // ---------- LANÇAMENTOS ----------
    let tx
    try {
      tx = app.findCollectionByNameOrId('transactions')
    } catch (_) {
      tx = null
    }
    if (!tx) {
      tx = new Collection({
        name: 'transactions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
      })
    }
    const camposTx = [
      {
        name: 'client',
        type: 'relation',
        required: true,
        collectionId: clientsId,
        maxSelect: 1,
        cascadeDelete: true,
      },
      { name: 'date', type: 'date', required: true },
      // as quatro divisões da planilha; DINHEIRO é o pagamento (entra negativo)
      {
        name: 'kind',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: ['CAPITAL', 'CONSUMO', 'SERVICO', 'DINHEIRO'],
      },
      // produto vendido x mão de obra — para relatório separado
      { name: 'item_type', type: 'select', maxSelect: 1, values: ['PRODUTO', 'SERVICO'] },
      { name: 'description', type: 'text', required: true },
      { name: 'details', type: 'text' }, // a "descrição detalhada" da planilha
      { name: 'quantity', type: 'number' },
      { name: 'unit_price', type: 'number' },
      { name: 'work_order_ref', type: 'text' }, // nº da OS, se houver
      { name: 'sent_to_finance', type: 'select', maxSelect: 1, values: ['PENDENTE', 'ENVIADA'] },
      { name: 'sent_at', type: 'date' },
      { name: 'notes', type: 'text' },
      { name: 'legacy_row', type: 'text' }, // rastreio da linha original
    ]
    for (const f of camposTx) {
      if (!tx.fields.getByName(f.name)) tx.fields.add(new Field(f))
    }
    tx.addIndex('CREATE INDEX idx_tx_client ON transactions (client)')
    tx.addIndex('CREATE INDEX idx_tx_date ON transactions (date)')
    tx.addIndex('CREATE INDEX idx_tx_kind ON transactions (kind)')
    app.save(tx)

    // ---------- ORÇAMENTOS ----------
    let quotes
    try {
      quotes = app.findCollectionByNameOrId('quotes')
    } catch (_) {
      quotes = null
    }
    if (!quotes) {
      quotes = new Collection({
        name: 'quotes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
      })
    }
    const camposQuote = [
      {
        name: 'client',
        type: 'relation',
        required: true,
        collectionId: clientsId,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: 'number', type: 'number' },
      { name: 'date', type: 'date' },
      { name: 'items', type: 'json' }, // [{description, quantity, unit_price}]
      { name: 'service_value', type: 'number' },
      {
        name: 'status',
        type: 'select',
        maxSelect: 1,
        values: ['RASCUNHO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'CONVERTIDO'],
      },
      { name: 'payment_terms', type: 'text' },
      { name: 'delivery_terms', type: 'text' },
      { name: 'validity_days', type: 'number' },
      { name: 'notes', type: 'text' },
    ]
    for (const f of camposQuote) {
      if (!quotes.fields.getByName(f.name)) quotes.fields.add(new Field(f))
    }
    app.save(quotes)
  },
  (app) => {
    // reversão: apaga só o que esta migration criou
    for (const nome of ['transactions']) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
  },
)
