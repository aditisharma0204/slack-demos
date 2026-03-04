import type { ComponentType } from 'react'

export interface SlackResponseTemplateConfig {
  [key: string]: string | number | boolean | undefined
}

export interface SlackResponseTemplate {
  id: string
  name: string
  description: string
  type: string
  config: SlackResponseTemplateConfig
}

const STORAGE_KEY = 'slackResponseTemplates'

let templateComponents: Map<string, ComponentType<any>> = new Map()

/** Register a React component for a template type. Called when template components are loaded. */
export function registerTemplateComponent(
  templateId: string,
  component: ComponentType<any>
): void {
  templateComponents.set(templateId, component)
}

/** Get the React component for a template ID, or undefined if not registered. */
export function getTemplateComponent(
  templateId: string
): ComponentType<any> | undefined {
  return templateComponents.get(templateId)
}

/** Load template list: from localStorage if present, else from bundled JSON. */
function loadTemplateList(): SlackResponseTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as SlackResponseTemplate[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  // Fallback: use bundled default (imported at runtime)
  return getBundledTemplates()
}

import bundledTemplatesJson from '@/data/slackResponseTemplates.json'

const defaultTemplates: SlackResponseTemplate[] = Array.isArray(bundledTemplatesJson)
  ? (bundledTemplatesJson as SlackResponseTemplate[])
  : (bundledTemplatesJson as { default?: SlackResponseTemplate[] }).default ?? []

function getBundledTemplates(): SlackResponseTemplate[] {
  return defaultTemplates
}

/** Get all templates (from localStorage override or bundled JSON). */
export function getAllTemplates(): SlackResponseTemplate[] {
  return loadTemplateList()
}

/** Get a single template by id. */
export function getTemplateById(id: string): SlackResponseTemplate | undefined {
  return getAllTemplates().find((t) => t.id === id)
}

/** Save template list to localStorage (for in-app edits). Returns success. */
export function saveTemplates(templates: SlackResponseTemplate[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
    return true
  } catch {
    return false
  }
}

/** Export current template list as JSON string. */
export function exportTemplatesAsJson(): string {
  return JSON.stringify(getAllTemplates(), null, 2)
}

/** Import template list from JSON string. Merges by id; returns new list. */
export function importTemplatesFromJson(json: string): SlackResponseTemplate[] {
  try {
    const parsed = JSON.parse(json) as SlackResponseTemplate[]
    if (!Array.isArray(parsed)) return getAllTemplates()
    const valid = parsed.filter(
      (t) => t && typeof t.id === 'string' && typeof t.name === 'string'
    )
    saveTemplates(valid.length ? valid : getAllTemplates())
    return loadTemplateList()
  } catch {
    return getAllTemplates()
  }
}

/** Reset to bundled defaults (clear localStorage override). */
export function resetTemplatesToDefault(): SlackResponseTemplate[] {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  return getBundledTemplates()
}
