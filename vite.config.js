import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function localVercelApiPlugin() {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next()
        }

        const urlObj = new URL(req.url, 'http://localhost:5173')
        const apiName = urlObj.pathname.replace(/^\/api\//, '').replace(/\/$/, '')
        const filePath = path.resolve(process.cwd(), 'api', `${apiName}.js`)

        if (!fs.existsSync(filePath)) {
          return next()
        }

        try {
          req.query = Object.fromEntries(urlObj.searchParams.entries())

          const chunks = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const rawBody = Buffer.concat(chunks).toString('utf8')
          if (rawBody) {
            try {
              req.body = JSON.parse(rawBody)
            } catch {
              req.body = rawBody
            }
          } else {
            req.body = {}
          }

          res.status = (code) => {
            res.statusCode = code
            return res
          }
          res.json = (data) => {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
            }
            res.end(JSON.stringify(data))
            return res
          }
          res.send = (data) => {
            if (typeof data === 'object' && data !== null) {
              return res.json(data)
            }
            res.end(String(data ?? ''))
            return res
          }

          const mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`)
          const handler = mod.default
          if (typeof handler !== 'function') {
            return res.status(500).json({ success: false, message: `API ${apiName}.js 缺少 default export` })
          }

          await handler(req, res)
        } catch (err) {
          console.error(`[Local API Error] /api/${apiName}:`, err)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, message: err.message }))
          }
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [vue(), localVercelApiPlugin()]
  }
})