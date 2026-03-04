import type { StoryStep, StoryConfig, ValidationResult } from '@/types'

type ValidatorFn = (
  step: StoryStep,
  context: { steps: StoryStep[]; index: number; story: StoryConfig }
) => ValidationResult

/** Validates modal_open steps (e.g. require content.view). */
export const validateModalOpen: ValidatorFn = (step, context) => {
  if (step.type !== 'modal_open') return { valid: true }
  const content = (step as { content?: { view?: string } }).content
  if (!content?.view) {
    return { valid: false, message: `Step "${step.id}": modal_open should have content.view.` }
  }
  return { valid: true }
}

/** Validates modal_submit steps (e.g. should follow modal_open). */
export const validateModalSubmit: ValidatorFn = (step, context) => {
  if (step.type !== 'modal_submit') return { valid: true }
  const prev = context.steps[context.index - 1]
  if (prev?.type !== 'modal_open') {
    return { valid: false, message: `Step "${step.id}": modal_submit should follow a modal_open step.` }
  }
  return { valid: true }
}
