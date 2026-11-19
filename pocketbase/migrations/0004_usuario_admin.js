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

    // A coleção users deste projeto NÃO tem o campo `role` — definir um campo
    // inexistente fazia o save gravar sem a senha, e o login falhava.
    const users = app.findCollectionByNameOrId('users')
    const user = new Record(users)
    user.set('email', email)
    user.set('password', 'Fel161181')
    user.set('passwordConfirm', 'Fel161181')
    user.set('name', 'Felipe Lima')
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
