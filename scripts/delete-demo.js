#!/usr/bin/env node
/**
 * Deletes a demo by id. Only removes that demo's folder under Demos/.
 * Usage: node scripts/delete-demo.js <demo-id>
 * Example: node scripts/delete-demo.js employee-relocation-resolution-by-pritesh-chavan
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMOS_DIR = 'Demos'

function findDemoFolderById(rootDir, id) {
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
      const data = JSON.parse(raw)
      if (data.id === id) {
        return path.join(demosPath, ent.name)
      }
    } catch {
      // skip invalid or unreadable demo.json
    }
  }
  return null
}

const id = process.argv[2]
if (!id) {
  console.error('Usage: node scripts/delete-demo.js <demo-id>')
  process.exit(1)
}

const rootDir = path.resolve(__dirname, '..')
const folderPath = findDemoFolderById(rootDir, id)
if (!folderPath) {
  console.error('Demo not found:', id)
  process.exit(1)
}

try {
  fs.rmSync(folderPath, { recursive: true })
  console.log('Deleted:', path.relative(rootDir, folderPath))
} catch (err) {
  console.error('Failed to delete:', err.message)
  process.exit(1)
}
