import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, Link, useLocation } from 'react-router-dom'
import { useSharedDemoMode } from '@/hooks/useSharedDemoMode'
import type { OAuthModalUsageItem, StoryConfig, StoryStep, PersonaConfig, StorySidebarApp, ViewportView } from '@/types'
import { resolvePersonaAvatarUrl } from '@/utils/personaAvatar'
import { getViewportForStep, getActiveViewForStep, getSurfaceAtStep } from '@/engine/viewport'
import { ClickThroughOverlay } from '@/components/demo/ClickThroughOverlay'
import { DemoPersonaBar } from '@/components/demo/DemoPersonaBar'
import { DatePickerModal } from '@/components/demo/DatePickerModal'
import { OAuthPermissionModal } from '@/components/demo/OAuthPermissionModal'
import { ChatView } from '@/components/chat/ChatView'
import { MissionControlTowerPanel } from '@/components/demo/MissionControlTowerPanel'
import homeIcon from '@/assets/icons/home.svg'
import homeIconFilled from '@/assets/icons/home-1.svg'
import directMessagesIcon from '@/assets/icons/direct-messages.svg'
import notificationsIcon from '@/assets/icons/notifications.svg'
import moreIcon from '@/assets/icons/more.svg'
import threadsIcon from '@/assets/icons/threads.svg'
import listViewIcon from '@/assets/icons/list-view.svg'
import composeIcon from '@/assets/icons/compose.svg'
import channelIcon from '@/assets/icons/channel.svg'
import aiAgentsIcon from '@/assets/icons/ai-agents.svg'
import channelSectionIcon from '@/assets/icons/channel-section.svg'
import appsIcon from '@/assets/icons/apps.svg'
import plusIcon from '@/assets/icons/plus.svg'
import sidebarIcon from '@/assets/icons/sidebar.svg'
import arrowLeftHeaderIcon from '@/assets/icons/arrow-left.svg'
import arrowRightHeaderIcon from '@/assets/icons/arrow-right.svg'
import clockIcon from '@/assets/icons/clock.svg'
import searchHeaderIcon from '@/assets/icons/search.svg'
import helpIcon from '@/assets/icons/help.svg'
import closeHeaderIcon from '@/assets/icons/close.svg'
import starFilledIcon from '@/assets/icons/star-1.svg'

/** Reserved id for "Full story (step-by-step)" showcase mode in the View as dropdown */
export const FULL_STORY_PERSONA_ID = 'full'
/** Slack header heart sprite: 768×128 PNG, 6 frames × 128px source → 20×20 each when scaled (CDN). */
const SLACKBOT_HEART_SPRITE_URL =
  'https://a.slack-edge.com/bv1-13-br/slackbot_heart_sprite-0c2245c.png'
const SLACKBOT_TYPING_MS_PER_CHAR = 10
const AUTO_ADVANCE_BASE_MS = 1000
const SLACKBOT_TYPING_BUFFER_MS = 120
const SLACKBOT_TO_USER_HANDOFF_MS = 1000

function resolveTimelineUserPersonaId(
  steps: StoryStep[],
  stepIndex: number,
  userPersonaIds: Set<string>,
  userPersonasById: Map<string, { id: string; name: string }>,
  fallbackPersonaId?: string
): string | undefined {
  let lastUserStepIndex = -1
  let lastUserPersonaId: string | undefined
  for (let i = stepIndex; i >= 0; i--) {
    const personaId = (steps[i] as any)?.content?.personaId
    if (personaId && userPersonaIds.has(personaId)) {
      lastUserStepIndex = i
      lastUserPersonaId = personaId
      break
    }
  }

  let lastSurfaceStepIndex = -1
  let lastSurfaceDmRecipientPersonaId: string | undefined
  for (let i = stepIndex; i >= 0; i--) {
    const step = steps[i] as any
    if (step?.type === 'surface') {
      lastSurfaceStepIndex = i
      const ctx = step?.context
      const explicitSurfacePersonaId = ctx?.personaId
      if (typeof explicitSurfacePersonaId === 'string' && userPersonaIds.has(explicitSurfacePersonaId)) {
        return explicitSurfacePersonaId
      }
      if (ctx?.surface === 'dm' && typeof ctx?.with === 'string') {
        const recipientName = ctx.with.trim().toLowerCase()
        for (const [, persona] of userPersonasById) {
          if (persona.name.trim().toLowerCase() === recipientName) {
            lastSurfaceDmRecipientPersonaId = persona.id
            break
          }
        }
      }
      break
    }
  }

  // After a surface switch, infer the next user actor in that segment so
  // transition steps (e.g., switch + first app message) show the right "you".
  if (lastSurfaceStepIndex > lastUserStepIndex) {
    if (lastSurfaceDmRecipientPersonaId) return lastSurfaceDmRecipientPersonaId
    for (let i = stepIndex + 1; i < steps.length; i++) {
      const step = steps[i]
      if (!step) continue
      if (step.type === 'surface') break
      const personaId = (step as any)?.content?.personaId
      if (personaId && userPersonaIds.has(personaId)) return personaId
    }
  }

  return lastUserPersonaId ?? fallbackPersonaId
}

