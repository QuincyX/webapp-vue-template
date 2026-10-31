import { AxiosHeaders, type AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { envelopeRequest, unwrapEnvelope } from '@/api/envelope'
import { ApiError } from '@/api/errors'

const itemSchema = z.object({ id: z.string(), name: z.string() })

function responseAdapter(payload: unknown): AxiosAdapter {
  return async (config) => ({
    data: payload,
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    config,
  })
}

describe('unwrapEnvelope', () => {
  it('unwraps and validates the data field', () => {
    const payload = { code: 0, message: 'ok', data: { id: 'a', name: 'Alpha' } }

    expect(unwrapEnvelope(payload, itemSchema)).toEqual({ id: 'a', name: 'Alpha' })
  })

  it('accepts the { error, msg, data } convention', () => {
    const payload = { error: 0, msg: 'success', data: { id: 'b', name: 'Beta' } }

    expect(unwrapEnvelope(payload, itemSchema)).toEqual({ id: 'b', name: 'Beta' })
  })

  it('throws a business ApiError for a failure code and keeps the backend message', () => {
    const payload = { code: 1001, message: 'Title is taken', data: null }

    expect(() => unwrapEnvelope(payload, itemSchema)).toThrowError(
      expect.objectContaining({ name: 'ApiError', code: 'business', message: 'Title is taken' }),
    )
  })

  it('supports a custom success code list', () => {
    const payload = { code: 'OK', data: { id: 'c', name: 'Gamma' } }

    expect(unwrapEnvelope(payload, itemSchema, { successCodes: ['OK'] })).toEqual({
      id: 'c',
      name: 'Gamma',
    })
    expect(() => unwrapEnvelope(payload, itemSchema)).toThrowError(ApiError)
  })

  it('reads the code through a custom selector when the backend nests it', () => {
    const payload = { meta: { code: 200 }, data: { id: 'd', name: 'Delta' } }

    expect(
      unwrapEnvelope(payload, itemSchema, {
        codeSelector: (value) => (value as { meta?: { code?: number } }).meta?.code,
        successCodes: [200],
      }),
    ).toEqual({ id: 'd', name: 'Delta' })
  })

  it('rejects payloads that are not envelopes', () => {
    expect(() => unwrapEnvelope([1, 2, 3], itemSchema)).toThrowError(
      expect.objectContaining({ name: 'ApiError', code: 'unknown' }),
    )
  })

  it('rejects data that does not match the schema', () => {
    const payload = { code: 0, data: { id: 'e' } }

    expect(() => unwrapEnvelope(payload, itemSchema)).toThrowError(
      expect.objectContaining({ name: 'ApiError', code: 'unknown' }),
    )
  })
})

describe('envelopeRequest', () => {
  it('goes through the shared HTTP client and returns typed data', async () => {
    const payload = { code: 0, data: { id: 'f', name: 'Foxtrot' } }

    const result = await envelopeRequest(
      { url: '/items/f', method: 'GET', adapter: responseAdapter(payload) },
      itemSchema,
    )

    expect(result).toEqual({ id: 'f', name: 'Foxtrot' })
  })
})
