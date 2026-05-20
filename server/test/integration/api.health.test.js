import { describe, expect, it, beforeAll } from 'vitest'
import { getApp, request } from '../helpers.js'

describe('GET /api/health (integration)', () => {
  let agent

  beforeAll(() => {
    agent = request(getApp())
  })

  it('returns ok without touching the database', async () => {
    const res = await agent.get('/api/health').expect(200)
    expect(res.body).toEqual({ ok: true })
  })
})
