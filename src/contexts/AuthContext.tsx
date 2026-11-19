/**
 * Autenticação do CRM.
 *
 * Uma conta por pessoa. O PocketBase guarda a sessão em localStorage, então
 * quem já entrou continua entrado ao reabrir no celular.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

export interface Usuario {
  id: string
  name?: string
  email: string
  role?: string
}

interface Contexto {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => void
}

const Ctx = createContext<Contexto>({} as Contexto)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(pb.authStore.model as Usuario | null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const cancelar = pb.authStore.onChange(() => {
      setUsuario(pb.authStore.model as Usuario | null)
    })
    // valida a sessão guardada (token pode ter expirado)
    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then(() => setUsuario(pb.authStore.model as Usuario | null))
        .catch(() => pb.authStore.clear())
        .finally(() => setCarregando(false))
    } else {
      setCarregando(false)
    }
    return cancelar
  }, [])

  const entrar = async (email: string, senha: string) => {
    await pb.collection('users').authWithPassword(email.trim(), senha)
    setUsuario(pb.authStore.model as Usuario | null)
  }

  const sair = () => {
    pb.authStore.clear()
    setUsuario(null)
  }

  return <Ctx.Provider value={{ usuario, carregando, entrar, sair }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
