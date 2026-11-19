/**
 * 0008 — View agregada por cliente (para o painel abrir rápido).
 *
 * PROBLEMA MEDIDO: o painel carregava os 946 lançamentos com `expand=client`,
 * o que dá ~1 MB de JSON no celular. Somado ao bundle, a abertura passava de
 * 1,2 MB — daí a sensação de travamento no Chrome em rede móvel.
 *
 * SOLUÇÃO: uma view que devolve UMA linha por cliente já com os totais
 * somados. O painel e a lista de clientes leem ~15 KB em vez de 1 MB.
 *
 * Numa coleção view o PocketBase exige que cada coluna do SELECT seja
 * declarada como campo — por isso a lista de fields abaixo espelha o SELECT.
 */
migrate(
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('client_summary'))
    } catch (_) {}

    const view = new Collection({
      name: 'client_summary',
      type: 'view',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
    })

    const campos = [
      { name: 'name', type: 'text' },
      { name: 'nickname', type: 'text' },
      { name: 'doc', type: 'text' },
      { name: 'phone', type: 'text' },
      { name: 'active', type: 'bool' },
      { name: 'revisar', type: 'bool' },
      { name: 'capital', type: 'number' },
      { name: 'consumo', type: 'number' },
      { name: 'servico', type: 'number' },
      { name: 'dinheiro', type: 'number' },
      { name: 'saldo', type: 'number' },
      { name: 'lancamentos', type: 'number' },
    ]
    for (const f of campos) view.fields.add(new Field(f))

    view.viewQuery = `
      SELECT
        c.id AS id,
        c.name AS name,
        c.nickname AS nickname,
        c.doc AS doc,
        c.phone AS phone,
        c.active AS active,
        c.revisar AS revisar,
        COALESCE(SUM(CASE WHEN t.kind = 'CAPITAL' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS capital,
        COALESCE(SUM(CASE WHEN t.kind = 'CONSUMO' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS consumo,
        COALESCE(SUM(CASE WHEN t.kind = 'SERVICO' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS servico,
        COALESCE(SUM(CASE WHEN t.kind = 'DINHEIRO' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS dinheiro,
        COALESCE(SUM(t.quantity * t.unit_price), 0) AS saldo,
        COUNT(t.id) AS lancamentos
      FROM clients c
      LEFT JOIN transactions t ON t.client = c.id
      GROUP BY c.id
    `

    app.save(view)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('client_summary'))
    } catch (_) {}
  },
)
