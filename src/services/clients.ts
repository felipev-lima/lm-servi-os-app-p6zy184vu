import pb from '@/lib/pocketbase/client'
import type { ClientRecord } from '@/types/database'

export async function getClients(search?: string): Promise<ClientRecord[]> {
  const filter =
    search && search.trim()
      ? `name ~ "${search.trim()}" || email ~ "${search.trim()}" || phone ~ "${search.trim()}"`
      : ''

  const records = await pb.collection('clients').getFullList<ClientRecord>({
    filter,
    sort: 'name',
    requestKey: null,
  })
  return records
}

export async function getClientById(id: string): Promise<ClientRecord> {
  return await pb.collection('clients').getOne<ClientRecord>(id, { requestKey: null })
}

export async function createClient(data: {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}): Promise<ClientRecord> {
  return await pb.collection('clients').create<ClientRecord>(data)
}

export async function updateClient(
  id: string,
  data: Partial<Omit<ClientRecord, 'id' | 'created' | 'updated'>>,
): Promise<ClientRecord> {
  return await pb.collection('clients').update<ClientRecord>(id, data)
}

export async function deleteClient(id: string): Promise<boolean> {
  return await pb.collection('clients').delete(id)
}
