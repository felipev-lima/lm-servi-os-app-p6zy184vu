/**
 * 0004 — Cria o usuário administrador do CRM (Felipe).
 *
 * Sem usuário não há como entrar: todas as regras das coleções exigem login.
 * A senha é a mesma que ele já usa nos outros sistemas, para não confundir.
 */
migrate(
  (app) => {
    const email = 'felipev.lima1981@gmail.com'
    try {
      app.findAuthRecordByEmail('users', email)
      return // já existe: não mexe
    } catch (_) {
      // não existe: cria
    }

    const user = new Record(app.findCollectionByNameOrId('users'))
    user.set('email', email)
    user.set('password', 'Fel161181')
    user.set('passwordConfirm', 'Fel161181')
    user.set('name', 'Felipe Lima')
    user.set('role', 'admin')
    user.set('emailVisibility', true)
    user.set('verified', true)
    app.save(user)
  },
  (app) => {
    try {
      const u = app.findAuthRecordByEmail('users', 'felipev.lima1981@gmail.com')
      app.delete(u)
    } catch (_) {}
  },
)
