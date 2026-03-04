import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import type { StoryConfig, StoryStep, PersonaConfig, ViewportView } from '@/types'
import { getViewportForStep, getActiveViewForStep, getSurfaceAtStep } from '@/engine/viewport'
import { ClickThroughOverlay } from '@/components/demo/ClickThroughOverlay'
import { DemoPersonaBar } from '@/components/demo/DemoPersonaBar'
import { DatePickerModal } from '@/components/demo/DatePickerModal'
import { ChatView } from '@/components/chat/ChatView'

/** Reserved id for "Full story (step-by-step)" showcase mode in the View as dropdown */
export const FULL_STORY_PERSONA_ID = 'full'

interface StoryEngineProps {
  story: StoryConfig
  /** When provided, filters steps by persona and applies overrides (persona-specific prototype) */
  personaConfig?: PersonaConfig
  /** Called when user switches persona in the bar (navigates to new persona's prototype) */
  onPersonaChange?: (personaId: string | null) => void
  /** When true, all steps from demo.json are shown in story order (showcase mode) */
  fullStoryMode?: boolean
}

export function StoryEngine({ story, personaConfig, onPersonaChange, fullStoryMode = false }: StoryEngineProps) {
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'

  // Filter steps by persona when in persona-specific mode
  const steps = useMemo(() => {
    if (!personaConfig) return story.steps
    const idSet = new Set(personaConfig.stepIds)
    return story.steps.filter((s) => idSet.has(s.id))
  }, [story.steps, personaConfig])

  const prototypeName = personaConfig
    ? `${story.title} (${personaConfig.title})`
    : `${story.title}_by_${story.createdBy}`
  const totalSteps = steps.length
  const [currentStepIndex, setCurrentStepIndex] = useState(1) // 1-based; start at first step (no intro screen)
  const [overlayEnabled, setOverlayEnabled] = useState(true)
  const [lastSelectedChoice, setLastSelectedChoice] = useState<string | null>(null)

  const goNext = useCallback(() => {
    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps))
  }, [totalSteps])

  const handleChoiceClick = useCallback((choice: string) => {
    setLastSelectedChoice(choice)
    setCurrentStepIndex((i) => {
      const stepIndex0 = i - 1
      // Advance to the step that defines this choice (so multiple buttons on one message can branch correctly)
      const choiceStepIndex = steps.findIndex(
        (s, idx) => idx > stepIndex0 && s.type === 'user_action' && (s as any).content?.choices?.includes(choice)
      )
      if (choiceStepIndex >= 0) return Math.min(choiceStepIndex + 1, totalSteps)
      return Math.min(i + 1, totalSteps)
    })
  }, [totalSteps, steps])

  const goBack = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(i - 1, 1))
  }, [])

  useEffect(() => {
    document.title = prototypeName
  }, [prototypeName])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goBack])

  const userPersonas = story.personas.filter((p) => p.type === 'user')
  const fullStoryOption = { id: FULL_STORY_PERSONA_ID, name: 'Full story (step-by-step)', designation: '', role: '', type: 'user' as const }
  const barPersonas = [fullStoryOption, ...userPersonas]
  const viewAsPersonaId = fullStoryMode ? FULL_STORY_PERSONA_ID : (personaConfig?.personaId ?? null)

  const stepIndex = currentStepIndex - 1 // 0-based index into steps

  // Auto-advance: Slackbot reply steps (app_message, thread_reply) and related steps advance after 1s. Do NOT auto-advance when next step is user_action with choices (user must click) or date modal.
  const currentStep = steps[stepIndex]
  const nextStep = steps[stepIndex + 1]
  const stepAfterNext = steps[stepIndex + 2]
  const nextOpensDateModal = nextStep?.type === 'user_action' && stepAfterNext?.type === 'modal_open' && (stepAfterNext as any).content?.view === 'date-picker'
  const nextIsUserActionWithChoices = nextStep?.type === 'user_action' && (nextStep as any).content?.choices?.length
  const nextIsSlackbotReply = nextStep?.type === 'app_message' || nextStep?.type === 'thread_reply'
  const nextIsPersonaChange = nextStep?.type === 'surface'
  const isUserMessageStep = currentStep?.type === 'user_message'
  const isChoiceStep = currentStep?.type === 'user_action' && (currentStep as any).content?.choices?.length
  const isUserActionOpeningModal = currentStep?.type === 'user_action' && nextStep?.type === 'modal_open' && (nextStep as any).content?.view === 'date-picker'
  const isModalOpenStep = isUserActionOpeningModal || (currentStep?.type === 'modal_open' && (currentStep as any).content?.view === 'date-picker')
  const autoAdvanceDelayMs =
    nextIsPersonaChange ? null :
    currentStep?.type === 'bot_typing' ? 1000 :
    currentStep?.type === 'user_action' && nextIsSlackbotReply && !nextOpensDateModal ? 1000 :
    currentStep?.type === 'app_message' && !nextOpensDateModal && !nextIsUserActionWithChoices ? 1000 :
    currentStep?.type === 'thread_reply' && !nextIsUserActionWithChoices ? 1000 :
    currentStep?.type === 'surface' ? 1000 :
    currentStep?.type === 'modal_submit' ? 600 :
    null

  useEffect(() => {
    if (isEditMode || isUserMessageStep || isModalOpenStep || autoAdvanceDelayMs == null) return
    // Block auto-advance on choice step only when next step is not modal_open and not a Slackbot reply (so we can advance to show modal, or we auto-advance to show reply)
    if (isChoiceStep && nextStep?.type !== 'modal_open' && !nextIsSlackbotReply) return
    const t = setTimeout(goNext, autoAdvanceDelayMs)
    return () => clearTimeout(t)
  }, [stepIndex, isEditMode, isUserMessageStep, isChoiceStep, isModalOpenStep, nextStep?.type, nextIsSlackbotReply, autoAdvanceDelayMs, goNext])

  const viewport = getViewportForStep(steps, stepIndex)
  const activeView = getActiveViewForStep(steps, stepIndex)
  const surface = getSurfaceAtStep(steps, stepIndex)
  const channelName = surface?.kind === 'channel' ? (surface.channel ?? '#channel') : undefined

  const slackbotState = computeChatStateForView(steps, stepIndex, 'slackbot', story.personas, lastSelectedChoice)
  const channelState = computeChatStateForView(steps, stepIndex, 'channel', story.personas, lastSelectedChoice)
  const threadState = computeChatStateForView(steps, stepIndex, 'thread', story.personas, lastSelectedChoice)

  const activeState =
    activeView === 'slackbot' ? slackbotState
    : activeView === 'channel' ? channelState
    : threadState
  const hasChoices = activeState.chatMessages.length > 0 && !!activeState.chatMessages[activeState.chatMessages.length - 1].choices
  // Hide overlay when step will auto-advance so user sees the reply then advance without clicking
  const showOverlay = !isEditMode && !isUserMessageStep && !hasChoices && !isModalOpenStep && autoAdvanceDelayMs == null

  // Default dates for date-picker modal (from modal_submit step; when opened from user_action, that step is 2 ahead)
  const modalSubmitStep = isUserActionOpeningModal ? steps[stepIndex + 2] : steps[stepIndex + 1]
  const modalValues = modalSubmitStep?.type === 'modal_submit' ? (modalSubmitStep as any).content?.values : undefined
  const defaultStart = modalValues?.start ?? '2025-03-15'
  const defaultEnd = modalValues?.end ?? '2025-03-22'
  const onModalSubmit = isUserActionOpeningModal ? () => { goNext(); goNext() } : goNext

  const renderPane = (view: ViewportView, state: typeof slackbotState, title: string) => {
    const isActive = activeView === view
    const msgs = state.chatMessages
    const hasPaneChoices = msgs.length > 0 && !!msgs[msgs.length - 1].choices
    return (
      <ChatView
        key={view}
        viewType={view}
        title={title}
        messages={state.chatMessages}
        pendingUserMessage={isActive ? state.pendingUserMessage : undefined}
        showThinking={isActive ? state.showThinking : false}
        thinkingStatusText={state.thinkingStatusText}
        onSend={isActive ? goNext : undefined}
        onChoiceClick={isActive && hasPaneChoices ? handleChoiceClick : undefined}
      />
    )
  }

  const isSingle = viewport.mode === 'single'
  const singleView = isSingle ? viewport.view : null
  const leftView = !isSingle ? viewport.left : null
  const rightView = !isSingle ? viewport.right : null

  return (
    <div className="flex flex-col w-full h-screen" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex-1 relative min-h-0 overflow-hidden flex flex-row">
        {isSingle ? (
          <div className="flex-1 min-w-0 min-h-0 flex flex-col" style={{ width: '100%' }}>
            {singleView === 'slackbot' && renderPane('slackbot', slackbotState, 'Slackbot')}
            {singleView === 'channel' && renderPane('channel', channelState, channelName ?? '#channel')}
            {singleView === 'thread' && renderPane('thread', threadState, 'Thread')}
          </div>
        ) : (
          <>
            <div className="flex flex-col min-h-0 min-w-0" style={{ flex: '0 0 60%' }}>
              {leftView === 'channel' && renderPane('channel', channelState, channelName ?? '#channel')}
              {leftView === 'thread' && renderPane('thread', threadState, 'Thread')}
            </div>
            <div className="flex flex-col min-h-0 min-w-0" style={{ flex: '0 0 40%' }}>
              {rightView === 'slackbot' && renderPane('slackbot', slackbotState, 'Slackbot')}
              {rightView === 'thread' && renderPane('thread', threadState, 'Thread')}
            </div>
          </>
        )}
        {showOverlay && <ClickThroughOverlay onNext={goNext} onBack={goBack} enabled={overlayEnabled} />}
        {isModalOpenStep && (
          <DatePickerModal
            defaultStart={defaultStart}
            defaultEnd={defaultEnd}
            onSubmit={onModalSubmit}
          />
        )}
      </div>
      <DemoPersonaBar
        breadcrumb={
          <>
            <Link
              to="/"
              className="text-white/90 hover:text-white focus:outline-none focus:underline"
              style={{ color: 'rgba(204, 204, 204, 1)' }}
            >
              Demos
            </Link>
            <span className="text-white/60 mx-1.5">/</span>
            <Link
              to={`/demo/${story.id}`}
              className="text-white/90 hover:text-white focus:outline-none focus:underline"
              style={{ color: 'rgba(204, 204, 204, 1)' }}
            >
              {story.title}
            </Link>
            {(personaConfig || fullStoryMode) && (
              <>
                <span className="text-white/60 mx-1.5">/</span>
                <span className="text-white">{fullStoryMode ? 'Full story (step-by-step)' : personaConfig!.title}</span>
              </>
            )}
          </>
        }
        personas={barPersonas}
        selectedPersonaId={viewAsPersonaId}
        onPersonaChange={onPersonaChange ?? (() => {})}
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        demoStepId={currentStep?.id}
        onBack={goBack}
        onNext={goNext}
        overlayEnabled={overlayEnabled}
        onOverlayToggle={setOverlayEnabled}
        showOverlayToggle={showOverlay}
      />
    </div>
  )
}

