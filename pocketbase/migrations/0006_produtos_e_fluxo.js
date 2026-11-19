/**
 * 0006 — Produtos e o fluxo de orçamento → pedido → faturamento.
 *
 * `products` é a carteira vinda do app da FL (1.511 itens, 942 com preço), para
 * que ao montar um orçamento o produto já esteja lá com preço e unidade.
 *
 * O fluxo do Felipe, na ordem em que ele falou:
 *   ORÇAMENTO → PEDIDO → ENTREGUE → FATURADO
 * `quotes.status` guarda esse caminho.
 */
migrate(
  (app) => {
    // ---------- PRODUTOS ----------
    let prod
    try {
      prod = app.findCollectionByNameOrId('products')
    } catch (_) {
      prod = null
    }
    if (!prod) {
      prod = new Collection({
        name: 'products',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
      })
    }
    const camposProd = [
      { name: 'name', type: 'text', required: true },
      {
        name: 'unit',
        type: 'select',
        maxSelect: 1,
        values: ['UN', 'M', 'KG', 'L', 'CX', 'PC', 'PAR', 'ROLO', 'M2'],
      },
      { name: 'category', type: 'text' },
      { name: 'brand', type: 'text' },
      // preço de VENDA (o que vai no orçamento)
      { name: 'price', type: 'number' },
      { name: 'notes', type: 'text' },
      { name: 'active', type: 'bool' },
      // rastreio da importação
      { name: 'fl_product_id', type: 'text' },
      { name: 'pending_review', type: 'bool' },
    ]
    for (const f of camposProd) {
      if (!prod.fields.getByName(f.name)) prod.fields.add(new Field(f))
    }
    app.save(prod)

    // ---------- CAMPOS NOVOS NO ORÇAMENTO/PEDIDO ----------
    const quotes = app.findCollectionByNameOrId('quotes')

    const novos = [
      // ordem do fluxo: orçamento → pedido → entregue → faturado
      {
        name: 'status',
        type: 'select',
        maxSelect: 1,
        values: ['ORCAMENTO', 'PEDIDO', 'ENTREGUE', 'FATURADO', 'CANCELADO'],
      },
      { name: 'client_nickname', type: 'text' },
      { name: 'delivered_at', type: 'date' },
      { name: 'invoiced_at', type: 'date' },
      { name: 'delivered_by_name', type: 'text' }, // quem entregou
      { name: 'delivered_by_role', type: 'text' }, // "Diretor", "Vendedora"
      { name: 'signature_client', type: 'file', maxSelect: 1, maxSize: 5242880 },
      { name: 'signature_deliverer', type: 'file', maxSelect: 1, maxSize: 5242880 },
      { name: 'photos', type: 'file', maxSelect: 20, maxSize: 10485760 },
      { name: 'sent_to_finance', type: 'select', maxSelect: 1, values: ['PENDENTE', 'ENVIADA'] },
    ]
    for (const f of novos) {
      if (!quotes.fields.getByName(f.name)) quotes.fields.add(new Field(f))
    }
    app.save(quotes)

    // ---------- DADOS DA EMPRESA (para o PDF) ----------
    let cfg
    try {
      cfg = app.findCollectionByNameOrId('settings')
    } catch (_) {
      cfg = null
    }
    if (!cfg) {
      cfg = new Collection({
        name: 'settings',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
      })
      cfg.fields.add(new Field({ name: 'razao_social', type: 'text' }))
      cfg.fields.add(new Field({ name: 'nome_fantasia', type: 'text' }))
      cfg.fields.add(new Field({ name: 'cnpj', type: 'text' }))
      cfg.fields.add(new Field({ name: 'ie', type: 'text' }))
      cfg.fields.add(new Field({ name: 'endereco', type: 'text' }))
      cfg.fields.add(new Field({ name: 'telefone', type: 'text' }))
      cfg.fields.add(new Field({ name: 'email', type: 'text' }))
      cfg.fields.add(new Field({ name: 'logo', type: 'file', maxSelect: 1, maxSize: 2097152 }))
      cfg.fields.add(
        new Field({ name: 'assinatura_diretor', type: 'file', maxSelect: 1, maxSize: 1048576 }),
      )
      cfg.fields.add(new Field({ name: 'diretor_nome', type: 'text' }))
      app.save(cfg)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('products'))
    } catch (_) {}
  },
)
