import type { StoryStep, Viewport, ViewportView } from '@/types'

export type SurfaceKind = 'dm' | 'channel'

/** Get surface at a given step index: last surface step before or at index. */
export function getSurfaceAtStep(steps: StoryStep[], stepIndex: number): { kind: SurfaceKind; channel?: string } | null {
  for (let i = stepIndex; i >= 0; i--) {
    const step = steps[i]
    if (step?.type === 'surface') {
      const ctx = (step as any).context
      if (ctx?.surface === 'dm') return { kind: 'dm' }
      if (ctx?.surface === 'channel') return { kind: 'channel', channel: ctx?.channel }
    }
  }
  return null
}

/** Whether the step at stepIndex is a thread_reply (or we're still in "thread context" after one). */
export function isStepInThread(steps: StoryStep[], stepIndex: number): boolean {
  const step = steps[stepIndex]
  return step?.type === 'thread_reply'
}

/** Resolve viewport for the given step: use explicit viewport on step, else derive from surface + step type. */
export function getViewportForStep(steps: StoryStep[], stepIndex: number): Viewport {
  const step = steps[stepIndex]
  const explicit = step && 'viewport' in step && (step as any).viewport
  if (explicit && typeof explicit === 'object' && 'mode' in explicit) {
    return explicit as Viewport
  }

  const surface = getSurfaceAtStep(steps, stepIndex)
  const inThread = isStepInThread(steps, stepIndex)

  if (!surface) {
    return { mode: 'single', view: 'slackbot' }
  }
  if (surface.kind === 'dm') {
    return { mode: 'single', view: 'slackbot' }
  }
  // Channel surface
  if (inThread) {
    return { mode: 'single', view: 'thread' }
  }
  return { mode: 'single', view: 'channel' }
}

/** Which view is "active" at this step (where the conversation is happening; only that pane's composer can advance). */
export function getActiveViewForStep(steps: StoryStep[], stepIndex: number): ViewportView {
  const step = steps[stepIndex]
  const rawVp = step && 'viewport' in step ? (step as { viewport?: unknown }).viewport : undefined
  const explicitVp =
    rawVp && typeof rawVp === 'object' && rawVp !== null && 'mode' in rawVp ? (rawVp as Viewport) : undefined
  if (
    explicitVp?.mode === 'dual' &&
    explicitVp.right === 'slackbot' &&
    explicitVp.left === 'mission_control'
  ) {
    return 'slackbot'
  }
  // Single mission_control: no chat surface is active; fall back to slackbot
  // (used only for chat-state computation, the pane itself isn't a chat view).
  if (explicitVp?.mode === 'single' && explicitVp.view === 'mission_control') {
    return 'slackbot'
  }
  const surface = getSurfaceAtStep(steps, stepIndex)
  if (!surface) return 'slackbot'
  if (surface.kind === 'dm') return 'slackbot'
  if (isStepInThread(steps, stepIndex)) return 'thread'
  return 'channel'
}
