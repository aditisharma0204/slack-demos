import type { StoryConfig, PersonaConfig } from '@/types'
import { validateDemo } from '@/extensions/validatorRegistry'
import { normalizeDemoSteps } from '@/engine/normalizeDemoSteps'

// Load demo.json and persona configs (*.json except demo.json) from each demo folder
const allJsonModules = import.meta.glob<{ default: unknown }>('../../Demos/**/*.json', {
  eager: true,
})

// Load story.md from each demo folder (raw markdown)
const storyMdModules = import.meta.glob<{ default: string }>('../../Demos/**/story.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const folderToMarkdown = new Map<string, string>()
for (const [path, mod] of Object.entries(storyMdModules)) {
  const folderPath = path.split('/').slice(0, -1).join('/')
  const content = typeof mod === 'string' ? mod : (mod?.default ?? '')
  if (content) folderToMarkdown.set(folderPath, content)
}

// Group by folder: folderPath -> { demo?: StoryConfig, personas: PersonaConfig[] }
const folderMap = new Map<string, { demo?: StoryConfig; personas: PersonaConfig[] }>()

for (const [path, mod] of Object.entries(allJsonModules)) {
  const parts = path.split('/')
  const filename = parts[parts.length - 1]
  const folderPath = parts.slice(0, -1).join('/')

  if (!folderMap.has(folderPath)) {
    folderMap.set(folderPath, { personas: [] })
  }
  const entry = folderMap.get(folderPath)!

  const data = mod && typeof mod === 'object' && 'default' in mod ? (mod as { default: unknown }).default : null

  if (filename === 'demo.json' && data && typeof data === 'object' && 'id' in data) {
    const story = data as StoryConfig
    normalizeDemoSteps(story)
    entry.demo = story
  } else if (filename !== 'demo.json' && data && typeof data === 'object' && 'personaId' in data && 'stepIds' in data) {
    entry.personas.push(data as PersonaConfig)
  }
}

// Build story lookup: storyId -> { story, personaConfigs, storyMarkdown? }
const storyMap = new Map<
  string,
  { story: StoryConfig; personaConfigs: Map<string, PersonaConfig>; storyMarkdown?: string }
>()

for (const [folderPath, { demo, personas }] of folderMap.entries()) {
  if (!demo) continue
  const personaConfigs = new Map<string, PersonaConfig>()
  for (const p of personas) {
    personaConfigs.set(p.personaId, p)
  }
  const demoResults = validateDemo(demo, personas)
  if (demoResults.length > 0) {
    console.warn(
      `[Demo validation] ${demo.title} (${demo.id}):`,
      demoResults.map((r) => r.message).join('; ')
    )
  }
  storyMap.set(demo.id, {
    story: demo,
    personaConfigs,
    storyMarkdown: folderToMarkdown.get(folderPath),
  })
}

const stories: StoryConfig[] = Array.from(storyMap.values()).map((v) => v.story)

export function getStories(): StoryConfig[] {
  return stories
}

export function getStory(id: string): StoryConfig | undefined {
  return storyMap.get(id)?.story
}

export function getPersonaConfig(storyId: string, personaId: string): PersonaConfig | undefined {
  return storyMap.get(storyId)?.personaConfigs.get(personaId)
}

export function getPersonaConfigs(storyId: string): PersonaConfig[] {
  const configs = storyMap.get(storyId)?.personaConfigs
  return configs ? Array.from(configs.values()) : []
}

export function getStoryMarkdown(storyId: string): string | undefined {
  return storyMap.get(storyId)?.storyMarkdown
}
