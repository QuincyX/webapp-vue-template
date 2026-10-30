import { z } from 'zod'

import { request } from './http'

export const healthResponseSchema = z.object({
  status: z.string(),
  version: z.string().optional(),
  timestamp: z.string().optional(),
})

export type HealthResponse = z.infer<typeof healthResponseSchema>

export const systemApi = {
  health: async (signal?: AbortSignal): Promise<HealthResponse> => {
    const payload = await request<unknown>({
      url: '/health',
      method: 'GET',
      signal,
    })

    return healthResponseSchema.parse(payload)
  },
}
