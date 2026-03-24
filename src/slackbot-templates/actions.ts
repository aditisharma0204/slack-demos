import { getSlackBlockTemplateById } from '@/slackbot-templates/registry'
import type { SlackTemplateActionValue } from '@/slackbot-templates/types'

export function buildTemplateActionValue(input: SlackTemplateActionValue): string {
  return JSON.stringify(input)
}

export function parseTemplateActionValue(value: string): SlackTemplateActionValue | null {
  try {
    const parsed = JSON.parse(value) as SlackTemplateActionValue
    if (!parsed || typeof parsed.templateId !== 'string' || typeof parsed.actionId !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function validateTemplateAction(templateId: string, actionId: string, version?: string): boolean {
  const template = getSlackBlockTemplateById(templateId, version)
  if (!template) return false
  return template.actions.some((action) => action.actionId === actionId)
}
