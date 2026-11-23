import pg from 'pg'
import jwt from 'jsonwebtoken'

const { Pool } = pg
const globalForPg = globalThis

export const pool =
  globalForPg.__mdPgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    keepAlive: true
  })

const JWT_SECRET = process.env.JWT_SECRET || 'md-select-dev-secret-change-in-prod'
const SESSION_TTL = '15m'

export const query = (text, params = []) => pool.query(text, params)

export async function withTransaction(callback) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: SESSION_TTL }
  )
}

export function verifyAuth(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || '127.0.0.1'
}

export async function writeAuditLog(executor, { operator = '系統自動', ip = '127.0.0.1', action, detail }) {
  const id = 'AUD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100)
  await executor.query(
    `INSERT INTO audit_logs (id, operator, ip, action, detail)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, operator, ip, action, detail]
  )
}

export function getCleanLinePaySite() {
  const raw = (process.env.LINE_PAY_SITE || 'https://sandbox-api-pay.line.me').trim()
  const match = raw.match(/https?:\/\/[a-zA-Z0-9.-]+/)
  return match ? match[0] : 'https://sandbox-api-pay.line.me'
}