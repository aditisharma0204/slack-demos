/**
 * Shared header for Slackbot, Channel, and Thread views.
 * Used by ChatView and by the View Headers design page.
 * Edit this file to change headers for all demos.
 */

export type HeaderViewType = 'slackbot' | 'channel' | 'thread'

export interface ChatHeaderProps {
  /** Which view variant to render (controls layout and icon). */
  viewType?: HeaderViewType
  /** Main title: "Slackbot", "#channel-name", or "Thread". */
  title?: string
  /** Optional custom avatar for app/slackbot view. */
  avatarUrl?: string
  /** Optional: for thread view, a short parent message preview (e.g. first line of the message this thread is under). */
  threadParentPreview?: string
  /** Channel view only: hide the Calls / huddle pill (e.g. embedded Mission Control canvas). Default true. */
  channelShowCalls?: boolean
}

/* Pill-style header buttons: white background. No color set so icons stay dark. */
const headerPillStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(232, 232, 232, 1)',
}
/* Variant with no border for channel and thread header buttons. */
const headerPillStyleNoBorder = {
  backgroundColor: 'rgba(255, 255, 255, 1)',
  border: 'none',
}
const headerPillClass =
  'flex items-center justify-center rounded-full flex-shrink-0 transition-colors min-h-9 px-2 gap-1.5 text-[#1d1c1d] hover:bg-[#ebebeb]'

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M9.75 2.49976C10.1641 2.49976 10.4999 2.83565 10.5 3.24976C10.5 3.66397 10.1642 3.99976 9.75 3.99976H5.25C4.00744 3.99976 3.00013 5.00723 3 6.24976V14.7498C3 15.9924 4.00736 16.9998 5.25 16.9998H13.75C14.9926 16.9998 16 15.9924 16 14.7498V10.2498C16.0001 9.83565 16.3359 9.49976 16.75 9.49976C17.1641 9.49976 17.4999 9.83565 17.5 10.2498V14.7498C17.5 16.8208 15.8211 18.4998 13.75 18.4998H5.25C3.17893 18.4998 1.5 16.8208 1.5 14.7498V6.24976C1.50013 4.1788 3.17901 2.49976 5.25 2.49976H9.75ZM14.2324 2.20679C15.2087 1.23081 16.7913 1.23082 17.7676 2.20679L17.793 2.23218C18.7691 3.20841 18.769 4.79105 17.793 5.76733L11.0303 12.53C10.931 12.6293 10.8058 12.6986 10.6689 12.7302L7.41895 13.4802C7.16698 13.5384 6.90258 13.4629 6.71973 13.28C6.53696 13.0972 6.4614 12.8327 6.51953 12.5808L7.26953 9.33081L7.2998 9.2312C7.33733 9.13345 7.39514 9.04407 7.46973 8.96948L14.2324 2.20679ZM8.68164 9.87769L8.25 11.7488L10.1211 11.3171L15.1885 6.24878L13.749 4.80933L8.68164 9.87769ZM16.707 3.26733C16.3166 2.87715 15.6834 2.87715 15.293 3.26733L14.8096 3.74878L16.249 5.18823L16.7324 4.70679C17.1226 4.31628 17.1227 3.68317 16.7324 3.29272L16.707 3.26733Z" fill="#454447" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M9 1.5C13.1421 1.5 16.5 4.85786 16.5 9C16.5 10.8009 15.8636 12.4522 14.8057 13.7451L18.2803 17.2197C18.5732 17.5126 18.5732 17.9874 18.2803 18.2803C17.9874 18.5732 17.5126 18.5732 17.2197 18.2803L13.7451 14.8057C12.4522 15.8636 10.8009 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5ZM9 3C5.68629 3 3 5.68629 3 9C3 12.3137 5.68629 15 9 15C12.3137 15 15 12.3137 15 9C15 5.68629 12.3137 3 9 3Z" fill="#454447" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M10 14.5C10.9665 14.5 11.75 15.2835 11.75 16.25C11.75 17.2165 10.9665 18 10 18C9.0335 18 8.25 17.2165 8.25 16.25C8.25 15.2835 9.0335 14.5 10 14.5ZM10 8.25C10.9665 8.25 11.75 9.0335 11.75 10C11.75 10.9665 10.9665 11.75 10 11.75C9.0335 11.75 8.25 10.9665 8.25 10C8.25 9.0335 9.0335 8.25 10 8.25ZM10 2C10.9665 2 11.75 2.7835 11.75 3.75C11.75 4.7165 10.9665 5.5 10 5.5C9.0335 5.5 8.25 4.7165 8.25 3.75C8.25 2.7835 9.0335 2 10 2Z" fill="#454447" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M15.4697 3.46962C15.7626 3.17673 16.2373 3.17673 16.5302 3.46962C16.8231 3.76252 16.8231 4.23728 16.5302 4.53017L11.0605 9.9999L16.5302 15.4696C16.8231 15.7625 16.8231 16.2373 16.5302 16.5302C16.2373 16.8231 15.7626 16.8231 15.4697 16.5302L9.99994 11.0604L4.53022 16.5302C4.23732 16.8231 3.76256 16.8231 3.46967 16.5302C3.17678 16.2373 3.17678 15.7625 3.46967 15.4696L8.9394 9.9999L3.46967 4.53017C3.1768 4.23728 3.17679 3.76251 3.46967 3.46962C3.76256 3.17677 4.23733 3.17677 4.53022 3.46962L9.99994 8.93935L15.4697 3.46962Z" fill="#1D1C1D" fillOpacity="0.7" />
    </svg>
  )
}

