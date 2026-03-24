import type { SlackBlockTemplateDefinition } from '@/slackbot-templates/types'

export interface ImportedTemplateCandidate {
  sourceUrl: string
  definition: SlackBlockTemplateDefinition
  willOverwrite: boolean
}

export interface InvalidImportCandidate {
  sourceUrl: string
  reason: string
}

export interface BulkImportReview {
  valid: ImportedTemplateCandidate[]
  invalid: InvalidImportCandidate[]
  overwrittenIds: string[]
}

export function buildBulkImportReview(
  input: string,
  existingIds: Set<string>
): BulkImportReview {
  const urls = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const valid: ImportedTemplateCandidate[] = []
  const invalid: InvalidImportCandidate[] = []
  const overwrittenIds = new Set<string>()
  const generatedIdsInBatch = new Set<string>()

  for (const sourceUrl of urls) {
    const parsed = parseBlockKitBuilderUrl(sourceUrl)
    if (!parsed.ok) {
      invalid.push({ sourceUrl, reason: parsed.reason })
      continue
    }

    const uniqueId = ensureBatchUniqueId(parsed.definition.id, generatedIdsInBatch)
    generatedIdsInBatch.add(uniqueId)

    const definition: SlackBlockTemplateDefinition = {
      ...parsed.definition,
      id: uniqueId,
      name: `Imported ${uniqueId}`,
    }

    const willOverwrite =
      existingIds.has(definition.id) || valid.some((item) => item.definition.id === definition.id)
    if (willOverwrite) overwrittenIds.add(definition.id)

    valid.push({ sourceUrl, definition, willOverwrite })
  }

  return { valid, invalid, overwrittenIds: Array.from(overwrittenIds.values()) }
}

function ensureBatchUniqueId(baseId: string, seen: Set<string>): string {
  if (!seen.has(baseId)) return baseId
  let index = 2
  let candidate = `${baseId}_${index}`
  while (seen.has(candidate)) {
    index += 1
    candidate = `${baseId}_${index}`
  }
  return candidate
}

function parseBlockKitBuilderUrl(
  sourceUrl: string
): { ok: true; definition: SlackBlockTemplateDefinition } | { ok: false; reason: string } {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(sourceUrl)
  } catch {
    return { ok: false, reason: 'Invalid URL format.' }
  }

  const hashPayload = parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash
  if (!hashPayload) return { ok: false, reason: 'Missing Block Kit payload in URL hash.' }

  let decoded: string
  try {
    decoded = decodeURIComponent(hashPayload)
  } catch {
    return { ok: false, reason: 'Unable to decode URL hash payload.' }
  }

  let jsonPayload: unknown
  try {
    jsonPayload = JSON.parse(decoded)
  } catch {
    return { ok: false, reason: 'Hash payload is not valid JSON.' }
  }

  if (!jsonPayload || typeof jsonPayload !== 'object') {
    return { ok: false, reason: 'Payload must be an object with blocks.' }
  }

  const payloadRecord = jsonPayload as Record<string, unknown>
  const blocks = payloadRecord.blocks
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { ok: false, reason: 'Payload does not contain a non-empty blocks array.' }
  }

  const suggestedId = deriveTemplateId(payloadRecord)
  const definition: SlackBlockTemplateDefinition = {
    id: suggestedId,
    version: 'imported',
    name: `Imported ${suggestedId}`,
    description: 'Imported from Slack Block Kit Builder.',
    persona: 'supervisor',
    storyTags: ['bulk_imported', 'block_kit'],
    channel: 'slack',
    blocksTemplate: blocks,
    variables: [],
    actions: [],
  }

  return { ok: true, definition }
}

function deriveTemplateId(payload: Record<string, unknown>): string {
  const fromCallback = typeof payload.callback_id === 'string' ? payload.callback_id : ''
  const fromTitle = typeof payload.title === 'string' ? payload.title : ''
  const base = fromCallback || fromTitle || findFirstTextLine(payload) || 'imported_template'
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `bk_${normalized || 'imported_template'}`
}

function findFirstTextLine(payload: Record<string, unknown>): string {
  const blocks = payload.blocks
  if (!Array.isArray(blocks)) return ''
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const text = (block as Record<string, unknown>).text
    if (!text || typeof text !== 'object') continue
    const raw = (text as Record<string, unknown>).text
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim().slice(0, 60)
  }
  return ''
}
