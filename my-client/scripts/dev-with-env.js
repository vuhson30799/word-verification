const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

// Next.js only auto-loads .env.local / .env.development(.local) / .env, not
// arbitrary filenames, and its dev server reloads those files on the fly
// (wiping out any override set later, e.g. from next.config.js). So instead
// we parse .env.dev.local ourselves and inject it into the OS-level env
// *before* spawning `next dev` — Next.js never overrides a variable that's
// already present in the process environment when it starts.
function parseEnvFile(filePath) {
  const vars = {}
  if (!fs.existsSync(filePath)) return vars

  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (!match) continue
    const [, key, rawValue = ''] = match
    // Mirrors Next's own \$ escaping rule, see modules/auth/README.md.
    vars[key] = rawValue.trim().replace(/\\\$/g, '$')
  }
  return vars
}

const devEnv = parseEnvFile(path.join(__dirname, '..', '.env.dev.local'))

const child = spawn('next', ['dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ...devEnv }
})

child.on('exit', (code) => process.exit(code ?? 0))