export interface ChatMessagePayload {
  id: string
  author: string
  text?: string
  timestamp?: string
  isApp?: boolean
  choices?: string[]
  templateId?: string
  templateContent?: Record<string, unknown>
  /** Persona names for mention formatting (e.g. "Alex Kim" -> @Alex Kim) */
  personaNames?: string[]
  /** When true, render as "New" tagged divider (switch-back strip); not a real message */
  isNewDivider?: boolean
}

export type ChatViewType = 'slackbot' | 'channel' | 'thread'

function computeChatStateForView(
  steps: StoryStep[],
  upToIndex: number,
  view: ChatViewType,
  personas: StoryConfig['personas'],
  lastSelectedChoice: string | null
): {
  chatMessages: ChatMessagePayload[]
  pendingUserMessage: { text: string; author: string } | undefined
  showThinking: boolean
  thinkingStatusText?: string
} {
  const chatMessages: ChatMessagePayload[] = []
  let pendingUserMessage: { text: string; author: string } | undefined
  let showThinking = false
  let thinkingStatusText: string | undefined
  const appPersona = personas.find((p) => p.type === 'app')
  const slackbotName = appPersona?.name ?? 'Slackbot'

  let segment: 'dm' | 'channel' = 'dm'
  /** Last app_message in channel segment; used to attach choices for user_action in thread view */
  let lastChannelAppMessage: ChatMessagePayload | null = null
  /** Track if we've entered each segment before; used to show "New" divider only on switch-back */
  const segmentEnteredBefore: { dm: boolean; channel: boolean } = { dm: false, channel: false }

  for (let i = 0; i <= upToIndex; i++) {
    const step = steps[i]
    if (!step) continue

    if (step.type === 'surface') {
      const ctx = (step as any).context
      const newSegment: 'dm' | 'channel' = ctx?.surface === 'channel' ? 'channel' : 'dm'
      const isSwitchBack = segmentEnteredBefore[newSegment]
      const newDividerPayload: ChatMessagePayload = { id: `new-divider-${step.id}`, author: '', isNewDivider: true }
      if (isSwitchBack) {
        if (view === 'slackbot' && newSegment === 'dm') {
          chatMessages.push(newDividerPayload)
        }
        if ((view === 'channel' || view === 'thread') && newSegment === 'channel') {
          chatMessages.push(newDividerPayload)
        }
      }
      segmentEnteredBefore[newSegment] = true
      segment = newSegment
      continue
    }

    if (view === 'slackbot' && segment !== 'dm') continue
    if ((view === 'channel' || view === 'thread') && segment !== 'channel') continue

    if (step.type === 'user_message') {
      if (view !== 'slackbot') continue
      const content = (step as any).content
      const persona = personas.find((p) => p.id === content?.personaId) ?? personas[0]
      const author = persona?.name ?? 'User'
      const text = content?.text ?? ''
      const timestamp = '12:32 PM'
      if (i === upToIndex) {
        pendingUserMessage = { text, author }
      } else {
        chatMessages.push({ id: step.id, author, text, timestamp, isApp: false })
      }
      continue
    }

    if (step.type === 'app_message') {
      const msg = buildAppMessagePayload(step as any, steps, i, personas, lastSelectedChoice)
      lastChannelAppMessage = msg
      // Keep full channel history in both channel and thread views so earlier messages stay visible
      chatMessages.push(msg)
      continue
    }

    if (step.type === 'thread_reply') {
      const msg = buildThreadReplyPayload(step as any, steps, i, personas, lastSelectedChoice)
      if (view === 'channel' || view === 'thread') {
        chatMessages.push(msg)
      }
      continue
    }

    if (step.type === 'bot_typing') {
      if (view !== 'slackbot') continue
      if (i === upToIndex) {
        showThinking = true
        const content = (step as any).content
        if (content?.statusText) thinkingStatusText = content.statusText
      }
      continue
    }

    if (step.type === 'user_action' || step.type === 'modal_open' || step.type === 'modal_submit') {
      if (view === 'slackbot') {
        if (step.type === 'user_action') {
          const content = (step as any).content
          const choices = content?.choices
          if (choices?.length && chatMessages.length > 0) {
            const last = chatMessages[chatMessages.length - 1]
            if (last.isApp && !last.choices) last.choices = choices
          }
          const nextStepForAck = steps[i + 1]
          const opensDateModal = nextStepForAck?.type === 'modal_open' && (nextStepForAck as any).content?.view === 'date-picker'
          const nextIsAppMessage = nextStepForAck?.type === 'app_message'
          if (!opensDateModal && !nextIsAppMessage && i < upToIndex) {
            const choiceLabel = content?.choices?.[0]
            const acknowledgment = choiceLabel ? `Done! I've got your choice. One moment…` : "Got it! One moment…"
            chatMessages.push({
              id: `${step.id}-ack`,
              author: slackbotName,
              text: acknowledgment,
              timestamp: 'Just now',
              isApp: true,
              templateId: 'plain_text',
              templateContent: { text: acknowledgment, personaNames: personas.map((p) => p.name) },
              personaNames: personas.map((p) => p.name),
            })
          }
        } else if (step.type === 'modal_submit') {
          const nextStepAfterSubmit = steps[i + 1]
          if (nextStepAfterSubmit?.type === 'surface') {
            // no ack
          } else {
            const content = (step as any).content
            const values = content?.values ?? {}
            const start = values.start
            const end = values.end
            let acknowledgment: string
            if (start && end && /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
              acknowledgment = `Thanks! I've got ${formatShortDate(start)}–${formatShortDate(end)}. I'll send this to your manager for approval.`
            } else {
              acknowledgment = "Thanks, I've got that. I'll take it from here."
            }
            chatMessages.push({
              id: `${step.id}-ack`,
              author: slackbotName,
              text: acknowledgment,
              timestamp: 'Just now',
              isApp: true,
              templateId: 'plain_text',
              templateContent: { text: acknowledgment, personaNames: personas.map((p) => p.name) },
              personaNames: personas.map((p) => p.name),
            })
          }
        }
      }
      if (view === 'channel' || view === 'thread') {
        if (step.type === 'user_action') {
          const content = (step as any).content
          const choices = content?.choices
          if (view === 'channel' && choices?.length && chatMessages.length > 0) {
            const last = chatMessages[chatMessages.length - 1]
            if (last.isApp && !last.choices) last.choices = choices
          }
          if (view === 'thread' && choices?.length && lastChannelAppMessage && !lastChannelAppMessage.choices) {
            lastChannelAppMessage.choices = choices
          }
        }
      }
    }
  }

  return { chatMessages, pendingUserMessage, showThinking, thinkingStatusText }
}

