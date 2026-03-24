export type SlackPersona = 'executive' | 'vp' | 'supervisor'

export type SlackTemplateVariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'

export interface SlackTemplateVariableSchema {
  path: string
  type: SlackTemplateVariableType
  required: boolean
  description: string
}

export interface SlackTemplateActionContract {
  actionId: string
  label: string
  description: string
}

export interface SlackBlockTemplateDefinition {
  id: string
  version: string
  name: string
  description: string
  persona: SlackPersona
  storyTags: string[]
  channel: 'slack'
  blocksTemplate: unknown[]
  variables: SlackTemplateVariableSchema[]
  actions: SlackTemplateActionContract[]
}

export interface SlackTemplateRenderResult {
  ok: boolean
  payload?: { blocks: unknown[] }
  errors: string[]
}

export interface SlackTemplateActionValue {
  templateId: string
  actionId: string
  optionId?: string
  entityId?: string
  version?: string
}
