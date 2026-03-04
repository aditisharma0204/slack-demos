import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import type { StoryConfig, StoryStep, PersonaConfig, ViewportView } from '@/types'
import { getViewportForStep, getActiveViewForStep, getSurfaceAtStep } from '@/engine/viewport'
import { ClickThroughOverlay } from '@/components/demo/ClickThroughOverlay'
import { DemoPersonaBar } from '@/components/demo/DemoPersonaBar'
import { DatePickerModal } from '@/components/demo/DatePickerModal'
import { ChatView } from '@/components/chat/ChatView'

interface StoryEngineProps {
  story: StoryConfig
  /** When provided, filters steps by persona and applies overrides (persona-specific prototype) */
  personaConfig?: PersonaConfig
  /** Called when user switches persona in the bar (navigates to new persona's prototype) */
  onPersonaChange?: (personaId: string | null) => void
}

export function StoryEngine({ story, personaConfig, onPersonaChange }: StoryEngineProps) {
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
  const viewAsPersonaId = personaConfig?.personaId ?? null

  const stepIndex = currentStepIndex - 1 // 0-based index into steps

  // Auto-advance: bot_typing 1.5s; app_message 1.5s; surface 1.5s; modal_submit 600ms. Do NOT auto-advance from app_message when next step is user_action that opens the date modal—user must click "Choose dates".
  const currentStep = steps[stepIndex]
  const nextStep = steps[stepIndex + 1]
  const stepAfterNext = steps[stepIndex + 2]
  const nextOpensDateModal = nextStep?.type === 'user_action' && stepAfterNext?.type === 'modal_open' && (stepAfterNext as any).content?.view === 'date-picker'
  const isUserMessageStep = currentStep?.type === 'user_message'
  const isChoiceStep = currentStep?.type === 'user_action' && (currentStep as any).content?.choices?.length
  const isUserActionOpeningModal = currentStep?.type === 'user_action' && nextStep?.type === 'modal_open' && (nextStep as any).content?.view === 'date-picker'
  const isModalOpenStep = isUserActionOpeningModal || (currentStep?.type === 'modal_open' && (currentStep as any).content?.view === 'date-picker')
  const autoAdvanceDelayMs =
    currentStep?.type === 'bot_typing' ? 1500 :
    currentStep?.type === 'app_message' && !nextOpensDateModal ? 1500 :
    currentStep?.type === 'surface' ? 1500 :
    currentStep?.type === 'modal_submit' ? 600 :
    null

  useEffect(() => {
    if (isEditMode || isUserMessageStep || isModalOpenStep || autoAdvanceDelayMs == null) return
    // Block auto-advance on choice step only when next step is not modal_open (so we can advance to show the modal)
    if (isChoiceStep && nextStep?.type !== 'modal_open') return
    const t = setTimeout(goNext, autoAdvanceDelayMs)
    return () => clearTimeout(t)
  }, [stepIndex, isEditMode, isUserMessageStep, isChoiceStep, isModalOpenStep, nextStep?.type, autoAdvanceDelayMs, goNext])

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
  const showOverlay = !isEditMode && !isUserMessageStep && !hasChoices && !isModalOpenStep

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
            {personaConfig && (
              <>
                <span className="text-white/60 mx-1.5">/</span>
                <span className="text-white">{personaConfig.title}</span>
              </>
            )}
          </>
        }
        personas={userPersonas}
        selectedPersonaId={viewAsPersonaId}
        onPersonaChange={onPersonaChange ?? (() => {})}
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
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
  let threadParentMessage: ChatMessagePayload | null = null
  let threadReplies: ChatMessagePayload[] = []

  for (let i = 0; i <= upToIndex; i++) {
    const step = steps[i]
    if (!step) continue

    if (step.type === 'surface') {
      const ctx = (step as any).context
      segment = ctx?.surface === 'channel' ? 'channel' : 'dm'
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
      if (view === 'thread') {
        if (!threadParentMessage) {
          threadParentMessage = buildAppMessagePayload(step as any, steps, i, personas, lastSelectedChoice)
        }
        continue
      }
      const msg = buildAppMessagePayload(step as any, steps, i, personas, lastSelectedChoice)
      chatMessages.push(msg)
      continue
    }

    if (step.type === 'thread_reply') {
      if (view === 'channel') {
        const msg = buildThreadReplyPayload(step as any, personas)
        chatMessages.push(msg)
      } else if (view === 'thread') {
        const msg = buildThreadReplyPayload(step as any, personas)
        threadReplies.push(msg)
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
          if (view === 'thread' && choices?.length && threadReplies.length > 0) {
            const last = threadReplies[threadReplies.length - 1]
            if (last.isApp && !last.choices) last.choices = choices
          }
        }
      }
    }
  }

  if (view === 'thread' && (threadParentMessage || threadReplies.length > 0)) {
    chatMessages.length = 0
    if (threadParentMessage) chatMessages.push(threadParentMessage)
    chatMessages.push(...threadReplies)
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
  const choices = content?.choices ?? (nextStep?.type === 'user_action' ? (nextStep as any).content?.choices : undefined)
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

function buildThreadReplyPayload(step: { id: string; content: any }, personas: StoryConfig['personas']): ChatMessagePayload {
  const content = step.content
  const persona = content?.actor === 'app'
    ? personas.find((p) => p.type === 'app') ?? personas.find((p) => p.id === content?.personaId)
    : personas.find((p) => p.id === content?.personaId)
  const text = content?.text ?? ''
  return {
    id: step.id,
    author: persona?.name ?? 'Slackbot',
    text,
    timestamp: 'Just now',
    isApp: content?.actor === 'app',
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
