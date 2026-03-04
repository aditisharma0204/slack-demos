import type { StoryConfig, StoryStep } from '@/types'

/**
 * Normalizes demo steps at load time so that:
 * - app_message steps followed by user_action(s) with choices get content.choices (and templateId "text_with_buttons"
 *   when the template was plain_text or unset). construct_case keeps its templateId but still receives content.choices
 *   so the case card can render CTAs below the card.
 * - thread_reply steps get the same treatment: choices and templateId from following user_action(s) so buttons render.
 * This ensures exactly one set of CTAs per message: no duplicates, no missing buttons.
 * Mutates the given story in place.
 */
export function normalizeDemoSteps(story: StoryConfig): void {
  const steps = story.steps
  if (!Array.isArray(steps)) return

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i] as StoryStep & { type: string; content?: Record<string, unknown> }
    if (!step.content) continue

    const isAppMessage = step.type === 'app_message'
    const isThreadReply = step.type === 'thread_reply'
    if (!isAppMessage && !isThreadReply) continue

    const content = step.content as { templateId?: string; choices?: string[] }
    // Collect choices from all consecutive user_action steps immediately after this message
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
      if (isAppMessage) {
        if (!content.templateId || content.templateId === 'plain_text') {
          content.templateId = 'text_with_buttons'
        }
        if (!content.choices || content.choices.length === 0) {
          content.choices = collectedChoices
        }
      } else {
        // thread_reply: same as app_message so thread reply buttons always render
        if (!content.templateId || content.templateId === 'plain_text') {
          content.templateId = 'text_with_buttons'
        }
        if (!content.choices || content.choices.length === 0) {
          content.choices = collectedChoices
        }
      }
    }
  }
}
