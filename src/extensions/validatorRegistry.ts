import type { StoryStep, StoryConfig, ValidationResult } from '@/types'

export type ValidatorFn = (
  step: StoryStep,
  context: { steps: StoryStep[]; index: number; story: StoryConfig }
) => ValidationResult

const validators: ValidatorFn[] = []

export function registerValidator(validator: ValidatorFn): void {
  validators.push(validator)
}

export function validateStep(
  step: StoryStep,
  context: { steps: StoryStep[]; index: number; story: StoryConfig }
): ValidationResult[] {
  return validators
    .map((fn) => fn(step, context))
    .filter((r) => !r.valid)
}

export function validateStory(story: StoryConfig): ValidationResult[] {
  const results: ValidationResult[] = []
  story.steps.forEach((step, index) => {
    const stepResults = validateStep(step, {
      steps: story.steps,
      index,
      story,
    })
    results.push(...stepResults)
  })
  return results
}

export { validateDemo } from './validators/personaStepIdsValidator'

export function clearValidators(): void {
  validators.length = 0
}
