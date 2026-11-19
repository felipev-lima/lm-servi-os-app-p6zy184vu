import pb from '@/lib/pocketbase/client'
import type { QuoteRecord, QuoteStatus, QuoteItem } from '@/types/database'

export async function getQuotes(filters?: {
  status?: QuoteStatus | 'all'
  clientId?: string
}): Promise<QuoteRecord[]> {
  const parts: string[] = []
  if (filters?.status && filters.status !== 'all') {
    parts.push(`status = "${filters.status}"`)
  }
  if (filters?.clientId) {
    parts.push(`client = "${filters.clientId}"`)
  }

  const filter = parts.join(' && ')

  const records = await pb.collection('quotes').getFullList<QuoteRecord>({
    filter,
    sort: '-created',
    expand: 'client',
    requestKey: null,
  })

  // Sanitizar itens que vêm como string ou json
  return records.map((r) => {
    let parsedItems: QuoteItem[] = []
    if (typeof r.items === 'string') {
      try {
        parsedItems = JSON.parse(r.items)
      } catch {
        parsedItems = []
      }
    } else if (Array.isArray(r.items)) {
      parsedItems = r.items
    }
    return {
      ...r,
      items: parsedItems,
    }
  })
}

export async function getQuoteById(id: string): Promise<QuoteRecord> {
  const record = await pb.collection('quotes').getOne<QuoteRecord>(id, {
    expand: 'client',
    requestKey: null,
  })

  let parsedItems: QuoteItem[] = []
  if (typeof record.items === 'string') {
    try {
      parsedItems = JSON.parse(record.items)
    } catch {
      parsedItems = []
    }
  } else if (Array.isArray(record.items)) {
    parsedItems = record.items
  }

  return {
    ...record,
    items: parsedItems,
  }
}

export async function createQuote(data: {
  client?: string
  client_name?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  service_name?: string
  items?: QuoteItem[]
  amount?: number
  status: QuoteStatus
  notes?: string
}): Promise<QuoteRecord> {
  const payload = {
    ...data,
    items: data.items ? JSON.stringify(data.items) : '[]',
  }
  return await pb.collection('quotes').create<QuoteRecord>(payload, {
    expand: 'client',
  })
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<QuoteRecord> {
  return await pb.collection('quotes').update<QuoteRecord>(
    id,
    { status },
    {
      expand: 'client',
    },
  )
}

export async function updateQuote(
  id: string,
  data: Partial<Omit<QuoteRecord, 'id' | 'created' | 'updated' | 'expand'>>,
): Promise<QuoteRecord> {
  const payload: Record<string, unknown> = { ...data }
  if (data.items && typeof data.items !== 'string') {
    payload.items = JSON.stringify(data.items)
  }
  return await pb.collection('quotes').update<QuoteRecord>(id, payload, {
    expand: 'client',
  })
}

export async function deleteQuote(id: string): Promise<boolean> {
  return await pb.collection('quotes').delete(id)
}