function buildAppMessagePayload(
  step: { id: string; content: any },
  steps: StoryStep[],
  i: number,
  personas: StoryConfig['personas'],
  lastSelectedChoice: string | null
): ChatMessagePayload {
  const content = step.content
  const persona = personas.find((p) => p.id === content?.personaId) ?? personas.find((p) => p.type === 'app')
  const nextStep = steps[i + 1]
  const prevStep = steps[i - 1]
  const choices =
    content?.choices ??
    (nextStep?.type === 'user_action' ? (nextStep as any).content?.choices : undefined) ??
    (prevStep?.type === 'user_action' && (prevStep as any).content?.choices?.length ? (prevStep as any).content.choices : undefined)
  const followsChoiceStep = prevStep?.type === 'user_action' && (prevStep as any).content?.choices?.length
  const rawText = content?.text ?? ''
  const displayText = followsChoiceStep && rawText.includes('{{selectedChoice}}')
    ? rawText.replace(/\{\{selectedChoice\}\}/g, lastSelectedChoice ?? 'your selection')
    : rawText
  const templateContent: Record<string, unknown> = {
    text: displayText,
    choices: choices?.length ? choices : undefined,
    personaNames: personas.map((p) => p.name),
  }
  if (content?.caseTitle != null) templateContent.caseTitle = content.caseTitle
  if (content?.caseFields != null) templateContent.caseFields = content.caseFields
  if (content?.caseStatus != null) templateContent.caseStatus = content.caseStatus
  if (content?.caseNote != null) templateContent.caseNote = content.caseNote
  if (content?.caseAvatarUrl != null) templateContent.caseAvatarUrl = content.caseAvatarUrl
  return {
    id: step.id,
    author: persona?.name ?? 'Slackbot',
    text: displayText,
    timestamp: 'Just now',
    isApp: true,
    choices: choices?.length ? choices : undefined,
    templateId: content?.templateId,
    templateContent: Object.keys(templateContent).length ? templateContent : undefined,
    personaNames: personas.map((p) => p.name),
  }
}

