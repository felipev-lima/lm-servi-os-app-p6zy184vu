import pb from '@/lib/pocketbase/client'
import type { ServiceRecord, UserRecord } from '@/types/database'

export async function getServices(): Promise<ServiceRecord[]> {
  return await pb.collection('services').getFullList<ServiceRecord>({
    sort: 'name',
    requestKey: null,
  })
}

export async function createService(data: {
  name: string
  description?: string
  base_price?: number
}): Promise<ServiceRecord> {
  return await pb.collection('services').create<ServiceRecord>(data)
}

export async function getTeamMembers(): Promise<UserRecord[]> {
  return await pb.collection('users').getFullList<UserRecord>({
    sort: 'name',
    requestKey: null,
  })
}

export async function createTeamMember(data: {
  name: string
  email: string
  password: string
  passwordConfirm: string
}): Promise<UserRecord> {
  return await pb.collection('users').create<UserRecord>({
    name: data.name,
    email: data.email,
    password: data.password,
    passwordConfirm: data.passwordConfirm,
    emailVisibility: true,
  })
}
