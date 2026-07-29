const fs = require('fs')
const path = require('path')

// Next.js only auto-loads .env.local / .env.development(.local) / .env, not
// arbitrary filenames. Load .env.dev.local ourselves for local development so
// it takes precedence over .env.local (mirrors Next's own \$ escaping rule,
// see modules/auth/README.md).
function loadDevEnvFile() {
  const filePath = path.join(__dirname, '.env.dev.local')
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (!match) continue
    const [, key, rawValue = ''] = match
    process.env[key] = rawValue.trim().replace(/\\\$/g, '$')
  }
}

if (process.env.NODE_ENV === 'development') {
  loadDevEnvFile()
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
}

module.exports = nextConfig
