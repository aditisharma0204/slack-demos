import type { Persona } from '@/types'

const CHANNELS_BY_DESIGNATION: Record<string, string[]> = {
  Executive: ['#executive-briefing', '#board-updates', '#org-announcements'],
  'LOB VP': ['#ops-leadership', '#vp-sync', '#hr-policies'],
  VP: ['#ops-leadership', '#vp-sync', '#hr-policies'],
  Manager: ['#team-updates', '#hr-requests', '#sales-support'],
  Supervisor: ['#team-alpha', '#sprint-planning', '#support-requests'],
  Employee: ['#q3-priorities', '#Project 2', '#project 1'],
  App: [],
}

const DMS_BY_DESIGNATION: Record<string, string[]> = {
  Executive: ['CFO', 'Slackbot', 'CEO'],
  'LOB VP': ['Slackbot', 'Ops Lead'],
  Manager: ['Lee Hao, Lisa Dawson', 'Slackbot', 'Team Lead', 'Claude', 'Sales Agent'],
  Supervisor: ['Lee Hao, Lisa Dawson', 'Slackbot', 'Team Lead', 'Claude', 'Sales Agent'],
  Employee: ['Lee Hao, Lisa Dawson', 'Slackbot', 'Claude', 'Sales Agent'],
  App: [],
}

export function generateChannelsForPersona(persona: Persona, _allPersonas: Persona[]): string[] {
  if (persona.channels?.length) return persona.channels
  const designation = persona.designation
  const channels = CHANNELS_BY_DESIGNATION[designation] ?? ['#general', '#random']
  return [...new Set(channels)]
}

export function generateDmsForPersona(persona: Persona, allPersonas: Persona[]): string[] {
  if (persona.dms?.length) return persona.dms
  const designation = persona.designation
  const baseDms = DMS_BY_DESIGNATION[designation] ?? ['Slackbot']
  const appNames = allPersonas.filter((p) => p.type === 'app').map((p) => p.name)
  return [...new Set([...baseDms, ...appNames])]
}
