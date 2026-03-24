import { getSlackBlockTemplateById } from '@/slackbot-templates/registry'
import type {
  SlackBlockTemplateDefinition,
  SlackTemplateRenderResult,
  SlackTemplateVariableType,
} from '@/slackbot-templates/types'

interface RenderOptions {
  strict?: boolean
  version?: string
}

export function renderSlackTemplate(
  templateId: string,
  data: Record<string, unknown>,
  options: RenderOptions = {}
): SlackTemplateRenderResult {
  const template = getSlackBlockTemplateById(templateId, options.version)
  if (!template) {
    return {
      ok: false,
      errors: [`Template "${templateId}"${options.version ? `@${options.version}` : ''} not found.`],
    }
  }

  const errors = validateTemplateData(template, data)
  if (errors.length > 0 && options.strict !== false) {
    return { ok: false, errors }
  }

  const blocks = deepReplace(template.blocksTemplate, data) as unknown[]
  return { ok: errors.length === 0, payload: { blocks }, errors }
}

function validateTemplateData(
  template: SlackBlockTemplateDefinition,
  data: Record<string, unknown>
): string[] {
  const errors: string[] = []
  for (const variable of template.variables) {
    const value = getByPath(data, variable.path)
    if (value == null) {
      if (variable.required) errors.push(`Missing required variable "${variable.path}".`)
      continue
    }
    if (!isType(value, variable.type)) {
      errors.push(
        `Invalid type for "${variable.path}". Expected ${variable.type}, got ${typeof value}.`
      )
    }
  }
  return errors
}

function isType(value: unknown, expected: SlackTemplateVariableType): boolean {
  if (expected === 'array') return Array.isArray(value)
  if (expected === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value)
  return typeof value === expected
}

function getByPath(input: unknown, path: string): unknown {
  if (!path) return input
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current == null) return undefined
    if (Array.isArray(current)) {
      const index = Number(segment)
      return Number.isNaN(index) ? undefined : current[index]
    }
    if (typeof current === 'object') {
      return (current as Record<string, unknown>)[segment]
    }
    return undefined
  }, input)
}

function deepReplace(input: unknown, data: Record<string, unknown>): unknown {
  if (Array.isArray(input)) return input.map((item) => deepReplace(item, data))
  if (typeof input === 'string') return replaceTokens(input, data)
  if (typeof input === 'object' && input !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input)) {
      result[key] = deepReplace(value, data)
    }
    return result
  }
  return input
}

function replaceTokens(input: string, data: Record<string, unknown>): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, path: string) => {
    const value = getByPath(data, path)
    if (value == null) return ''
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
    return ''
  })
}
