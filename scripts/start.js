import { spawn } from 'child_process'

const port = process.env.PORT || 3000
const child = spawn('npx', ['serve', '-s', 'dist', '-l', String(port)], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
})

child.on('exit', (code) => process.exit(code || 0))
