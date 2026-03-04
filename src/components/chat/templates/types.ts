import type { SlackResponseTemplateConfig } from '@/extensions/slackResponseTemplateRegistry'

export interface TemplateRenderProps {
  content: {
    text?: string
    choices?: string[]
    personaNames?: string[]
    statusText?: string
    caseTitle?: string
    caseFields?: { label: string; value: string }[]
    [key: string]: unknown
  }
  config: SlackResponseTemplateConfig
  timestamp?: string
}
