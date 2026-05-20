import { describe, expect, it, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../../src/middleware/auth.js'
import * as firebaseAdmin from '../../src/lib/firebaseAdmin.js'

vi.mock('../../src/lib/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}))

function mockReqResNext(headers = {}) {
  const req = { headers }
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
  let nextCalled = false
  const next = () => {
    nextCalled = true
  }
  return { req, res, next, isNext: () => nextCalled }
}

describe('requireAuth (unit)', () => {
  beforeEach(() => {
    vi.mocked(firebaseAdmin.verifyFirebaseIdToken).mockReset()
  })

  it('rejects missing Authorization header', async () => {
    const { req, res, next, isNext } = mockReqResNext()
    await requireAuth(req, res, next)
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toMatch(/missing token/i)
    expect(isNext()).toBe(false)
  })

  it('accepts valid JWT', async () => {
    const token = jwt.sign(
      { sub: 42, email: 'jwt@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    )
    const { req, res, next, isNext } = mockReqResNext({
      authorization: `Bearer ${token}`,
    })
    await requireAuth(req, res, next)
    expect(isNext()).toBe(true)
    expect(req.user).toEqual({ id: 42, email: 'jwt@example.com' })
  })

  it('rejects invalid JWT and invalid Firebase token', async () => {
    vi.mocked(firebaseAdmin.verifyFirebaseIdToken).mockResolvedValue(null)
    const { req, res, next, isNext } = mockReqResNext({
      authorization: 'Bearer not-a-real-token',
    })
    await requireAuth(req, res, next)
    expect(res.statusCode).toBe(401)
    expect(isNext()).toBe(false)
  })
})