function parseOauthUsageItems(raw: unknown): OAuthModalUsageItem[] | undefined {
  if (!Array.isArray(raw) || raw.length !== 3) return undefined
  const out: OAuthModalUsageItem[] = []
  for (const x of raw) {
    if (x && typeof x === 'object' && typeof (x as { text?: unknown }).text === 'string') {
      out.push({ text: (x as { text: string }).text })
    } else {
      return undefined
    }
  }
  return out
}

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
  const { search } = useLocation()
  const isSharedDemo = useSharedDemoMode()
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
      // Resolve the user_action step for this choice (supports branching by label),
      // then immediately advance one more step so action clicks feel instant.
      const choiceStepIndex = steps.findIndex(
        (s, idx) => idx > stepIndex0 && s.type === 'user_action' && (s as any).content?.choices?.includes(choice)
      )
      if (choiceStepIndex >= 0) return Math.min(choiceStepIndex + 2, totalSteps)
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
  const nextOpensOAuthModal =
    nextStep?.type === 'user_action' &&
    stepAfterNext?.type === 'modal_open' &&
    (stepAfterNext as any).content?.view === 'oauth-permission'
  const nextIsUserActionWithChoices = nextStep?.type === 'user_action' && (nextStep as any).content?.choices?.length
  const nextIsUserMessage = nextStep?.type === 'user_message'
  const nextIsSlackbotReply = nextStep?.type === 'app_message' || nextStep?.type === 'thread_reply'
  const nextIsPersonaChange = nextStep?.type === 'surface'
  const isUserMessageStep = currentStep?.type === 'user_message'
  const isChoiceStep = currentStep?.type === 'user_action' && (currentStep as any).content?.choices?.length
  const isAwaitExternalStep = currentStep?.type === 'user_action' && Boolean((currentStep as any).content?.awaitExternal)
  const isUserActionOpeningModal = currentStep?.type === 'user_action' && nextStep?.type === 'modal_open' && (nextStep as any).content?.view === 'date-picker'
  const isUserActionOpeningOAuthModal =
    currentStep?.type === 'user_action' &&
    nextStep?.type === 'modal_open' &&
    (nextStep as any).content?.view === 'oauth-permission'
  const isDatePickerModalView =
    isUserActionOpeningModal ||
    (currentStep?.type === 'modal_open' && (currentStep as any).content?.view === 'date-picker')
  const isOAuthPermissionModalView =
    isUserActionOpeningOAuthModal ||
    (currentStep?.type === 'modal_open' && (currentStep as any).content?.view === 'oauth-permission')
  const isModalOpenStep = isDatePickerModalView || isOAuthPermissionModalView
  const currentStepTextLength =
    currentStep?.type === 'app_message' || currentStep?.type === 'thread_reply'
      ? ((currentStep as any).content?.text ?? '').length
      : 0
  const slackbotReplyDelayMs =
    Math.max(
      AUTO_ADVANCE_BASE_MS,
      currentStepTextLength * SLACKBOT_TYPING_MS_PER_CHAR + SLACKBOT_TYPING_BUFFER_MS
    ) + (nextIsUserMessage ? SLACKBOT_TO_USER_HANDOFF_MS : 0)
  const autoAdvanceDelayMs =
    nextIsPersonaChange ? null :
    currentStep?.type === 'bot_typing' ? AUTO_ADVANCE_BASE_MS :
    currentStep?.type === 'user_action' && nextIsSlackbotReply && !nextOpensDateModal && !isAwaitExternalStep ? AUTO_ADVANCE_BASE_MS :
    currentStep?.type === 'app_message' && !nextOpensDateModal && !nextOpensOAuthModal && !nextIsUserActionWithChoices ? slackbotReplyDelayMs :
    currentStep?.type === 'thread_reply' && !nextIsUserActionWithChoices ? slackbotReplyDelayMs :
    currentStep?.type === 'surface' ? AUTO_ADVANCE_BASE_MS :
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
  const appPersona = story.personas.find((persona) => persona.type === 'app')
  const railAvatarSrc = useMemo(() => {
    const userPersonasById = new Map(
      story.personas.filter((p) => p.type === 'user').map((p) => [p.id, p] as const)
    )

    // Persona-specific demos always pin to the selected persona.
    if (personaConfig?.personaId) {
      const selectedPersona = userPersonasById.get(personaConfig.personaId)
      const selectedAvatar = resolvePersonaAvatarUrl(selectedPersona)
      if (selectedAvatar) return selectedAvatar
    }

    // In full-story mode, follow the active user persona in the timeline,
    // including upcoming handoffs right after surface switches.
    const resolvedPersonaId = resolveTimelineUserPersonaId(
      steps,
      stepIndex,
      new Set(userPersonas.map((p) => p.id)),
      new Map(userPersonas.map((p) => [p.id, { id: p.id, name: p.name }] as const)),
      userPersonas[0]?.id
    )
    const resolvedPersona = resolvedPersonaId ? userPersonasById.get(resolvedPersonaId) : undefined
    const resolvedAvatar = resolvePersonaAvatarUrl(resolvedPersona)
    if (resolvedAvatar) return resolvedAvatar

    // Fallback to first user persona when no timeline actor exists yet.
    return resolvePersonaAvatarUrl(userPersonas[0]) ?? '/assets/default-avatar.svg'
  }, [story.personas, personaConfig?.personaId, stepIndex, steps, userPersonas])
  const activeTimelinePersonaId = useMemo(() => {
    // Persona-specific demos always treat the selected persona as "you".
    if (personaConfig?.personaId) return personaConfig.personaId

    const userPersonaIds = new Set(userPersonas.map((p) => p.id))
    return resolveTimelineUserPersonaId(
      steps,
      stepIndex,
      userPersonaIds,
      new Map(userPersonas.map((p) => [p.id, { id: p.id, name: p.name }] as const)),
      userPersonas[0]?.id
    )
  }, [personaConfig?.personaId, stepIndex, steps, userPersonas])
  const isEmployeeAgentStory =
    story.id === 'ai-platform-readiness-by-pritesh-chavan'
    || story.id === 'employee-relocation-resolution-by-pritesh-chavan'
    || story.id === 'regional-payroll-sync-resolution-by-pritesh-chavan'
  const appName = isEmployeeAgentStory ? 'Employee Agent' : (appPersona?.name ?? 'Slackbot')
  const appAvatarUrl = isEmployeeAgentStory
    ? '/assets/hr-service-agent-avatar.png'
    : (appPersona?.avatar?.trim() || '/assets/slackbot-icon.png')

  const slackbotState = computeChatStateForView(steps, stepIndex, 'slackbot', story.personas, lastSelectedChoice, appName)
  const channelState = computeChatStateForView(steps, stepIndex, 'channel', story.personas, lastSelectedChoice, appName)
  const threadState = computeChatStateForView(steps, stepIndex, 'thread', story.personas, lastSelectedChoice, appName)

  const activeState =
    activeView === 'slackbot' ? slackbotState
    : activeView === 'channel' ? channelState
    : threadState
  const hasChoices = activeState.chatMessages.length > 0 && !!activeState.chatMessages[activeState.chatMessages.length - 1].choices
  // Hide overlay when step will auto-advance so user sees the reply then advance without clicking
  const showOverlay = !isEditMode && !isUserMessageStep && !hasChoices && !isModalOpenStep && autoAdvanceDelayMs == null

  // Default dates for date-picker modal (from modal_submit step; when opened from user_action, that step is 2 ahead)
  const modalSubmitStep =
    isUserActionOpeningModal || isUserActionOpeningOAuthModal ? steps[stepIndex + 2] : steps[stepIndex + 1]
  const modalValues = modalSubmitStep?.type === 'modal_submit' ? (modalSubmitStep as any).content?.values : undefined
  const defaultStart = modalValues?.start ?? '2025-03-15'
  const defaultEnd = modalValues?.end ?? '2025-03-22'
  const onModalSubmit =
    isUserActionOpeningModal || isUserActionOpeningOAuthModal ? () => { goNext(); goNext() } : goNext

  const oauthModalContent = (() => {
    if (isUserActionOpeningOAuthModal && nextStep?.type === 'modal_open') {
      return (nextStep as { content?: Record<string, unknown> }).content
    }
    if (currentStep?.type === 'modal_open' && (currentStep as any).content?.view === 'oauth-permission') {
      return (currentStep as { content?: Record<string, unknown> }).content
    }
    return undefined
  })()

  const renderPane = (view: ViewportView, state: typeof slackbotState, title: string) => {
    const isActive = activeView === view
    const msgs = state.chatMessages
    const hasPaneChoices = msgs.length > 0 && !!msgs[msgs.length - 1].choices
    return (
      <ChatView
        key={view}
        viewType={view}
        title={title}
        appName={appName}
        appAvatarUrl={appAvatarUrl}
        messages={state.chatMessages}
        pendingUserMessage={isActive ? state.pendingUserMessage : undefined}
        showThinking={isActive ? state.showThinking : false}
        thinkingStatusText={state.thinkingStatusText}
        onSend={isActive ? goNext : undefined}
        onChoiceClick={isActive && hasPaneChoices && !isModalOpenStep ? handleChoiceClick : undefined}
      />
    )
  }

  const isSingle = viewport.mode === 'single'
  const singleView = isSingle ? viewport.view : null
  const leftView = !isSingle ? viewport.left : null
  const rightView = !isSingle ? viewport.right : null
  const missionControlSplit = !isSingle && viewport.mode === 'dual' && viewport.left === 'mission_control'
  /** Used for channel row highlight in the sidebar (ignore mission_control left pane). */
  const primarySidebarView: ViewportView = isSingle
    ? (singleView as ViewportView)
    : leftView === 'channel' || leftView === 'thread'
      ? (leftView as ViewportView)
      : 'slackbot'
  const agentsRowSelected = !missionControlSplit && isSingle && singleView === 'slackbot'
  const normalizeChannelName = (name: string) => name.replace(/^#/, '').trim().toLowerCase()
  const activeChannelLabel = channelName ? channelName.replace(/^#/, '').trim() : undefined
  const activeChannelKey = activeChannelLabel ? normalizeChannelName(activeChannelLabel) : undefined
  const slackRailNavItems = [
    { id: 'home', label: 'Home', iconSrc: homeIcon, activeIconSrc: homeIconFilled, active: true, badge: undefined, dot: true },
    { id: 'dms', label: 'DMs', iconSrc: directMessagesIcon, active: false, badge: '1', dot: false },
    { id: 'activity', label: 'Activity', iconSrc: notificationsIcon, active: false, badge: '1', dot: false },
    { id: 'agents', label: 'Agents', iconSrc: aiAgentsIcon, active: false, badge: undefined, dot: false },
    { id: 'more', label: 'More', iconSrc: moreIcon, active: false, badge: undefined, dot: false },
  ]
  const slackSidebarShortcuts = [
    { label: 'Unreads', iconSrc: listViewIcon },
    { label: 'Threads', iconSrc: threadsIcon },
    { label: 'Drafts', iconSrc: composeIcon },
  ]
  const baseSidebarChannels = ['general', 'random']
  const personaSidebarChannels = (personaConfig?.overrides?.channels ?? []).map((name) => name.replace(/^#/, '').trim())
  const slackSidebarChannels = Array.from(
    new Set(
      [...baseSidebarChannels, ...personaSidebarChannels, ...(activeChannelLabel ? [activeChannelLabel] : [])]
        .filter(Boolean)
    )
  )
  const slackSidebarDirectMessages = userPersonas.map((persona) => ({
    name: persona.id === activeTimelinePersonaId ? `${persona.name} (You)` : persona.name,
    avatarSrc: resolvePersonaAvatarUrl(persona) ?? railAvatarSrc,
    status: 'online' as const,
  }))
  const slackSidebarApps: { id: string; label: string; badge?: string; avatarSrc: string }[] = (
    story.sidebarApps ?? []
  ).map((app: StorySidebarApp) => ({
    id: app.id,
    label: app.label,
    badge: undefined,
    avatarSrc: app.avatarUrl?.trim() || appAvatarUrl,
  }))

  return (
    <div className="flex flex-col w-full h-screen" style={{ backgroundColor: 'var(--color-gray-900)' }}>
      <DemoPersonaBar
        breadcrumb={
          <>
            {!isSharedDemo && (
              <>
                <Link
                  to="/"
                  className="text-white/90 hover:text-white focus:outline-none focus:underline"
                  style={{ color: 'rgba(204, 204, 204, 1)' }}
                >
                  Demos
                </Link>
                <span className="text-white/60 mx-1.5">/</span>
              </>
            )}
            <Link
              to={{ pathname: `/demo/${story.id}`, search }}
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
      <div className="story-slack-chrome flex flex-col flex-1 min-h-0 min-w-0 w-full overflow-hidden rounded-[16px]">
      {/* Slack Desktop Header Bar — title bar + body stack inside rounded chrome */}
      <div className="story-slack-desktop-header" role="toolbar" aria-label="Slack navigation toolbar">
        {/* Left: window controls + sidebar toggle */}
        <div className="story-slack-desktop-header__left">
          <div className="story-slack-desktop-header__window-controls" aria-hidden>
            <span className="story-slack-desktop-header__dot story-slack-desktop-header__dot--close" />
            <span className="story-slack-desktop-header__dot story-slack-desktop-header__dot--minimize" />
            <span className="story-slack-desktop-header__dot story-slack-desktop-header__dot--maximize" />
          </div>
          <button className="story-slack-desktop-header__nav-btn" type="button" aria-label="Toggle sidebar" tabIndex={-1}>
            <img src={sidebarIcon} alt="" className="story-slack-desktop-header__icon" />
          </button>
        </div>
        {/* Center: back/forward/history + search + avatar — grouped */}
        <div className="story-slack-desktop-header__center">
          <button className="story-slack-desktop-header__nav-btn" type="button" aria-label="Back" tabIndex={-1}>
            <img src={arrowLeftHeaderIcon} alt="" className="story-slack-desktop-header__icon" />
          </button>
          <button className="story-slack-desktop-header__nav-btn" type="button" aria-label="Forward" tabIndex={-1}>
            <img src={arrowRightHeaderIcon} alt="" className="story-slack-desktop-header__icon" />
          </button>
          <button className="story-slack-desktop-header__nav-btn" type="button" aria-label="History" tabIndex={-1}>
            <img src={clockIcon} alt="" className="story-slack-desktop-header__icon" />
          </button>
          <div className="story-slack-desktop-header__search">
            <img src={searchHeaderIcon} alt="" className="story-slack-desktop-header__search-icon" />
            <span className="story-slack-desktop-header__search-text">Search Acme Inc</span>
            <button className="story-slack-desktop-header__search-clear" type="button" aria-label="Clear search" tabIndex={-1}>
              <img src={closeHeaderIcon} alt="" className="story-slack-desktop-header__search-clear-icon" />
            </button>
          </div>
          <div className="story-slack-desktop-header__slackbot" aria-hidden>
            <div className="story-slack-desktop-header__slackbot-inner">
              <img src={SLACKBOT_HEART_SPRITE_URL} alt="" className="story-slack-desktop-header__slackbot-sprite" />
            </div>
          </div>
        </div>
        {/* Right: Give Feedback + help */}
        <div className="story-slack-desktop-header__right">
          <div className="story-slack-desktop-header__feedback" aria-hidden>
            <img src={starFilledIcon} alt="" className="story-slack-desktop-header__feedback-star" />
            <span>Give Feedback</span>
          </div>
          <button className="story-slack-desktop-header__nav-btn" type="button" aria-label="Help" tabIndex={-1}>
            <img src={helpIcon} alt="" className="story-slack-desktop-header__icon" />
          </button>
        </div>
      </div>
        <div
          className="flex-1 relative min-h-0 w-full overflow-hidden flex flex-row gap-0 mt-0 mb-0 pt-0 pr-2 pb-2 pl-0 min-w-0"
          style={{ backgroundColor: 'var(--slack-footer-bg)', border: 'none', width: '100%' }}
        >
        <div className="p-tab_rail__tab_container__context_target" aria-hidden>
          <aside className="story-slack-rail" aria-label="Slack workspace rail">
            <div className="story-slack-rail__workspace-logo" aria-hidden>
              <img src="/workspace-logo.png" alt="" className="story-slack-rail__workspace-logo-img" />
            </div>
            <nav className="story-slack-rail__nav" aria-label="Slack global navigation">
              {slackRailNavItems.map((item) => (
                <div
                  key={item.label}
                  className={`story-slack-rail__item story-slack-rail__item--${item.id} ${item.active ? 'story-slack-rail__item--active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={item.label}
                >
                  {item.dot && <span className="story-slack-rail__item-dot" aria-hidden />}
                  <span className="story-slack-rail__item-icon" aria-hidden>
                    <img src={item.active && item.activeIconSrc ? item.activeIconSrc : item.iconSrc} className={`story-slack-icon-img story-slack-icon-img--${item.id}`} alt="" />
                  </span>
                  <span className="story-slack-rail__item-label">{item.label}</span>
                  {item.badge && <span className="story-slack-rail__item-badge">{item.badge}</span>}
                </div>
              ))}
            </nav>
            <div className="story-slack-rail__bottom">
              <div className="story-slack-rail__circle-btn" aria-label="Add workspace" role="button" tabIndex={0}>
                <img src={plusIcon} className="story-slack-icon-img" alt="" />
              </div>
              <div className="story-slack-rail__avatar" aria-label="Current user avatar" role="img">
                <img src={railAvatarSrc} alt="" className="story-slack-rail__avatar-img" />
                <span className="story-slack-rail__avatar-status" aria-hidden />
              </div>
            </div>
          </aside>
        </div>
        <div className="story-slack-main-shell flex-1 min-w-0 min-h-0 flex flex-row gap-0">
          <aside className="story-slack-sidebar" aria-label="Slack channel sidebar">
            <div
              role="toolbar"
              aria-orientation="horizontal"
              aria-label="Actions"
              className="p-ia4_sidebar_header p-ia4_home_header p-ia4_home_header--with_upgrade p-ia4_home_header--with_divider p-ia4_sidebar_header--withControls p-ia4_sidebar_header--at_scroll_top p-channel_sidebar--visual-updates-m1"
            >
              <div className="p-ia4_sidebar_header__title">
                <div className="p-ia4_sidebar_header__title--inner">
                  <button className="c-button-unstyled p-ia4_home_header_menu__button" type="button">
                    Salesforce
                    <span className="story-slack-sidebar__toolbar-icon story-slack-sidebar__toolbar-icon--caret" aria-hidden>
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
              <div className="story-slack-sidebar__toolbar-actions" aria-label="Header actions">
                <button className="story-slack-sidebar__icon-button story-slack-sidebar__icon-button--settings" type="button" aria-label="Preferences" />
                <button className="story-slack-sidebar__icon-button story-slack-sidebar__icon-button--compose" type="button" aria-label="Compose" />
              </div>
            </div>
            <div className="story-slack-sidebar__body">
              <div className="story-slack-sidebar__section">
                {slackSidebarShortcuts.map((item) => (
                  <div key={item.label} className="story-slack-sidebar__item story-slack-sidebar__item--row">
                    <span className="story-slack-sidebar__leading-icon" aria-hidden>
                      <img src={item.iconSrc} className="story-slack-icon-img story-slack-icon-img--sidebar" alt="" />
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
                <div className="story-slack-sidebar__divider" role="separator" aria-hidden />
              </div>
              <div className="story-slack-sidebar__section">
                <div className="story-slack-sidebar__item story-slack-sidebar__item--section-label story-slack-sidebar__item--row">
                  <span className="story-slack-sidebar__caret" aria-hidden>
                    <img src={channelSectionIcon} className="story-slack-icon-img story-slack-icon-img--sidebar-caret" alt="" />
                  </span>
                  <span>Channels</span>
                </div>
                {slackSidebarChannels.map((item) => {
                  const isSelectedChannel =
                    (primarySidebarView === 'channel' || primarySidebarView === 'thread') &&
                    !!activeChannelKey &&
                    normalizeChannelName(item) === activeChannelKey
                  return (
                  <div
                    key={item}
                    className={`story-slack-sidebar__item story-slack-sidebar__item--row story-slack-sidebar__item--indented ${isSelectedChannel ? 'story-slack-sidebar__item--selected' : ''}`}
                  >
                    <span className="story-slack-sidebar__leading-icon" aria-hidden>
                      <img src={channelIcon} className="story-slack-icon-img story-slack-icon-img--sidebar" alt="" />
                    </span>
                    <span>{item}</span>
                  </div>
                )})}
              </div>
              <div className="story-slack-sidebar__section">
                <div className="story-slack-sidebar__item story-slack-sidebar__item--section-label story-slack-sidebar__item--row">
                  <span className="story-slack-sidebar__caret" aria-hidden>
                    <img src={directMessagesIcon} className="story-slack-icon-img story-slack-icon-img--sidebar-caret" alt="" />
                  </span>
                  <span>Direct messages</span>
                </div>
                {slackSidebarDirectMessages.map((item) => (
                  <div key={item.name} className="story-slack-sidebar__item story-slack-sidebar__item--row story-slack-sidebar__item--indented story-slack-sidebar__item--app">
                    <img src={item.avatarSrc} alt="" className="story-slack-sidebar__dm-avatar-photo" aria-hidden />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="story-slack-sidebar__section">
                <div className="story-slack-sidebar__item story-slack-sidebar__item--section-label story-slack-sidebar__item--row">
                  <span className="story-slack-sidebar__caret" aria-hidden>
                    <img src={appsIcon} className="story-slack-icon-img story-slack-icon-img--sidebar-caret" alt="" />
                  </span>
                  <span>Apps</span>
                </div>
                {slackSidebarApps.map((item) => {
                  const appRowSelected = missionControlSplit
                  return (
                    <div
                      key={item.id}
                      className={`story-slack-sidebar__item story-slack-sidebar__item--app story-slack-sidebar__item--row story-slack-sidebar__item--indented ${appRowSelected ? 'story-slack-sidebar__item--selected' : ''}`}
                    >
                      <img src={item.avatarSrc} alt="" className="story-slack-sidebar__dm-avatar-image" aria-hidden />
                      <span>{item.label}</span>
                      {item.badge ? <span className="story-slack-sidebar__badge">{item.badge}</span> : null}
                    </div>
                  )
                })}
                <div className="story-slack-sidebar__item story-slack-sidebar__item--section-label story-slack-sidebar__item--row">
                  <span className="story-slack-sidebar__caret" aria-hidden>
                    <img src={aiAgentsIcon} className="story-slack-icon-img story-slack-icon-img--sidebar-caret" alt="" />
                  </span>
                  <span>Agents</span>
                </div>
                <div className={`story-slack-sidebar__item story-slack-sidebar__item--app story-slack-sidebar__item--emphasis story-slack-sidebar__item--row story-slack-sidebar__item--indented ${agentsRowSelected ? 'story-slack-sidebar__item--selected' : ''}`}>
                  <img src={appAvatarUrl} alt={appName} className="story-slack-sidebar__dm-avatar-image" />
                  <span>{appName}</span>
                </div>
              </div>
            </div>
          </aside>
          <div className="flex-1 min-w-0 min-h-0 flex flex-row gap-[6px]">
          {isSingle ? (
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden" style={{ width: '100%' }}>
              {singleView === 'slackbot' && renderPane('slackbot', slackbotState, appName)}
              {singleView === 'channel' && renderPane('channel', channelState, channelName ?? '#channel')}
              {singleView === 'thread' && renderPane('thread', threadState, 'Thread')}
            </div>
          ) : (
            <>
              <div
                className="flex flex-col min-h-0 min-w-0 overflow-hidden rounded-2xl box-border"
                style={{ flex: '0 0 60%', border: '1px solid var(--slack-border)' }}
              >
                {leftView === 'channel' && renderPane('channel', channelState, channelName ?? '#channel')}
                {leftView === 'thread' && renderPane('thread', threadState, 'Thread')}
                {leftView === 'mission_control' && (
                  <div className="flex flex-col min-h-0 min-w-0 h-full overflow-hidden bg-white rounded-2xl">
                    <MissionControlTowerPanel
                      onInvestigate={() => handleChoiceClick('Stop traffic')}
                      currentStepId={currentStep?.id}
                    />
                  </div>
                )}
              </div>
              <div
                className="flex flex-col min-h-0 min-w-0 overflow-hidden rounded-2xl box-border"
                style={{ flex: '0 0 40%' }}
              >
                {rightView === 'slackbot' && renderPane('slackbot', slackbotState, appName)}
                {rightView === 'thread' && renderPane('thread', threadState, 'Thread')}
              </div>
            </>
          )}
          </div>
        </div>
        {showOverlay && <ClickThroughOverlay onNext={goNext} onBack={goBack} enabled={overlayEnabled} />}
        {isDatePickerModalView && (
          <DatePickerModal
            defaultStart={defaultStart}
            defaultEnd={defaultEnd}
            onSubmit={onModalSubmit}
          />
        )}
        {isOAuthPermissionModalView && (
          <OAuthPermissionModal
            appName={(oauthModalContent?.oauthAppName as string) || undefined}
            integrationName={(oauthModalContent?.oauthIntegrationName as string) || undefined}
            modalTitle={(oauthModalContent?.oauthModalTitle as string) || undefined}
            accountSectionLabel={(oauthModalContent?.oauthAccountSectionLabel as string) || undefined}
            userDisplayName={(oauthModalContent?.oauthUserDisplayName as string) || undefined}
            userEmail={(oauthModalContent?.oauthUserEmail as string) || undefined}
            workspaceUrl={(oauthModalContent?.oauthWorkspaceUrl as string) || undefined}
            accountBadge={(oauthModalContent?.oauthAccountBadge as string) || undefined}
            integrationInitial={(oauthModalContent?.oauthIntegrationInitial as string) || undefined}
            integrationLogoBg={(oauthModalContent?.oauthIntegrationLogoBg as string) || undefined}
            integrationLogoUrl={(oauthModalContent?.oauthIntegrationLogoUrl as string) || undefined}
            usageHeading={(oauthModalContent?.oauthUsageHeading as string) || undefined}
            usageItems={parseOauthUsageItems(oauthModalContent?.oauthUsageItems)}
            legalNotice={(oauthModalContent?.oauthLegalNotice as string) || undefined}
            allowButtonLabel={(oauthModalContent?.oauthAllowButtonLabel as string) || undefined}
            onAllow={onModalSubmit}
            onCancel={goBack}
          />
        )}
      </div>
      </div>
    </div>
  )
}

export interface ChatMessagePayload {
  id: string
  author: string
  text?: string
  timestamp?: string
  isApp?: boolean
  /** User message avatar; from persona.avatar or stable defaults — same persona id = same photo */
  avatarUrl?: string
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
  lastSelectedChoice: string | null,
  appDisplayName: string
): {
  chatMessages: ChatMessagePayload[]
  pendingUserMessage: { text: string; author: string; avatarUrl?: string } | undefined
  showThinking: boolean
  thinkingStatusText?: string
} {
  const chatMessages: ChatMessagePayload[] = []
  let pendingUserMessage: { text: string; author: string; avatarUrl?: string } | undefined
  let showThinking = false
  let thinkingStatusText: string | undefined
  const appPersona = personas.find((p) => p.type === 'app')
  const slackbotName = appPersona?.name ?? appDisplayName

  let segment: 'dm' | 'channel' = 'dm'
  /** Last app_message in channel segment; used to attach choices for user_action in thread view */
  let lastChannelAppMessage: ChatMessagePayload | null = null
  /** Track if we've entered each segment before; used to show "New" divider only on switch-back */
  const segmentEnteredBefore: { dm: boolean; channel: boolean } = { dm: false, channel: false }
  /** After a switch-back divider, suppress an immediate duplicate replay of the last message. */
  let dedupeFirstMessageAfterSwitchBack = false

  for (let i = 0; i <= upToIndex; i++) {
    const step = steps[i]
    if (!step) continue

    if (step.type === 'surface') {
      const ctx = (step as any).context
      const newSegment: 'dm' | 'channel' = ctx?.surface === 'channel' ? 'channel' : 'dm'
      const shouldResetConversation = Boolean(ctx?.resetConversation)
      const isSwitchBack = segmentEnteredBefore[newSegment]
      const newDividerPayload: ChatMessagePayload = { id: `new-divider-${step.id}`, author: '', isNewDivider: true }
      if (shouldResetConversation) {
        chatMessages.length = 0
        if (newSegment === 'channel') {
          lastChannelAppMessage = null
        }
      }
      if (isSwitchBack) {
        if (view === 'slackbot' && newSegment === 'dm') {
          chatMessages.push(newDividerPayload)
          dedupeFirstMessageAfterSwitchBack = true
        }
        if ((view === 'channel' || view === 'thread') && newSegment === 'channel') {
          chatMessages.push(newDividerPayload)
          dedupeFirstMessageAfterSwitchBack = true
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
        pendingUserMessage = { text, author, avatarUrl: resolvePersonaAvatarUrl(persona) }
      } else {
        chatMessages.push({
          id: step.id,
          author,
          text,
          timestamp,
          isApp: false,
          avatarUrl: resolvePersonaAvatarUrl(persona),
        })
      }
      continue
    }

    if (step.type === 'app_message') {
      const msg = buildAppMessagePayload(step as any, steps, i, personas, lastSelectedChoice, upToIndex)
      lastChannelAppMessage = msg
      if (dedupeFirstMessageAfterSwitchBack) {
        const lastNonDivider = [...chatMessages].reverse().find((m) => !m.isNewDivider)
        const isImmediateDuplicate =
          !!lastNonDivider &&
          lastNonDivider.author === msg.author &&
          (lastNonDivider.text ?? '') === (msg.text ?? '') &&
          (lastNonDivider.templateId ?? '') === (msg.templateId ?? '')
        dedupeFirstMessageAfterSwitchBack = false
        if (isImmediateDuplicate) continue
      }
      // Keep full channel history in both channel and thread views so earlier messages stay visible
      chatMessages.push(msg)
      continue
    }

    if (step.type === 'thread_reply') {
      const msg = buildThreadReplyPayload(step as any, steps, i, personas, lastSelectedChoice)
      if (dedupeFirstMessageAfterSwitchBack) {
        const lastNonDivider = [...chatMessages].reverse().find((m) => !m.isNewDivider)
        const isImmediateDuplicate =
          !!lastNonDivider &&
          lastNonDivider.author === msg.author &&
          (lastNonDivider.text ?? '') === (msg.text ?? '') &&
          (lastNonDivider.templateId ?? '') === (msg.templateId ?? '')
        dedupeFirstMessageAfterSwitchBack = false
        if (isImmediateDuplicate) continue
      }
      if (view === 'channel' || view === 'thread') {
        chatMessages.push(msg)
      }
      continue
    }

    if (step.type === 'bot_typing') {
      if (view !== 'slackbot') continue
      if (dedupeFirstMessageAfterSwitchBack) dedupeFirstMessageAfterSwitchBack = false
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
          if (choices?.length && chatMessages.length > 0 && !content?.awaitExternal) {
            const last = chatMessages[chatMessages.length - 1]
            if (last.isApp && !last.choices) last.choices = choices
          }
          const nextStepForAck = steps[i + 1]
          const opensDateModal = nextStepForAck?.type === 'modal_open' && (nextStepForAck as any).content?.view === 'date-picker'
          const opensOAuthModal = nextStepForAck?.type === 'modal_open' && (nextStepForAck as any).content?.view === 'oauth-permission'
          const nextIsAppMessage = nextStepForAck?.type === 'app_message'
          const nextIsBotTyping = nextStepForAck?.type === 'bot_typing'
          const suppressAck = Boolean(content?.suppressAcknowledgment)
          if (
            !opensDateModal &&
            !opensOAuthModal &&
            !nextIsAppMessage &&
            !nextIsBotTyping &&
            !suppressAck &&
            i < upToIndex
          ) {
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
            const suppressAck = Boolean(content?.suppressAcknowledgment)
            const prevOpen = steps[i - 1]
            const prevWasOAuthModal =
              prevOpen?.type === 'modal_open' && (prevOpen as any).content?.view === 'oauth-permission'
            const nextIsBotContent =
              nextStepAfterSubmit?.type === 'bot_typing' ||
              nextStepAfterSubmit?.type === 'app_message' ||
              nextStepAfterSubmit?.type === 'thread_reply'

            if (start && end && /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
              const acknowledgment = `Thanks! I've got ${formatShortDate(start)}–${formatShortDate(end)}. I'll send this to your manager for approval.`
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
            } else if (!nextIsBotContent && !suppressAck && !prevWasOAuthModal) {
              const acknowledgment = "Thanks, I've got that. I'll take it from here."
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
  lastSelectedChoice: string | null,
  upToIndex: number
): ChatMessagePayload {
  const content = step.content
  const persona = personas.find((p) => p.id === content?.personaId) ?? personas.find((p) => p.type === 'app')
  const nextStep = steps[i + 1]
  const prevStep = steps[i - 1]
  // Only show choices on this message if: (1) explicit on content, or (2) next step is user_action (buttons for that action).
  // Never inherit from prev step—that would re-show buttons on the reply after the user already clicked.
  let choices =
    content?.choices ??
    (nextStep?.type === 'user_action' ? (nextStep as any).content?.choices : undefined)
  const followsChoiceStep = prevStep?.type === 'user_action' && (prevStep as any).content?.choices?.length
  const rawText = content?.text ?? ''
  const displayText = followsChoiceStep && rawText.includes('{{selectedChoice}}')
    ? rawText.replace(/\{\{selectedChoice\}\}/g, lastSelectedChoice ?? 'your selection')
    : rawText

  const transitionAfterId = content?.oauthTransitionAfterStepId as string | undefined
  let oauthConnected = false
  if (transitionAfterId) {
    const boundaryIdx = steps.findIndex((s) => s.id === transitionAfterId)
    if (boundaryIdx >= 0 && upToIndex >= boundaryIdx) oauthConnected = true
  }
  if (oauthConnected) choices = undefined

  const templateContent: Record<string, unknown> = {
    text: displayText,
    choices: choices?.length ? choices : undefined,
    personaNames: personas.map((p) => p.name),
  }
  if (oauthConnected) templateContent.oauthConnected = true
  if (content?.connectConnectedTitle != null) templateContent.connectConnectedTitle = content.connectConnectedTitle
  if (content?.connectConnectedBody != null) templateContent.connectConnectedBody = content.connectConnectedBody
  if (content?.caseTitle != null) templateContent.caseTitle = content.caseTitle
  if (content?.caseFields != null) templateContent.caseFields = content.caseFields
  if (content?.caseStatus != null) templateContent.caseStatus = content.caseStatus
  if (content?.caseNote != null) templateContent.caseNote = content.caseNote
  if (content?.caseAvatarUrl != null) templateContent.caseAvatarUrl = content.caseAvatarUrl
  if (content?.connectCardTitle != null) templateContent.connectCardTitle = content.connectCardTitle
  if (content?.connectCardBody != null) templateContent.connectCardBody = content.connectCardBody
  if (content?.connectCardFooter != null) templateContent.connectCardFooter = content.connectCardFooter
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
  const tr = content as {
    connectCardTitle?: string
    connectCardBody?: string
    connectCardFooter?: string
  }
  if (tr.connectCardTitle != null) templateContent.connectCardTitle = tr.connectCardTitle
  if (tr.connectCardBody != null) templateContent.connectCardBody = tr.connectCardBody
  if (tr.connectCardFooter != null) templateContent.connectCardFooter = tr.connectCardFooter
  const isApp = content?.actor === 'app'
  return {
    id: step.id,
    author: persona?.name ?? 'Slackbot',
    text: displayText,
    timestamp: 'Just now',
    isApp,
    avatarUrl: !isApp ? resolvePersonaAvatarUrl(persona) : undefined,
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
