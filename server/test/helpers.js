import jwt from 'jsonwebtoken'
import request from 'supertest'
import { sequelize } from '../src/db.js'
import '../src/models/index.js'
import { createApp } from '../src/app.js'
import { User } from '../src/models/index.js'

export function getApp() {
  return createApp()
}

export async function resetDatabase() {
  await sequelize.sync({ force: true })
}

export function authHeaderFor(user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  )
  return { Authorization: `Bearer ${token}` }
}

/** Sign up via API and return { user, token, agent } */
export async function createUserViaApi(agent, email, password = 'testpass123') {
  const res = await agent
    .post('/api/auth/signup')
    .send({ email, password })
    .expect(201)
  return { user: res.body.user, token: res.body.token }
}

export async function seedUser(email = 'test@example.com') {
  const user = await User.create({
    email,
    passwordHash: 'firebase-auth',
    detailedSummaryEmails: false,
  })
  return user
}

export { request }