function buildThreadReplyPayload(
  step: { id: string; content: any },
  steps: StoryStep[],
  i: number,
  personas: StoryConfig['personas'],
  lastSelectedChoice: string | null
): ChatMessagePayload {
  const content = step.content
  const nextStep = steps[i + 1]
  const prevStep = steps[i - 1]
  const persona = content?.actor === 'app'
    ? personas.find((p) => p.type === 'app') ?? personas.find((p) => p.id === content?.personaId)
    : personas.find((p) => p.id === content?.personaId)
  const rawText = content?.text ?? ''
  const followsChoiceStep = prevStep?.type === 'user_action' && (prevStep as any).content?.choices?.length
  const displayText =
    followsChoiceStep && rawText.includes('{{selectedChoice}}')
      ? rawText.replace(/\{\{selectedChoice\}\}/g, lastSelectedChoice ?? 'your selection')
      : rawText
  const choices =
    content?.choices ?? (nextStep?.type === 'user_action' ? (nextStep as any).content?.choices : undefined)
  const hasChoices = Array.isArray(choices) && choices.length > 0
  const templateId = content?.templateId ?? (hasChoices ? 'text_with_buttons' : undefined)
  const templateContent: Record<string, unknown> = {
    text: displayText,
    choices: hasChoices ? choices : undefined,
    personaNames: personas.map((p) => p.name),
  }
  return {
    id: step.id,
    author: persona?.name ?? 'Slackbot',
    text: displayText,
    timestamp: 'Just now',
    isApp: content?.actor === 'app',
    choices: hasChoices ? choices : undefined,
    templateId: templateId ?? undefined,
    templateContent: templateId ? templateContent : undefined,
    personaNames: personas.map((p) => p.name),
  }
}

/** Format YYYY-MM-DD as short date (e.g. "Mar 15") for acknowledgments. */
function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
  const month = months[d.getMonth()]
  const day = d.getDate()
  return `${month} ${day}`
}
