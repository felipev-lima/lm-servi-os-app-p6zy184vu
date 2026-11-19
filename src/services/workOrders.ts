import pb from '@/lib/pocketbase/client'
import type { WorkOrderRecord, WorkOrderStatus, WorkOrderPriority } from '@/types/database'

export async function getWorkOrders(filters?: {
  status?: WorkOrderStatus | 'all'
  clientId?: string
  search?: string
}): Promise<WorkOrderRecord[]> {
  const parts: string[] = []
  if (filters?.status && filters.status !== 'all') {
    parts.push(`status = "${filters.status}"`)
  }
  if (filters?.clientId) {
    parts.push(`client = "${filters.clientId}"`)
  }
  if (filters?.search && filters.search.trim()) {
    parts.push(`description ~ "${filters.search.trim()}"`)
  }

  const filter = parts.join(' && ')

  const records = await pb.collection('work_orders').getFullList<WorkOrderRecord>({
    filter,
    sort: '-created',
    expand: 'client',
    requestKey: null,
  })
  return records
}

export async function getWorkOrderById(id: string): Promise<WorkOrderRecord> {
  return await pb.collection('work_orders').getOne<WorkOrderRecord>(id, {
    expand: 'client',
    requestKey: null,
  })
}

export async function createWorkOrder(data: {
  client: string
  description: string
  status: WorkOrderStatus
  date?: string
  priority?: WorkOrderPriority
  notes?: string
}): Promise<WorkOrderRecord> {
  return await pb.collection('work_orders').create<WorkOrderRecord>(data, {
    expand: 'client',
  })
}

export async function updateWorkOrderStatus(
  id: string,
  status: WorkOrderStatus,
): Promise<WorkOrderRecord> {
  return await pb.collection('work_orders').update<WorkOrderRecord>(
    id,
    { status },
    {
      expand: 'client',
    },
  )
}

export async function updateWorkOrder(
  id: string,
  data: Partial<Omit<WorkOrderRecord, 'id' | 'created' | 'updated' | 'expand'>>,
): Promise<WorkOrderRecord> {
  return await pb.collection('work_orders').update<WorkOrderRecord>(id, data, {
    expand: 'client',
  })
}

export async function deleteWorkOrder(id: string): Promise<boolean> {
  return await pb.collection('work_orders').delete(id)
}
