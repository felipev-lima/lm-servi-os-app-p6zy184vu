/**
 * 0008 — View agregada por cliente (para o painel abrir rápido).
 *
 * PROBLEMA MEDIDO: o painel carregava os 946 lançamentos com `expand=client`,
 * o que dá ~1 MB de JSON no celular. Somado ao bundle (477 KB) e aos 1.511
 * produtos, a abertura passava de 1,2 MB — daí a sensação de travamento no
 * Chrome, principalmente em 4G.
 *
 * SOLUÇÃO: uma view SQL que devolve UMA linha por cliente com os totais já
 * somados. O painel e a lista de clientes passam a ler ~15 KB em vez de 1 MB.
 * Os lançamentos continuam sendo lidos só quando a pessoa abre um cliente ou
 * a tela de lançamentos.
 */
migrate(
  (app) => {
    // remove se já existir (migration reaplicável)
    try {
      app.delete(app.findCollectionByNameOrId('client_summary'))
    } catch (_) {}

    const view = new Collection({
      name: 'client_summary',
      type: 'view',
      // mesmas regras das outras coleções: só quem está logado
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      options: {
        query: `
          SELECT
            c.id,
            c.name,
            c.nickname,
            c.doc,
            c.phone,
            c.active,
            c.revisar,
            COALESCE(SUM(CASE WHEN t.kind = 'CAPITAL' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS capital,
            COALESCE(SUM(CASE WHEN t.kind = 'CONSUMO' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS consumo,
            COALESCE(SUM(CASE WHEN t.kind = 'SERVICO' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS servico,
            COALESCE(SUM(CASE WHEN t.kind = 'DINHEIRO' THEN t.quantity * t.unit_price ELSE 0 END), 0) AS dinheiro,
            COALESCE(SUM(t.quantity * t.unit_price), 0) AS saldo,
            COUNT(t.id) AS lancamentos
          FROM clients c
          LEFT JOIN transactions t ON t.client = c.id
          GROUP BY c.id
        `,
      },
    })
    app.save(view)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('client_summary'))
    } catch (_) {}
  },
)
