import type { StoryConfig, StoryStep } from '@/types'

/**
 * Normalizes demo steps at load time so that:
 * - app_message steps followed by user_action(s) with choices get content.choices (and templateId "text_with_buttons"
 *   when the template was plain_text or unset). construct_case keeps its templateId but still receives content.choices
 *   so the case card can render CTAs below the card.
 * This ensures exactly one set of CTAs per message: no duplicates, no missing buttons.
 * Mutates the given story in place.
 */
export function normalizeDemoSteps(story: StoryConfig): void {
  const steps = story.steps
  if (!Array.isArray(steps)) return

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i] as StoryStep & { content?: Record<string, unknown> }
    if (step.type !== 'app_message' || !step.content) continue

    const content = step.content as { templateId?: string; choices?: string[] }
    // Collect choices from all consecutive user_action steps immediately after this app_message
    const collectedChoices: string[] = []
    let j = i + 1
    while (j < steps.length) {
      const next = steps[j] as StoryStep & { type: string; content?: { choices?: string[] } }
      if (next.type !== 'user_action') break
      const nextChoices = next.content?.choices
      if (Array.isArray(nextChoices)) {
        for (const c of nextChoices) {
          if (typeof c === 'string' && c && !collectedChoices.includes(c)) collectedChoices.push(c)
        }
      }
      j++
    }

    if (collectedChoices.length > 0) {
      // Upgrade to text_with_buttons only when template was plain_text or unset (construct_case keeps its template)
      if (!content.templateId || content.templateId === 'plain_text') {
        content.templateId = 'text_with_buttons'
      }
      // Always attach choices so the template (text_with_buttons or construct_case) can render CTAs
      if (!content.choices || content.choices.length === 0) {
        content.choices = collectedChoices
      }
    }
  }
}
