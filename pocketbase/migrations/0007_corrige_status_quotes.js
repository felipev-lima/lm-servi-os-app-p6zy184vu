/**
 * 0007 — Atualiza os valores do campo `status` de quotes.
 *
 * A migration 0006 tentou acrescentar o campo `status` com o fluxo novo
 * (ORCAMENTO/PEDIDO/ENTREGUE/FATURADO), mas o campo já existia desde a 0001
 * com outros valores — e `fields.add` num campo existente é ignorado. Resultado:
 * o app enviava "ORCAMENTO" e o servidor recusava com 400.
 *
 * Aqui o campo é REMOVIDO (não há dados: a coleção está vazia) e recriado com
 * os valores do fluxo real do Felipe.
 */
migrate(
  (app) => {
    const quotes = app.findCollectionByNameOrId('quotes')
    const atual = quotes.fields.getByName('status')
    if (atual) quotes.fields.removeById(atual.id)

    quotes.fields.add(
      new SelectField({
        name: 'status',
        required: false,
        maxSelect: 1,
        values: ['ORCAMENTO', 'PEDIDO', 'ENTREGUE', 'FATURADO', 'CANCELADO'],
      }),
    )
    app.save(quotes)
  },
  (app) => {
    const quotes = app.findCollectionByNameOrId('quotes')
    const atual = quotes.fields.getByName('status')
    if (atual) quotes.fields.removeById(atual.id)
    quotes.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['pendente', 'aprovado', 'rejeitado', 'convertido_em_os'],
      }),
    )
    app.save(quotes)
  },
)
