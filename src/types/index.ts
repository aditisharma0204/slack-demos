// Story and step types
import type { ComponentType } from 'react'

export interface Persona {
  id: string
  name: string
  designation: string
  role: string
  type: 'user' | 'app'
  avatar?: string
  appearance?: {
    theme?: 'light' | 'dark' | string
    sidebarDensity?: 'compact' | 'default'
  }
  channels?: string[]
  dms?: string[]
}

export interface StoryConfig {
  id: string
  title: string
  createdBy: string
  personas: Persona[]
  steps: StoryStep[]
  introInstructions?: string
  workspaceName?: string
}

export type StoryStep =
  | SurfaceStep
  | UserMessageStep
  | AppMessageStep
  | UserActionStep
  | ModalOpenStep
  | ModalSubmitStep
  | ThreadReplyStep
  | BotTypingStep

/** Which pane(s) to show. Single = one full-width view; dual = 60% left, 40% right (Slackbot always right when present). */
export type ViewportView = 'slackbot' | 'channel' | 'thread'

export type Viewport =
  | { mode: 'single'; view: ViewportView }
  | { mode: 'dual'; left: 'channel' | 'thread'; right: 'slackbot' | 'thread' }

export interface BaseStep {
  id: string
  type: string
  /** Optional: which viewport to show at this step. When absent, derived from surface + step type. */
  viewport?: Viewport
}

export interface SurfaceStep extends BaseStep {
  type: 'surface'
  context: {
    surface: 'channel' | 'dm' | 'app_home'
    channel?: string
    with?: string
  }
}

export interface UserMessageStep extends BaseStep {
  type: 'user_message'
  content: {
    text: string
    isSlashCommand?: boolean
    personaId?: string
  }
}

export interface AppMessageStep extends BaseStep {
  type: 'app_message'
  content: {
    text?: string
    blocks?: string | object[]
    personaId?: string
    /** Choice buttons shown below the message (e.g. ["Emotional Abuse", "Harassment"]) */
    choices?: string[]
    /** Template ID from Slackbot templates (plain_text, text_with_buttons, construct_case, etc.) */
    templateId?: string
    /** For construct_case */
    caseTitle?: string
    caseFields?: { label: string; value: string }[]
  }
}

export interface UserActionStep extends BaseStep {
  type: 'user_action'
  content: {
    action: string
    trigger: 'button' | 'shortcut' | 'slash_command'
    personaId?: string
    /** Choice labels when trigger is button and multiple options exist */
    choices?: string[]
  }
}

export interface ModalOpenStep extends BaseStep {
  type: 'modal_open'
  content: {
    view: string | object
  }
}

export interface ModalSubmitStep extends BaseStep {
  type: 'modal_submit'
  content: {
    values?: Record<string, string>
  }
}

export interface ThreadReplyStep extends BaseStep {
  type: 'thread_reply'
  content: {
    actor: 'user' | 'app'
    text?: string
    blocks?: string | object[]
    personaId?: string
  }
}

export interface BotTypingStep extends BaseStep {
  type: 'bot_typing'
  content?: {
    duration?: number
    /** Optional status text (e.g. "Looking into Slack history...") for thinking_with_status */
    statusText?: string
  }
}

/** Persona-specific prototype config (e.g. alex.json, sarah.json) */
export interface PersonaConfig {
  personaId: string
  title: string
  description: string
  stepIds: string[]
  overrides?: {
    introInstructions?: string
    channels?: string[]
    dms?: string[]
    workspaceName?: string
    theme?: string
  }
}

export interface ValidationResult {
  valid: boolean
  message?: string
}

export interface StepTypeDefinition {
  id: string
  name: string
  description: string
  whenToUse: string
  fields: StepFieldDefinition[]
  validAfter?: string[]
  previewComponent?: ComponentType<{ step?: StoryStep }>
}

export interface StepFieldDefinition {
  id: string
  type: 'text' | 'dropdown' | 'blockPicker' | 'datePicker' | 'personaPicker'
  label: string
  required?: boolean
  options?: { value: string; label: string }[]
  default?: string
}
