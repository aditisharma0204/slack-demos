import { SlackMessage } from '@/components/messages/SlackMessage'

interface Message {
  id: string
  author: string
  text?: string
  timestamp?: string
  isApp?: boolean
}

interface SplitViewProps {
  channelMessages: Message[]
  dmMessages: Message[]
  selectedChannel?: string
  selectedDm?: string
  showSlackbotGreeting?: boolean
}

const SAMPLE_CHANNEL_MESSAGES: Message[] = [
  { id: '1', author: 'Lee Hao', text: 'Do we support SCIM provisioning for enterprise plans? @Channel Expert', timestamp: '5:16 PM' },
  { id: '2', author: 'Matt Brewer', text: 'Has Acme reported any issues with the onboarding flow lately @Channel Expert', timestamp: '5:18 PM' },
  { id: '3', author: 'Zoe Maxwell', text: 'Does the admin dashboard show usage by team or just by user? @Channel Expert', timestamp: '5:20 PM' },
  { id: '4', author: 'Nikki Kroll', text: 'What kind of usage visibility do we offer in product before renewal? @Channel Expert', timestamp: '5:22 PM' },
]

function ChannelHeader({ title, description }: { title: string; description?: string }) {
  const displayTitle = title.startsWith('#') ? title : `#${title.replace(/^#/, '')}`
  return (
    <>
      <header className="flex-shrink-0 px-4 py-3 border-b bg-white" style={{ borderColor: 'var(--slack-border)' }}>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-bold text-[18px] text-[var(--slack-text)]">{displayTitle}</h1>
          {description && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-[13px]" style={{ color: 'var(--slack-msg-muted)' }}>{description}</p>
              <button className="px-2.5 py-1 text-[12px] font-medium rounded border bg-[var(--slack-btn-active-bg)] text-[var(--slack-text)] hover:bg-[var(--slack-btn-hover-bg)]" style={{ borderColor: 'var(--slack-btn-border)' }}>
                Cases
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded border text-[var(--slack-msg-muted)] hover:bg-[var(--slack-btn-hover-bg)]" style={{ borderColor: 'var(--slack-btn-border)', backgroundColor: 'var(--slack-btn-bg)' }}>+</button>
            </div>
          )}
        </div>
      </header>
      <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b bg-white" style={{ borderColor: 'var(--slack-border)' }}>
        <button className="px-3 py-1.5 text-[13px] font-medium text-[var(--slack-text)] border-b-2 -mb-[1px]" style={{ borderColor: 'var(--slack-tab-active)' }}>
          Messages
        </button>
        <button className="px-3 py-1.5 text-[13px] rounded hover:bg-[var(--slack-btn-hover-bg)]" style={{ color: 'var(--slack-msg-muted)' }}>
          Cases
        </button>
        <button className="px-2 py-1.5 rounded hover:bg-[var(--slack-btn-hover-bg)]" style={{ color: 'var(--slack-msg-muted)' }}>+</button>
      </div>
    </>
  )
}

function DmHeader({ title }: { title: string }) {
  return (
    <>
      <header className="flex-shrink-0 px-4 py-3 border-b bg-white flex items-center justify-between" style={{ borderColor: 'var(--slack-border)' }}>
        <div className="flex items-center gap-2">
          {title === 'Slackbot' ? (
            <img src="/assets/slackbot-icon.png" alt="Slackbot" className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 rounded flex items-center justify-center text-white text-[11px] font-bold" style={{ background: 'linear-gradient(135deg, #e01e5a, #ecb22e, #36a64f)' }}>
              {title.slice(0, 1)}
            </div>
          )}
          <h1 className="font-bold text-[15px] text-[var(--slack-text)]">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)]" style={{ color: 'var(--slack-msg-muted)' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z" /></svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)]" style={{ color: 'var(--slack-msg-muted)' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)]" style={{ color: 'var(--slack-msg-muted)' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
          </button>
        </div>
      </header>
      <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b bg-white" style={{ borderColor: 'var(--slack-border)' }}>
        <button className="px-3 py-1.5 text-[13px] font-medium text-[var(--slack-text)] border-b-2 -mb-[1px]" style={{ borderColor: 'var(--slack-tab-active)' }}>
          Messages
        </button>
        <button className="px-3 py-1.5 text-[13px] hover:text-[var(--slack-text)]" style={{ color: 'var(--slack-msg-muted)' }}>
          History
        </button>
        <button className="px-2 py-1.5 text-[var(--slack-msg-muted)] hover:text-[var(--slack-text)]">+</button>
      </div>
    </>
  )
}

function MessageInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex-shrink-0 p-4 border-t bg-white" style={{ borderColor: 'var(--slack-border)' }}>
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ backgroundColor: 'var(--slack-input-bg)', borderColor: 'var(--slack-input-border)' }}>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)]" style={{ color: 'var(--slack-msg-muted)' }}>+</button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)] text-[11px] font-bold" style={{ color: 'var(--slack-msg-muted)' }}>Aa</button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)]" style={{ color: 'var(--slack-msg-muted)' }}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" /></svg>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)] font-bold" style={{ color: 'var(--slack-msg-muted)' }}>@</button>
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 min-w-[120px] bg-transparent text-[13px] outline-none py-1 placeholder-[var(--slack-input-placeholder)]"
          style={{ color: 'var(--slack-text)' }}
        />
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)]" style={{ color: 'var(--slack-msg-muted)' }}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4z" clipRule="evenodd" /></svg>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--slack-msg-hover)]" style={{ color: 'var(--slack-msg-muted)' }}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
        <svg className="w-4 h-4" style={{ color: 'var(--slack-msg-muted)' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  )
}

export function SplitView({
  channelMessages,
  dmMessages,
  selectedChannel,
  selectedDm,
  showSlackbotGreeting = true,
}: SplitViewProps) {
  const channelMsgs = channelMessages.length > 0 ? channelMessages : SAMPLE_CHANNEL_MESSAGES
  const channelTitle = selectedChannel ?? '#sales-support'
  const channelDesc = /customer-support|sales-support/.test(channelTitle.toLowerCase())
    ? 'A place to triage inbound service cases'
    : undefined
  const dmTitle = selectedDm ?? 'Slackbot'
  const isDmActive = !!selectedDm

  return (
    <>
      {/* Left: Channel pane - smaller when DM is active */}
      <div className={`flex flex-col min-w-0 border-r bg-white ${isDmActive ? 'w-[320px] flex-shrink-0' : 'flex-1'}`} style={{ borderColor: 'var(--slack-border)' }}>
        <ChannelHeader title={channelTitle} description={channelDesc} />
        <div className="flex-1 overflow-y-auto min-h-0" style={{ backgroundColor: 'var(--slack-main-bg)' }}>
          {channelMsgs.map((msg) => (
            <SlackMessage key={msg.id} author={msg.author} text={msg.text} timestamp={msg.timestamp} />
          ))}
        </div>
        <MessageInput placeholder={`Message ${channelTitle}`} />
      </div>

      {/* Right: DM pane - primary when DM is active */}
      <div className={`flex-shrink-0 flex flex-col bg-white ${isDmActive ? 'flex-1 min-w-0' : 'w-[400px]'}`} style={{ borderColor: 'var(--slack-border)' }}>
        <DmHeader title={dmTitle} />
        <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: 'var(--slack-pane-bg)' }}>
          {dmMessages.length > 0 ? (
            dmMessages.map((msg) => (
              <SlackMessage key={msg.id} author={msg.author} text={msg.text} timestamp={msg.timestamp} isApp={msg.isApp} />
            ))
          ) : showSlackbotGreeting ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <img
                src="/assets/slackbot-icon.png"
                alt="Slackbot"
                className="w-24 h-24 rounded-2xl object-cover mb-4"
              />
              <p className="font-bold text-[22px] text-[var(--slack-text)] mb-1">Good morning!</p>
              <p className="text-[14px]" style={{ color: 'var(--slack-msg-text)' }}>
                The lights different now, but the channels haven&apos;t noticed
              </p>
            </div>
          ) : null}
        </div>
        <MessageInput placeholder={`Message ${dmTitle}`} />
      </div>
    </>
  )
}
