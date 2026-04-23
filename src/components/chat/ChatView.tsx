import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { getTemplateComponent, getTemplateById } from '@/extensions/slackResponseTemplateRegistry'
import type { ChatMessagePayload } from '@/engine/StoryEngine'
import { formatMessageWithMentions } from '@/components/chat/formatMessageWithMentions'
import { ChatHeader as SharedChatHeader } from '@/components/chat/ChatHeader'
import type { HeaderViewType } from '@/components/chat/ChatHeader'
import iconForwardMessage from '@/assets/icons/Forword message.svg'
import iconMoreActions from '@/assets/icons/More actions.svg'
import iconSaveForLater from '@/assets/icons/Save for later.svg'

/** Composer (user) typing: ms per character. Increase to slow down. */
const USER_TYPING_MS_PER_CHAR = 50
/** Slackbot reply typing: faster than the composer. Increase to slow down. */
const SLACKBOT_TYPING_MS_PER_CHAR = 10

/**
 * Character-at-a-time reveal. When `active` is false, shows full text immediately.
 */
function useCharTypingAnimation(
  fullText: string,
  active: boolean,
  onTick?: () => void,
  msPerChar: number = USER_TYPING_MS_PER_CHAR
): number {
  const [visibleLength, setVisibleLength] = useState(0)
  const tickRef = useRef(onTick)
  tickRef.current = onTick

  useEffect(() => {
    if (!active) {
      setVisibleLength(fullText.length)
      return
    }
    if (fullText.length === 0) {
      setVisibleLength(0)
      return
    }
    setVisibleLength(0)
    let i = 0
    const t = setInterval(() => {
      i++
      setVisibleLength(i)
      tickRef.current?.()
      if (i >= fullText.length) clearInterval(t)
    }, msPerChar)
    return () => clearInterval(t)
  }, [active, fullText, msPerChar])

  return visibleLength
}

export type Message = ChatMessagePayload

function getBotTypingPlainText(message: ChatMessagePayload): string {
  const t = message.templateContent?.text
  if (typeof t === 'string' && t.length > 0) return t
  return message.text ?? ''
}

interface ChatViewProps {
  messages: Message[]
  /** When set, show this text being typed in the input; user clicks send to advance */
  pendingUserMessage?: { text: string; author: string; avatarUrl?: string }
  /** When true, show thinking indicator in message area and status in input area */
  showThinking?: boolean
  /** Optional status text when thinking (e.g. "Looking into Slack history...") */
  thinkingStatusText?: string
  onSend?: () => void
  /** Called when user clicks a choice button */
  onChoiceClick?: (choice: string) => void
  /** Header title (e.g. "Slackbot", "#hr-relocation-leads", "Thread") */
  title?: string
  /** App persona display name for app/thinking rows. */
  appName?: string
  /** App persona avatar URL for slackbot header and app rows. */
  appAvatarUrl?: string
  /** Which header variant to show: slackbot (DM), channel, or thread. Defaults from title if not set. */
  viewType?: HeaderViewType
}

