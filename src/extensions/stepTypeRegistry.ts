import type { StepTypeDefinition } from '@/types'

const registry: Map<string, StepTypeDefinition> = new Map()

export function registerStepType(definition: StepTypeDefinition): void {
  registry.set(definition.id, definition)
}

export function getStepType(id: string): StepTypeDefinition | undefined {
  return registry.get(id)
}

export function getAllStepTypes(): StepTypeDefinition[] {
  return Array.from(registry.values())
}

export function clearStepTypes(): void {
  registry.clear()
}
