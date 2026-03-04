import { useState, useEffect, useRef } from 'react'
import { getTemplateComponent, getTemplateById } from '@/extensions/slackResponseTemplateRegistry'
import type { ChatMessagePayload } from '@/engine/StoryEngine'
import { formatMessageWithMentions } from '@/components/chat/formatMessageWithMentions'

export type Message = ChatMessagePayload

interface ChatViewProps {
  messages: Message[]
  /** When set, show this text being typed in the input; user clicks send to advance */
  pendingUserMessage?: { text: string; author: string }
  /** When true, show thinking indicator in message area and status in input area */
  showThinking?: boolean
  /** Optional status text when thinking (e.g. "Looking into Slack history...") */
  thinkingStatusText?: string
  onSend?: () => void
  /** Called when user clicks a choice button */
  onChoiceClick?: (choice: string) => void
  /** Header title (e.g. "Slackbot") */
  title?: string
}

export function ChatView({
  messages,
  pendingUserMessage,
  showThinking,
  thinkingStatusText,
  onSend,
  onChoiceClick,
  title = 'Slackbot',
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [typedLength, setTypedLength] = useState(0)

  // Typing animation for pending user message
  const fullText = pendingUserMessage?.text ?? ''
  useEffect(() => {
    if (!pendingUserMessage) {
      setTypedLength(0)
      return
    }
    setTypedLength(0)
    const chars = fullText.length
    if (chars === 0) return
    const delay = Math.min(30, 2000 / chars)
    let i = 0
    const t = setInterval(() => {
      i++
      setTypedLength(i)
      if (i >= chars) clearInterval(t)
    }, delay)
    return () => clearInterval(t)
  }, [pendingUserMessage?.text, fullText.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typedLength, showThinking])

  const displayText = fullText.slice(0, typedLength)
  const isTypingComplete = typedLength >= fullText.length && fullText.length > 0
  const hasMessageReady = Boolean(pendingUserMessage && isTypingComplete)

  return (
    <div
      className="flex flex-col flex-1 min-h-0 w-full"
      style={{ backgroundColor: '#ffffff', height: '100%' }}
    >
      {/* Header */}
      <ChatHeader title={title} />

      {/* Messages area - scrollable; spacer pushes content to bottom when short; content overflows and scrolls when long */}
      <div
        ref={scrollRef}
        className="flex flex-col overflow-y-auto overflow-x-hidden px-4 py-6"
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          backgroundColor: '#ffffff',
          overscrollBehavior: 'y contain',
        }}
      >
        {/* Spacer: takes remaining space so messages sit at bottom when few; shrinks when content overflows */}
        <div style={{ flex: '1 1 0%', minHeight: 0 }} aria-hidden />
        <div className="mx-auto space-y-2 w-full" style={{ width: 672, maxWidth: '100%' }}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onChoiceClick={onChoiceClick} />
          ))}
          {showThinking && (
            <div className="flex gap-3 py-0 w-full">
              <img
                src="/assets/slackbot-icon.png"
                alt="Slackbot"
                className="w-9 h-9 rounded-lg flex-shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-extrabold text-[15px]" style={{ color: 'var(--slack-text)' }}>
                    Slackbot
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--slack-msg-muted)' }}>
                    Just now
                  </span>
                </div>
                <div className="text-[15px] leading-relaxed" style={{ color: 'var(--slack-text)' }}>
                  <span className="italic">{thinkingStatusText ?? 'Thinking'}</span>
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
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl px-4 pt-3 pb-2 flex flex-col min-h-[88px] gap-0"
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
              {/* Action bar */}
              <div className="flex items-center justify-between pt-1 pb-0.5">
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
                  className="flex items-stretch overflow-hidden flex-shrink-0 gap-0 outline-none focus-within:outline-none"
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

function ChatHeader({ title = 'Slackbot' }: { title?: string }) {
  return (
    <header className="flex-shrink-0 bg-white" style={{ borderBottom: '1px solid #e0e0e0' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src="/assets/slackbot-icon.png"
            alt={title}
            className="w-9 h-9 rounded-md object-cover flex-shrink-0"
          />
          <h1 className="font-extrabold text-[18px]" style={{ color: 'var(--slack-text)', fontSize: '18px' }}>
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-md flex-shrink-0 transition-colors hover:bg-[#f5f5f5]" style={{ backgroundColor: 'rgba(245, 245, 245, 1)' }} aria-label="Edit">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M9.75 2.49976C10.1641 2.49976 10.4999 2.83565 10.5 3.24976C10.5 3.66397 10.1642 3.99976 9.75 3.99976H5.25C4.00744 3.99976 3.00013 5.00723 3 6.24976V14.7498C3 15.9924 4.00736 16.9998 5.25 16.9998H13.75C14.9926 16.9998 16 15.9924 16 14.7498V10.2498C16.0001 9.83565 16.3359 9.49976 16.75 9.49976C17.1641 9.49976 17.4999 9.83565 17.5 10.2498V14.7498C17.5 16.8208 15.8211 18.4998 13.75 18.4998H5.25C3.17893 18.4998 1.5 16.8208 1.5 14.7498V6.24976C1.50013 4.1788 3.17901 2.49976 5.25 2.49976H9.75ZM14.2324 2.20679C15.2087 1.23081 16.7913 1.23082 17.7676 2.20679L17.793 2.23218C18.7691 3.20841 18.769 4.79105 17.793 5.76733L11.0303 12.53C10.931 12.6293 10.8058 12.6986 10.6689 12.7302L7.41895 13.4802C7.16698 13.5384 6.90258 13.4629 6.71973 13.28C6.53696 13.0972 6.4614 12.8327 6.51953 12.5808L7.26953 9.33081L7.2998 9.2312C7.33733 9.13345 7.39514 9.04407 7.46973 8.96948L14.2324 2.20679ZM8.68164 9.87769L8.25 11.7488L10.1211 11.3171L15.1885 6.24878L13.749 4.80933L8.68164 9.87769ZM16.707 3.26733C16.3166 2.87715 15.6834 2.87715 15.293 3.26733L14.8096 3.74878L16.249 5.18823L16.7324 4.70679C17.1226 4.31628 17.1227 3.68317 16.7324 3.29272L16.707 3.26733Z" fill="#454447" />
            </svg>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-md flex-shrink-0 transition-colors hover:bg-[#f5f5f5]" style={{ backgroundColor: 'rgba(245, 245, 245, 1)' }} aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M9 1.5C13.1421 1.5 16.5 4.85786 16.5 9C16.5 10.8009 15.8636 12.4522 14.8057 13.7451L18.2803 17.2197C18.5732 17.5126 18.5732 17.9874 18.2803 18.2803C17.9874 18.5732 17.5126 18.5732 17.2197 18.2803L13.7451 14.8057C12.4522 15.8636 10.8009 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5ZM9 3C5.68629 3 3 5.68629 3 9C3 12.3137 5.68629 15 9 15C12.3137 15 15 12.3137 15 9C15 5.68629 12.3137 3 9 3Z" fill="#454447" />
            </svg>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-md flex-shrink-0 transition-colors hover:bg-[#f5f5f5]" style={{ backgroundColor: 'rgba(245, 245, 245, 1)' }} aria-label="More options">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M10 14.5C10.9665 14.5 11.75 15.2835 11.75 16.25C11.75 17.2165 10.9665 18 10 18C9.0335 18 8.25 17.2165 8.25 16.25C8.25 15.2835 9.0335 14.5 10 14.5ZM10 8.25C10.9665 8.25 11.75 9.0335 11.75 10C11.75 10.9665 10.9665 11.75 10 11.75C9.0335 11.75 8.25 10.9665 8.25 10C8.25 9.0335 9.0335 8.25 10 8.25ZM10 2C10.9665 2 11.75 2.7835 11.75 3.75C11.75 4.7165 10.9665 5.5 10 5.5C9.0335 5.5 8.25 4.7165 8.25 3.75C8.25 2.7835 9.0335 2 10 2Z" fill="#454447" />
            </svg>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-md flex-shrink-0 transition-colors hover:bg-[#f5f5f5]" style={{ backgroundColor: 'rgba(245, 245, 245, 1)' }} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.4697 3.46962C15.7626 3.17673 16.2373 3.17673 16.5302 3.46962C16.8231 3.76252 16.8231 4.23728 16.5302 4.53017L11.0605 9.9999L16.5302 15.4696C16.8231 15.7625 16.8231 16.2373 16.5302 16.5302C16.2373 16.8231 15.7626 16.8231 15.4697 16.5302L9.99994 11.0604L4.53022 16.5302C4.23732 16.8231 3.76256 16.8231 3.46967 16.5302C3.17678 16.2373 3.17678 15.7625 3.46967 15.4696L8.9394 9.9999L3.46967 4.53017C3.1768 4.23728 3.17679 3.76251 3.46967 3.46962C3.76256 3.17677 4.23733 3.17677 4.53022 3.46962L9.99994 8.93935L15.4697 3.46962Z" fill="#1D1C1D" fillOpacity="0.7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

function ChatMessage({ message, onChoiceClick }: { message: Message; onChoiceClick?: (choice: string) => void }) {
  if (message.author === 'System') {
    return (
      <div className="flex justify-center py-4">
        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}>
          {message.text}
        </span>
      </div>
    )
  }
  const isApp = message.isApp ?? false
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

  const body =
    TemplateComponent && templateId ? (
      <>
        <TemplateComponent
          content={content as Record<string, unknown> & { text?: string; choices?: string[] }}
          config={config}
          timestamp={message.timestamp}
          onChoiceClick={onChoiceClick}
        />
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
    ) : (
      <>
        {message.text && (
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--slack-text)' }}>
            {formatMessageWithMentions(message.text, message.personaNames ?? [])}
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
    <div className="flex gap-3 py-0">
      {isApp ? (
        <img
          src="/assets/slackbot-icon.png"
          alt={message.author}
          className="w-9 h-9 rounded-lg flex-shrink-0 object-cover"
        />
      ) : (
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: 'var(--slack-send-btn)' }}
        >
          {message.author.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-extrabold text-[15px]" style={{ color: 'var(--slack-text)' }}>
            {message.author}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--slack-msg-muted)' }}>
            {message.timestamp ?? 'Just now'}
          </span>
        </div>
        {body}
      </div>
    </div>
  )
}
