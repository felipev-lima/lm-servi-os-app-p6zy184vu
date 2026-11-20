/**
 * 0009 — Classificação padrão do produto (capital / consumo / serviço).
 *
 * O Felipe não quer escolher o tipo a cada item do orçamento: o produto já
 * deve vir na divisão certa (CAPITAL = bem permanente, CONSUMO = material de
 * uso, SERVICO = mão de obra).
 *
 * `default_kind` guarda essa classificação. Quando ele corrige na hora do
 * orçamento, o app grava a correção aqui também — o cadastro aprende com o uso.
 * O preço segue o mesmo princípio: `price` é a tabela, e o orçamento pode ter
 * preço especial sem alterar o cadastro.
 */
migrate(
  (app) => {
    const prod = app.findCollectionByNameOrId('products')
    if (!prod.fields.getByName('default_kind')) {
      prod.fields.add(
        new SelectField({
          name: 'default_kind',
          required: false,
          maxSelect: 1,
          values: ['CAPITAL', 'CONSUMO', 'SERVICO'],
        }),
      )
    }
    app.save(prod)
  },
  (app) => {
    const prod = app.findCollectionByNameOrId('products')
    const f = prod.fields.getByName('default_kind')
    if (f) prod.fields.removeById(f.id)
    app.save(prod)
  },
)
