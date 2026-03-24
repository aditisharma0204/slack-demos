import type { SlackBlockTemplateDefinition } from '@/slackbot-templates/types'
import { meetingConflictV1Template } from '@/slackbot-templates/templates/meetingConflict.v1'
import { deviceRequestApprovalV1Template } from '@/slackbot-templates/templates/deviceRequestApproval.v1'
import { timeOffApprovalV1Template } from '@/slackbot-templates/templates/timeOffApproval.v1'
import { additionalImportedTemplatesV1 } from '@/slackbot-templates/templates/additionalImportedTemplates.v1'

const baseTemplates: SlackBlockTemplateDefinition[] = [
  meetingConflictV1Template,
  deviceRequestApprovalV1Template,
  timeOffApprovalV1Template,
  ...additionalImportedTemplatesV1,
]
const importedTemplateMap = new Map<string, SlackBlockTemplateDefinition>()

export function getSlackBlockTemplates(): SlackBlockTemplateDefinition[] {
  const merged = new Map<string, SlackBlockTemplateDefinition>()
  for (const template of baseTemplates) {
    merged.set(template.id, template)
  }
  for (const [id, template] of importedTemplateMap.entries()) {
    merged.set(id, template)
  }
  return Array.from(merged.values())
}

export function getSlackBlockTemplateById(
  id: string,
  version?: string
): SlackBlockTemplateDefinition | undefined {
  const templates = getSlackBlockTemplates()
  if (version) return templates.find((t) => t.id === id && t.version === version)
  return templates.find((t) => t.id === id)
}

export function upsertSlackBlockTemplates(
  candidates: SlackBlockTemplateDefinition[]
): { upsertedIds: string[]; overwrittenIds: string[] } {
  const upsertedIds: string[] = []
  const overwrittenIds: string[] = []
  const existingIds = new Set(getSlackBlockTemplates().map((template) => template.id))

  for (const candidate of candidates) {
    if (existingIds.has(candidate.id)) overwrittenIds.push(candidate.id)
    importedTemplateMap.set(candidate.id, candidate)
    upsertedIds.push(candidate.id)
    existingIds.add(candidate.id)
  }

  return { upsertedIds, overwrittenIds: Array.from(new Set(overwrittenIds)) }
}
