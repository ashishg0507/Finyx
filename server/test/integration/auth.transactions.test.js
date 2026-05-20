import { describe, expect, it, beforeEach } from 'vitest'
import {
  getApp,
  request,
  resetDatabase,
  createUserViaApi,
  authHeaderFor,
  seedUser,
} from '../helpers.js'
import { Transaction } from '../../src/models/index.js'

describe('Auth + transactions API (integration)', () => {
  let agent

  beforeEach(async () => {
    await resetDatabase()
    agent = request(getApp())
  })

  it('signs up and returns a JWT', async () => {
    const { user, token } = await createUserViaApi(agent, 'alice@example.com')
    expect(user.email).toBe('alice@example.com')
    expect(token).toBeTruthy()
  })

  it('rejects duplicate signup', async () => {
    await createUserViaApi(agent, 'dup@example.com')
    const res = await agent
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'testpass123' })
      .expect(409)
    expect(res.body.error).toMatch(/already in use/i)
  })

  it('signs in with correct password', async () => {
    await createUserViaApi(agent, 'bob@example.com', 'mypassword99')
    const res = await agent
      .post('/api/auth/signin')
      .send({ email: 'bob@example.com', password: 'mypassword99' })
      .expect(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe('bob@example.com')
  })

  it('rejects signin with wrong password', async () => {
    await createUserViaApi(agent, 'carol@example.com')
    await agent
      .post('/api/auth/signin')
      .send({ email: 'carol@example.com', password: 'wrong' })
      .expect(401)
  })

  it('creates and lists transactions for authenticated user', async () => {
    const { user } = await createUserViaApi(agent, 'txn@example.com')
    const headers = authHeaderFor({ id: user.id, email: user.email })

    await agent
      .post('/api/transactions')
      .set(headers)
      .send({
        type: 'expense',
        amount: 250,
        description: 'Groceries',
        category: 'Food',
        date: '2026-05-20',
      })
      .expect(201)

    const list = await agent.get('/api/transactions').set(headers).expect(200)
    expect(list.body.transactions).toHaveLength(1)
    expect(list.body.transactions[0].description).toBe('Groceries')
  })

  it('does not return another user’s transactions', async () => {
    const { user: userA } = await createUserViaApi(agent, 'usera@example.com')
    const userB = await seedUser('userb@example.com')

    await Transaction.create({
      userId: userB.id,
      type: 'expense',
      amount: 999,
      description: 'Secret',
      category: 'Other',
      date: '2026-05-01',
    })

    const list = await agent
      .get('/api/transactions')
      .set(authHeaderFor({ id: userA.id, email: userA.email }))
      .expect(200)

    expect(list.body.transactions).toHaveLength(0)
  })

  it('rejects unauthenticated transaction create', async () => {
    await agent
      .post('/api/transactions')
      .send({
        type: 'expense',
        amount: 10,
        description: 'X',
        category: 'Y',
        date: '2026-05-20',
      })
      .expect(401)
  })
})
