import type { StoryConfig, PersonaConfig, ValidationResult } from '@/types'

/**
 * Validates that when a persona's path includes a user_action step,
 * the immediately following app_message step (Slackbot reply) is also in their stepIds.
 * Otherwise the user never sees the reply after clicking (e.g. Approve/Reject).
 */
export function validatePersonaStepIds(
  story: StoryConfig,
  personaConfig: PersonaConfig
): ValidationResult[] {
  const results: ValidationResult[] = []
  const stepIdSet = new Set(personaConfig.stepIds)
  const steps = story.steps

  for (let i = 0; i < steps.length - 1; i++) {
    const step = steps[i]
    const nextStep = steps[i + 1]
    if (!step || !nextStep) continue

    const stepInPersonaPath = stepIdSet.has(step.id)
    if (!stepInPersonaPath) continue

    if (step.type !== 'user_action') continue
    if (nextStep.type !== 'app_message') continue

    const nextInPersonaPath = stepIdSet.has(nextStep.id)
    if (!nextInPersonaPath) {
      results.push({
        valid: false,
        message: `Persona "${personaConfig.title}" (${personaConfig.personaId}): step "${step.id}" is a user_action but the next step "${nextStep.id}" (Slackbot reply) is missing from stepIds. Add "${nextStep.id}" to stepIds so the user sees the reply after the action.`,
      })
    }
  }

  return results
}

export function validateDemo(
  story: StoryConfig,
  personaConfigs: PersonaConfig[]
): ValidationResult[] {
  const results: ValidationResult[] = []
  for (const config of personaConfigs) {
    results.push(...validatePersonaStepIds(story, config))
  }
  return results
}
