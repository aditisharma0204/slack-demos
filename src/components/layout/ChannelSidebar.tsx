interface ChannelSidebarProps {
  workspaceName: string
  channels: string[]
  dms: string[]
  selectedChannel?: string
  selectedDm?: string
}

export function ChannelSidebar({
  workspaceName,
  channels,
  dms,
  selectedChannel,
  selectedDm,
}: ChannelSidebarProps) {
  const isSelected = (ch: string) => selectedChannel === ch
  const isDmSelected = (dm: string) => selectedDm === dm

  return (
    <aside
      className="slack-sidebar w-64 flex-shrink-0 flex flex-col"
      style={{ backgroundColor: 'var(--slack-sidebar-bg)' }}
    >
      {/* Workspace header */}
      <div className="px-3 py-3 flex items-center gap-2 border-b flex-shrink-0" style={{ borderColor: 'var(--slack-sidebar-border)' }}>
        <div
          className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--slack-workspace-yellow)' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--slack-sidebar-bg)' }} />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <span className="font-semibold text-[15px] text-white truncate">{workspaceName}</span>
          <svg className="w-4 h-4 text-white/70 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 min-h-0">
        <div className="px-2 space-y-0.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded text-[13px] text-white hover:bg-white/10 cursor-pointer">
            Unreads
            <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-medium px-1">1</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded text-[13px] text-white hover:bg-white/10 cursor-pointer">
            Threads
            <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-medium px-1">4</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded text-[13px] text-white hover:bg-white/10 cursor-pointer">
            Drafts & sent
            <span className="ml-auto flex gap-1">
              <span className="min-w-[18px] h-[18px] rounded bg-red-500 text-[10px] flex items-center justify-center text-white font-medium px-1">3</span>
              <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-medium px-1">1</span>
            </span>
          </div>
        </div>

        {/* Starred */}
        <div className="px-2 mt-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--slack-sidebar-muted)' }}>
              Starred
            </span>
            <svg className="w-4 h-4 cursor-pointer" style={{ color: 'var(--slack-sidebar-muted)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          {['#announcements', '#general', '#helpdesk', '#marketing', '#hiring'].map((ch) => (
            <div key={ch} className="flex items-center gap-2 px-3 py-2 rounded text-[13px] text-white hover:bg-white/10 cursor-pointer">
              # {ch.replace(/^#/, '')}
            </div>
          ))}
        </div>

        {/* Channels */}
        <div className="px-2 mt-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--slack-sidebar-muted)' }}>
              Channels
            </span>
            <svg className="w-4 h-4 cursor-pointer" style={{ color: 'var(--slack-sidebar-muted)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          {(channels.length > 0 ? channels : ['#q3-priorities', '#Project 2', '#project 1']).map((ch) => {
            const selected = isSelected(ch)
            const name = ch.replace(/^#/, '')
            return (
              <div
                key={ch}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-[13px] ${
                  selected ? 'bg-white/15 text-white' : 'text-white hover:bg-white/10'
                }`}
              >
                <span>#</span>
                {name}
              </div>
            )
          })}
        </div>

        {/* Direct messages */}
        <div className="px-2 mt-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--slack-sidebar-muted)' }}>
              Direct messages
            </span>
            <svg className="w-4 h-4 cursor-pointer" style={{ color: 'var(--slack-sidebar-muted)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          {(dms.length > 0 ? dms : ['Lee Hao, Lisa Dawson', 'Slackbot', 'Claude', 'Sales Agent']).map((dm) => {
            const selected = isDmSelected(dm)
            return (
              <div
                key={dm}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-[13px] ${
                  selected ? 'bg-white/15 text-white' : 'text-white hover:bg-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                {dm}
                {dm === 'Slackbot' && (
                  <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-medium px-1">3</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Apps */}
        <div className="px-2 mt-4 pb-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--slack-sidebar-muted)' }}>
              Apps
            </span>
            <svg className="w-4 h-4 cursor-pointer" style={{ color: 'var(--slack-sidebar-muted)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </nav>

      {/* Bottom: Add button */}
      <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: 'var(--slack-sidebar-border)' }}>
        <button className="w-8 h-8 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 text-lg font-light">
          +
        </button>
      </div>
    </aside>
  )
}