/** Channel view header actions: optional Calls, more. */
function ChannelHeaderActions({ showCalls = true }: { showCalls?: boolean }) {
  const iconClass = 'w-5 h-5 object-contain flex-shrink-0'
  const pillStyle = { ...headerPillStyle, paddingLeft: 8, paddingRight: 8 }
  return (
    <div className="flex items-center gap-2">
      {showCalls && (
        <button
          className={headerPillClass}
          style={pillStyle}
          type="button"
          aria-label="Calls"
        >
          <img src="/assets/headphones.svg" alt="" className={iconClass} aria-hidden />
          <span className="w-px self-stretch bg-[#1d1c1d]/30 rounded-full flex-shrink-0" aria-hidden />
          <img src="/assets/icon-composer-caret-down.svg" alt="" className="w-4 h-4 object-contain flex-shrink-0" aria-hidden />
        </button>
      )}
      <button
        className={`${headerPillClass} !px-2.5`}
        style={pillStyle}
        type="button"
        aria-label="More options"
      >
        <img src="/assets/more.svg" alt="" className={iconClass} aria-hidden />
      </button>
    </div>
  )
}

function DefaultHeaderActions({ viewType }: { viewType: HeaderViewType }) {
  const isThread = viewType === 'thread'
  const isSlackbot = viewType === 'slackbot'
  /* Slackbot: white background; thread: no border. */
  const pillStyle = isThread ? headerPillStyleNoBorder : isSlackbot ? { ...headerPillStyle, backgroundColor: 'rgba(255, 255, 255, 1)' } : headerPillStyle
  return (
    <div className="flex items-center gap-2">
      {!isThread && (
        <>
          <button className={`${headerPillClass} !px-2.5`} style={pillStyle} type="button" aria-label="Edit">
            <EditIcon />
          </button>
          <button className={`${headerPillClass} !px-2.5`} style={pillStyle} type="button" aria-label="Search">
            <SearchIcon />
          </button>
        </>
      )}
      <button className={`${headerPillClass} !px-2.5`} style={pillStyle} type="button" aria-label="More options">
        <MoreIcon />
      </button>
      <button className={`${headerPillClass} !px-2.5`} style={pillStyle} type="button" aria-label="Close">
        <CloseIcon />
      </button>
    </div>
  )
}

export function ChatHeader({
  viewType = 'slackbot',
  title = 'Slackbot',
  avatarUrl = '/assets/slackbot-icon.png',
  channelShowCalls = true,
}: ChatHeaderProps) {
  return (
    <header className="flex-shrink-0 bg-white" style={{ borderBottom: '1px solid #e0e0e0' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {(viewType === 'slackbot' || viewType === 'channel') && (
            <img
              src={avatarUrl}
              alt={title}
              className="w-9 h-9 rounded-md object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <h1
              className="font-extrabold truncate"
              style={{ color: 'var(--slack-text)', fontSize: '18px' }}
            >
              {title}
            </h1>
          </div>
        </div>
        {viewType === 'channel' ? (
          <ChannelHeaderActions showCalls={channelShowCalls} />
        ) : (
          <DefaultHeaderActions viewType={viewType} />
        )}
      </div>
    </header>
  )
}
