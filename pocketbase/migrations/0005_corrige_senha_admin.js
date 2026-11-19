/**
 * 0005 — Conserta a senha do usuário administrador do CRM.
 *
 * A migration 0004 criava o usuário definindo um campo `role` que não existe
 * nesta coleção; o save gravou o registro mas sem senha válida, e o login
 * respondia "Failed to authenticate". Aqui a senha é definida de novo, direto
 * no registro que já existe.
 */
migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('users', 'felipev.lima1981@gmail.com')
    } catch (_) {
      return // não existe: nada a corrigir
    }
    user.set('password', 'Fel161181')
    user.set('passwordConfirm', 'Fel161181')
    user.set('verified', true)
    user.set('emailVisibility', true)
    if (!user.getString('name')) user.set('name', 'Felipe Lima')
    app.save(user)
  },
  () => {
    // nada a reverter: so redefiniu a senha
  },
)