export function ChatView({
  messages,
  pendingUserMessage,
  showThinking,
  thinkingStatusText,
  onSend,
  onChoiceClick,
  title = 'Slackbot',
  appName = 'Slackbot',
  appAvatarUrl = '/assets/slackbot-icon.png',
  viewType = 'slackbot',
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  const fullText = pendingUserMessage?.text ?? ''
  const userTypedLen = useCharTypingAnimation(fullText, Boolean(pendingUserMessage), scrollToBottom)

  // When new messages or thinking state change, jump to bottom immediately (no smooth scroll) so the user isn’t disturbed by the UI scrolling down
  useEffect(() => {
    scrollToBottom()
  }, [messages, userTypedLen, showThinking, scrollToBottom])

  const displayText = fullText.slice(0, userTypedLen)
  const isTypingComplete = userTypedLen >= fullText.length && fullText.length > 0
  const hasMessageReady = Boolean(pendingUserMessage && isTypingComplete)

  const lastRealMessage = [...messages].reverse().find((m) => !m.isNewDivider)
  const typingBotMessageId = lastRealMessage?.isApp ? lastRealMessage.id : undefined

  return (
    <div
      className="flex flex-col flex-1 min-h-0 w-full"
      style={{ backgroundColor: '#ffffff', height: '100%', borderRadius: 0, boxSizing: 'border-box' }}
    >
      {/* Header: use shared ChatHeader so channel/thread show correct layout and actions */}
      <SharedChatHeader viewType={viewType} title={title} avatarUrl={appAvatarUrl} />

      {/* Messages area - scrollable; spacer pushes content to bottom when short; content overflows and scrolls when long */}
      <div
        ref={scrollRef}
        className="flex flex-col overflow-y-auto overflow-x-hidden"
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          backgroundColor: '#ffffff',
          overscrollBehavior: 'y contain',
        }}
      >
        {/* Spacer: takes remaining space so messages sit at bottom when few; shrinks when content overflows */}
        <div style={{ flex: '1 1 0%', minHeight: 0 }} aria-hidden />
        <div className="flex flex-col w-full gap-0 pt-0.5">
          {messages.map((msg) =>
            msg.isNewDivider ? (
              <NewTaggedDivider key={msg.id} />
            ) : (
              <ChatMessage
                key={msg.id}
                message={msg}
                onChoiceClick={onChoiceClick}
                // Only run the per-character typing animation while this is
                // genuinely the message being delivered. The moment a new
                // bot_typing indicator appears (showThinking=true), the user
                // has advanced past this message — snap it to fully-typed so
                // long bodies don't appear truncated mid-character.
                botTypingEnabled={
                  msg.isApp === true &&
                  msg.id === typingBotMessageId &&
                  !showThinking
                }
                onBotTypingTick={scrollToBottom}
                appAvatarUrl={appAvatarUrl}
              />
            )
          )}
          {showThinking && (
            <div className="slack-msg-row group relative w-full overflow-visible py-1.5 transition-[background-color] duration-100 ease-out hover:bg-[var(--slack-msg-hover)] focus-within:bg-[var(--slack-msg-hover)]">
              <div className="relative flex w-full gap-3 px-4 overflow-visible">
                <img
                  src={appAvatarUrl}
                  alt={appName}
                  className="w-9 h-9 rounded-lg flex-shrink-0 object-cover"
                />
                <div className="flex-1 min-w-0 overflow-visible">
                  <div className="relative overflow-visible">
                    <MessageHoverActions />
                    <div className="flex items-baseline gap-2 min-h-[18px]">
                      <span className="font-extrabold text-[15px]" style={{ color: 'var(--slack-text)' }}>
                        {appName}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--slack-msg-muted)' }}>
                        Just now
                      </span>
                    </div>
                  </div>
                  <div className="text-[15px] leading-relaxed" style={{ color: 'var(--slack-text)' }}>
                    <span className="italic">{thinkingStatusText ?? 'Thinking'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area - composer like reference */}
      <div
        className="flex-shrink-0 px-4 py-4"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="w-full min-w-0">
          <div
            className="rounded-2xl px-4 pt-3 pb-2 flex flex-col justify-start min-h-[88px] gap-0 w-full"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid rgba(204, 204, 204, 1)',
              boxShadow: 'none',
            }}
          >
              {/* Input / message area */}
              <div className="flex-1 min-h-[40px] pt-0 pb-2">
                {pendingUserMessage ? (
                  <div className="min-h-[24px] text-[15px] leading-relaxed" style={{ color: 'var(--slack-text)' }}>
                    {displayText}
                    {!isTypingComplete && <span className="animate-pulse">|</span>}
                  </div>
                ) : (
                  <div className="min-h-[24px] text-[15px] leading-relaxed" style={{ color: '#8b8b8b' }}>
                    Reply
                  </div>
                )}
              </div>
              {/* Action bar: fixed height so composer doesn't shift when send button appears */}
              <div className="composer-action-bar flex items-center justify-between pt-1 pb-0.5 h-[40px] flex-shrink-0">
                <div className="flex items-center gap-1 p-0 h-fit">
                  <ComposerIconButton aria-label="Add attachment">
                    <PlusIcon />
                  </ComposerIconButton>
                  <ComposerIconButton aria-label="Format text">
                    <FontIcon />
                  </ComposerIconButton>
                  <ComposerIconButton aria-label="Insert emoji">
                    <SmileIcon />
                  </ComposerIconButton>
                  <ComposerIconButton aria-label="Mention someone">
                    <AtIcon />
                  </ComposerIconButton>
                </div>
                <div
                  className="flex items-stretch overflow-hidden flex-shrink-0 gap-0 outline-none focus-within:outline-none mt-0 mb-0 -ml-2 -mr-2"
                  style={
                    hasMessageReady
                      ? { borderRadius: 7, backgroundColor: '#007a5a' }
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={hasMessageReady ? onSend : undefined}
                    disabled={pendingUserMessage ? !isTypingComplete : false}
                    className={`flex items-center justify-center transition flex-shrink-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ${
                      hasMessageReady
                        ? 'flex-[2] min-w-[44px] text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed'
                        : 'rounded bg-white hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                    style={
                      hasMessageReady
                        ? { width: 34, height: 34, minWidth: 34, minHeight: 34, padding: 8 }
                        : {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                            width: 28,
                            height: 28,
                            minWidth: 28,
                            minHeight: 28,
                            paddingLeft: 10,
                            paddingRight: 10,
                          }
                    }
                    aria-label="Send message"
                  >
                    <SendIcon active={hasMessageReady} size={hasMessageReady ? 18 : 20} />
                  </button>
                  <div
                    className={hasMessageReady ? 'w-px self-center flex-shrink-0' : 'w-px h-5 mx-0.5'}
                    style={{ backgroundColor: hasMessageReady ? 'rgba(255, 255, 255, 0.4)' : '#e0e0e0', height: hasMessageReady ? 20 : undefined }}
                  />
                  <button
                    type="button"
                    className={`flex items-center justify-center transition flex-shrink-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ${
                      hasMessageReady ? 'flex-1 min-w-[36px] text-white hover:bg-white/10' : 'rounded bg-white hover:bg-[#f5f5f5]'
                    }`}
                    style={
                      hasMessageReady
                        ? { width: 34, height: 34, minWidth: 34, minHeight: 34 }
                        : {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                            width: 28,
                            height: 28,
                            minWidth: 28,
                            minHeight: 28,
                          }
                    }
                    aria-label="Send options"
                  >
                    <CaretDownIcon active={hasMessageReady} />
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}

function ComposerIconButton({ children, 'aria-label': ariaLabel }: { children: React.ReactNode; 'aria-label': string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center rounded bg-white hover:bg-[#f0f0f0] transition flex-shrink-0"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 1)',
        width: 28,
        height: 28,
        minWidth: 28,
        minHeight: 28,
        paddingLeft: 10,
        paddingRight: 10,
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

/* Composer bar SVG icons – inline so DOM uses <svg> not <img> */
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M8 1.84961C8.41408 1.84961 8.74979 2.18558 8.75 2.59961V7.25H13.3994C13.8136 7.25 14.1494 7.58579 14.1494 8C14.1494 8.41421 13.8136 8.75 13.3994 8.75H8.75V13.3994C8.75 13.8136 8.41421 14.1494 8 14.1494C7.58579 14.1494 7.25 13.8136 7.25 13.3994V8.75H2.59961C2.18558 8.74979 1.84961 8.41408 1.84961 8C1.84961 7.58592 2.18558 7.25021 2.59961 7.25H7.25V2.59961C7.25021 2.18558 7.58592 1.84961 8 1.84961Z" fill="#454447" />
    </svg>
  )
}

function FontIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M12.892 6.04235C13.7704 5.71882 14.731 5.69294 15.6254 5.96911C17.037 6.40525 18.0004 7.71042 18.0004 9.18786V15.3002C18.0004 15.6727 17.6981 15.9747 17.3256 15.975C16.9529 15.975 16.6509 15.6729 16.6508 15.3002V14.6263C15.8869 15.1994 15.0154 15.6171 14.0883 15.849C13.0238 16.1151 11.9001 15.7095 11.2534 14.8207C9.76421 12.7729 11.2272 9.90075 13.7592 9.90075H16.6508V9.18786C16.6508 8.30256 16.0728 7.52056 15.227 7.25915C14.6157 7.07043 13.9592 7.0879 13.3588 7.30895L13.1401 7.38903C12.5701 7.59904 12.1261 8.05689 11.934 8.63317L11.891 8.76403C11.7731 9.11744 11.39 9.30837 11.0366 9.19079C10.6833 9.07283 10.4923 8.69069 10.6098 8.33727L10.6537 8.20641C10.9755 7.24109 11.7185 6.47422 12.6733 6.12243L12.892 6.04235ZM3.68011 3.57653C4.075 2.33008 5.8339 2.3166 6.24749 3.557L10.0903 15.0863C10.2081 15.4399 10.017 15.8228 9.66351 15.9408C9.31007 16.0585 8.92804 15.8673 8.80999 15.514L7.7641 12.3754H2.30902L1.31878 15.5043C1.20615 15.8594 0.826374 16.0561 0.471128 15.9437C0.115906 15.8311 -0.0808386 15.4514 0.0316746 15.0961L3.68011 3.57653ZM13.7592 11.2504C12.3305 11.2504 11.5049 12.8713 12.3452 14.0267C12.667 14.4688 13.2287 14.6725 13.7612 14.5394C14.5719 14.3366 15.3317 13.9605 15.9838 13.4388L16.6508 12.9047V11.2504H13.7592ZM2.73675 11.0257H7.3139L4.96624 3.98376L2.73675 11.0257Z" fill="#454447" />
    </svg>
  )
}

function SmileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <g clipPath="url(#clip0_composer_smile)">
        <path d="M9 0.825195C13.5148 0.825301 17.1747 4.48523 17.1748 9C17.1747 13.5148 13.5148 17.1747 9 17.1748C4.48523 17.1747 0.825301 13.5148 0.825195 9C0.825301 4.48523 4.48523 0.825301 9 0.825195ZM9 2.3252C5.31365 2.3253 2.3253 5.31365 2.3252 9C2.3253 12.6863 5.31365 15.6747 9 15.6748C12.6863 15.6747 15.6747 12.6863 15.6748 9C15.6747 5.31365 12.6863 2.3253 9 2.3252ZM11.124 10.5654C11.2535 10.1721 11.6779 9.95761 12.0713 10.0869C12.4647 10.2163 12.679 10.6408 12.5498 11.0342C11.9923 12.729 10.4917 13.5752 9.02441 13.5752C7.55713 13.5752 6.05652 12.729 5.49902 11.0342C5.36979 10.6408 5.58416 10.2163 5.97754 10.0869C6.3709 9.95764 6.79533 10.1721 6.9248 10.5654C7.25549 11.5706 8.12331 12.0752 9.02441 12.0752C9.92551 12.0752 10.7933 11.5705 11.124 10.5654ZM6.75 5.84961C7.49558 5.84961 8.09961 6.45461 8.09961 7.2002C8.0995 7.94569 7.49552 8.5498 6.75 8.5498C6.00448 8.5498 5.4005 7.94569 5.40039 7.2002C5.40039 6.45461 6.00442 5.84961 6.75 5.84961ZM11.25 5.84961C11.9956 5.84961 12.5996 6.45461 12.5996 7.2002C12.5995 7.94569 11.9955 8.5498 11.25 8.5498C10.5045 8.5498 9.9005 7.94569 9.90039 7.2002C9.90039 6.45461 10.5044 5.84961 11.25 5.84961Z" fill="#454447" />
      </g>
      <defs>
        <clipPath id="clip0_composer_smile">
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function AtIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <g clipPath="url(#clip0_composer_at)">
        <path d="M9 0.825195C13.5148 0.825301 17.1747 4.48523 17.1748 9V9.58008C17.1747 11.2892 15.7892 12.6748 14.0801 12.6748C13.2509 12.6747 12.5197 12.2622 12.0752 11.6328C11.3325 12.4995 10.2309 13.0497 9 13.0498C6.7634 13.0497 4.9503 11.2366 4.9502 9C4.9503 6.7634 6.7634 4.9503 9 4.9502C10.0087 4.95024 10.9307 5.31954 11.6396 5.92969C11.7074 5.58507 12.0105 5.3252 12.375 5.3252C12.7892 5.3252 13.125 5.66098 13.125 6.0752V10.2197C13.1251 10.7472 13.5527 11.1747 14.0801 11.1748C14.9608 11.1748 15.6747 10.4607 15.6748 9.58008V9C15.6747 5.31365 12.6863 2.3253 9 2.3252C5.31365 2.3253 2.3253 5.31365 2.3252 9C2.3253 12.6863 5.31365 15.6747 9 15.6748C10.4327 15.6748 11.758 15.2242 12.8447 14.457C13.1831 14.2182 13.6517 14.2993 13.8906 14.6377C14.1291 14.976 14.0482 15.4438 13.71 15.6826C12.3785 16.6226 10.7525 17.1748 9 17.1748C4.48523 17.1747 0.825301 13.5148 0.825195 9C0.825301 4.48523 4.48523 0.825301 9 0.825195ZM9 6.4502C7.59183 6.4503 6.4503 7.59183 6.4502 9C6.4503 10.4082 7.59183 11.5497 9 11.5498C10.4082 11.5497 11.5497 10.4082 11.5498 9C11.5497 7.59183 10.4082 6.4503 9 6.4502Z" fill="#454447" />
      </g>
      <defs>
        <clipPath id="clip0_composer_at">
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function SendIcon({ active, size = 20 }: { active?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M1.35059 1.67776C1.35059 1.21174 1.80987 0.884117 2.25 1.03713L16.3184 8.24026C16.7948 8.48444 16.7948 9.16599 16.3184 9.41018L2.25 16.6133L2.19922 16.625C1.76713 16.731 1.35059 16.4039 1.35059 15.959V11.7813C1.35059 10.6665 2.22336 9.7287 3.33984 9.70901L9.22559 9.55276C9.46811 9.54355 9.90035 9.33145 9.90039 8.82522C9.90039 8.31894 9.45013 8.09769 9.22559 8.09768L3.33984 7.94143C2.22336 7.92174 1.35059 6.98398 1.35059 5.86916V1.67776Z" fill={active ? 'currentColor' : '#7C7A7F'} />
    </svg>
  )
}

function CaretDownIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M13.2197 7.46967C13.5126 7.17678 13.9873 7.17678 14.2802 7.46967C14.5731 7.76256 14.5731 8.23732 14.2802 8.53021L10.5302 12.2802C10.3896 12.4209 10.1988 12.4999 9.99994 12.4999C9.80104 12.4999 9.61032 12.4209 9.46967 12.2802L5.71967 8.53021C5.42678 8.23732 5.42678 7.76256 5.71967 7.46967C6.01256 7.17678 6.48732 7.17678 6.78021 7.46967L9.99994 10.6894L13.2197 7.46967Z" fill={active ? 'currentColor' : '#7C7A7F'} />
    </svg>
  )
}

type MessageActionId = 'forward' | 'bookmark' | 'more'

/** Slack-style floating actions + per-button hover (circular hit) and dark tooltip above. */
function MessageHoverActions() {
  const [activeTip, setActiveTip] = useState<MessageActionId | null>(null)
  const uid = useId()

  return (
    <div
      className="slack-msg-hover-actions absolute z-20 flex items-center gap-0 rounded-xl py-0.5 pl-0.5 pr-1 opacity-0 pointer-events-none transition-opacity duration-150 ease-out group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
      style={{
        right: 0,
        transform: 'translateY(-50%)',
        backgroundColor: '#ffffff',
        color: '#1d1c1d',
        border: '1px solid var(--slack-msg-actions-border)',
        boxShadow: 'var(--slack-msg-actions-shadow)',
      }}
      onMouseLeave={() => setActiveTip(null)}
    >
      <MessageActionSlot
        id="forward"
        uid={uid}
        label="Forward message …"
        activeTip={activeTip}
        setActiveTip={setActiveTip}
        ariaLabel="Forward message"
      >
        <MessageActionForwardIcon />
      </MessageActionSlot>
      <MessageActionSlot
        id="bookmark"
        uid={uid}
        label="Save for later …"
        activeTip={activeTip}
        setActiveTip={setActiveTip}
        ariaLabel="Save for later"
      >
        <MessageActionBookmarkIcon />
      </MessageActionSlot>
      <MessageActionSlot
        id="more"
        uid={uid}
        label="More actions …"
        activeTip={activeTip}
        setActiveTip={setActiveTip}
        ariaLabel="More actions"
      >
        <MessageActionMoreIcon />
      </MessageActionSlot>
    </div>
  )
}

function MessageActionSlot({
  id,
  uid,
  label,
  activeTip,
  setActiveTip,
  ariaLabel,
  children,
}: {
  id: MessageActionId
  uid: string
  label: string
  activeTip: MessageActionId | null
  setActiveTip: (v: MessageActionId | null) => void
  ariaLabel: string
  children: React.ReactNode
}) {
  const tipId = `${uid}-${id}-tip`
  const showTip = activeTip === id
  const iconBtn =
    'slack-msg-hover-action-btn flex items-center justify-center size-8 rounded-[10px] shrink-0 outline-none transition-[background-color] duration-100'

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className={iconBtn}
        aria-label={ariaLabel}
        aria-describedby={showTip ? tipId : undefined}
        onMouseEnter={() => setActiveTip(id)}
        onFocus={() => setActiveTip(id)}
        onBlur={() => setActiveTip(null)}
      >
        {children}
      </button>
      {showTip ? (
        <div
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[60] min-w-max -translate-x-1/2"
        >
          <div className="relative rounded-md bg-[#1d1c1d] px-2.5 py-1.5 text-center text-[13px] font-normal leading-snug text-white shadow-md">
            {label}
            <span
              className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-[6px] border-solid border-transparent border-t-[#1d1c1d]"
              aria-hidden
            />
          </div>
        </div>
      ) : null}
    </span>
  )
}

function MessageActionForwardIcon() {
  return (
    <img
      src={iconForwardMessage}
      alt=""
      aria-hidden
      width={18}
      height={18}
      className="slack-msg-hover-action-icon shrink-0 pointer-events-none select-none object-contain"
      draggable={false}
    />
  )
}

function MessageActionBookmarkIcon() {
  return (
    <img
      src={iconSaveForLater}
      alt=""
      aria-hidden
      width={18}
      height={18}
      className="slack-msg-hover-action-icon shrink-0 pointer-events-none select-none object-contain"
      draggable={false}
    />
  )
}

function MessageActionMoreIcon() {
  return (
    <img
      src={iconMoreActions}
      alt=""
      aria-hidden
      width={18}
      height={18}
      className="slack-msg-hover-action-icon shrink-0 pointer-events-none select-none object-contain"
      draggable={false}
    />
  )
}

/** "New" tagged divider strip: thin red line with "New" on the right. Shown when switching back to a persona's view. */
function NewTaggedDivider() {
  return (
    <div className="flex items-center w-full gap-3 py-2 px-4" aria-hidden>
      <div
        className="flex-1 min-w-0"
        style={{ height: 2, backgroundColor: '#c53030', borderRadius: 1 }}
      />
      <span
        className="flex-shrink-0 text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--slack-text)' }}
      >
        New
      </span>
    </div>
  )
}

/** User row avatar: photo from persona when available; initials fallback if URL missing or load fails. */
function UserMessageAvatar({ author, avatarUrl }: { author: string; avatarUrl?: string }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showFallback = !avatarUrl || imgFailed
  if (showFallback) {
    return (
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: 'var(--slack-send-btn)' }}
        aria-hidden
      >
        {author.slice(0, 2).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={avatarUrl}
      alt=""
      className="w-9 h-9 rounded-lg flex-shrink-0 object-cover"
      loading="lazy"
      decoding="async"
      onError={() => setImgFailed(true)}
    />
  )
}

function ChatMessage({
  message,
  onChoiceClick,
  botTypingEnabled = false,
  onBotTypingTick,
  appAvatarUrl = '/assets/slackbot-icon.png',
}: {
  message: Message
  onChoiceClick?: (choice: string) => void
  /** When true and this is the latest app message, body text types out like the composer */
  botTypingEnabled?: boolean
  onBotTypingTick?: () => void
  appAvatarUrl?: string
}) {
  const isSystem = message.author === 'System'
  const isApp = message.isApp ?? false
  const typingPlain = !isSystem && isApp ? getBotTypingPlainText(message) : ''
  const botTypedLen = useCharTypingAnimation(
    typingPlain,
    Boolean(!isSystem && isApp && botTypingEnabled),
    onBotTypingTick,
    SLACKBOT_TYPING_MS_PER_CHAR
  )

  if (isSystem) {
    return (
      <div className="flex justify-center py-4">
        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}>
          {message.text}
        </span>
      </div>
    )
  }

  const showTypingPlaceholder =
    isApp && typingPlain.length > 0 && botTypedLen < typingPlain.length

  useEffect(() => {
    // After bot typing completes, templates can expand (e.g. reveal action buttons).
    // Re-align to bottom so the whole message block is visible without manual scroll.
    if (!isSystem && isApp && botTypingEnabled && !showTypingPlaceholder) {
      onBotTypingTick?.()
    }
  }, [isSystem, isApp, botTypingEnabled, showTypingPlaceholder, onBotTypingTick])

  const templateId = message.templateId
  const templateDef = templateId ? getTemplateById(templateId) : undefined
  const templateType = (templateDef?.type ?? templateId) as string | undefined
  const TemplateComponent = templateType ? getTemplateComponent(templateType) : undefined
  const config = templateDef?.config ?? {}
  const content = message.templateContent ?? {
    text: message.text,
    choices: message.choices,
    personaNames: message.personaNames,
  }
  const personaNames = message.personaNames ?? []

  const body = showTypingPlaceholder ? (
    <div className="min-h-[24px] text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--slack-text)' }}>
      {formatMessageWithMentions(typingPlain.slice(0, botTypedLen), personaNames)}
      <span className="animate-pulse">|</span>
    </div>
  ) : TemplateComponent && templateId ? (
    <TemplateComponent
      content={content as Record<string, unknown> & { text?: string; choices?: string[] }}
      config={config}
      timestamp={message.timestamp}
      onChoiceClick={onChoiceClick}
    />
  ) : (
    <>
      {message.text && (
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--slack-text)' }}>
          {formatMessageWithMentions(message.text, personaNames)}
        </div>
      )}
      {message.choices && message.choices.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 items-center">
          {message.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => onChoiceClick?.(choice)}
              className="inline-flex items-center justify-center flex-shrink-0 h-9 px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition hover:bg-[#f5f5f5]"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d1d1',
                color: 'var(--slack-text)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      )}
    </>
  )

  return (
    <div className="slack-msg-row group relative w-full overflow-visible py-1.5 transition-[background-color] duration-100 ease-out hover:bg-[var(--slack-msg-hover)] focus-within:bg-[var(--slack-msg-hover)]">
      <div className="relative flex w-full gap-3 px-4 overflow-visible">
        {isApp ? (
          <img
            src={appAvatarUrl}
            alt={message.author}
            className="w-9 h-9 rounded-lg flex-shrink-0 object-cover pt-0 pb-0"
          />
        ) : (
          <UserMessageAvatar author={message.author} avatarUrl={message.avatarUrl} />
        )}
        <div className="flex-1 min-w-0 overflow-visible">
          <div className="relative overflow-visible">
            <MessageHoverActions />
            <div className="flex items-baseline justify-start gap-2 min-h-[18px] m-0 pr-1">
              <span className="font-extrabold text-[15px]" style={{ color: 'var(--slack-text)' }}>
                {message.author}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--slack-msg-muted)' }}>
                {message.timestamp ?? 'Just now'}
              </span>
            </div>
          </div>
          {body}
        </div>
      </div>
    </div>
  )
}
