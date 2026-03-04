import type { Plugin } from 'vite'
import path from 'path'
import fs from 'fs'

const DEMOS_DIR = 'Demos'

/**
 * Finds the demo folder name under Demos/ whose demo.json has the given id.
 * Returns the full path to that folder, or null if not found.
 */
function findDemoFolderById(rootDir: string, id: string): string | null {
  const demosPath = path.join(rootDir, DEMOS_DIR)
  if (!fs.existsSync(demosPath) || !fs.statSync(demosPath).isDirectory()) {
    return null
  }
  const entries = fs.readdirSync(demosPath, { withFileTypes: true })
  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const demoJsonPath = path.join(demosPath, ent.name, 'demo.json')
    if (!fs.existsSync(demoJsonPath)) continue
    try {
      const raw = fs.readFileSync(demoJsonPath, 'utf-8')
      const data = JSON.parse(raw) as { id?: string }
      if (data.id === id) {
        return path.join(demosPath, ent.name)
      }
    } catch {
      // skip invalid or unreadable demo.json
    }
  }
  return null
}

/**
 * Vite plugin that adds DELETE /api/demos/:id to remove a demo folder.
 * Only removes the single folder for that demo; no shared files are touched.
 * Works in dev server only.
 */
export function deleteDemoPlugin(): Plugin {
  return {
    name: 'delete-demo-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'DELETE' || !req.url?.startsWith('/api/demos/')) {
          next()
          return
        }
        const id = decodeURIComponent(req.url.slice('/api/demos/'.length).split('?')[0].split('/')[0])
        if (!id) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing demo id' }))
          return
        }
        const rootDir = process.cwd()
        const folderPath = findDemoFolderById(rootDir, id)
        if (!folderPath) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Demo not found' }))
          return
        }
        try {
          fs.rmSync(folderPath, { recursive: true })
          res.statusCode = 204
          res.end()
        } catch (err) {
          console.error('[delete-demo]', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Failed to delete demo' }))
        }
      })
    },
  }
}
