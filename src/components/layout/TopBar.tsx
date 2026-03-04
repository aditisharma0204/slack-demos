interface TopBarProps {
  searchPlaceholder?: string
}

export function TopBar({ searchPlaceholder = 'Search Acme Inc' }: TopBarProps) {
  return (
    <header
      className="slack-topbar flex-shrink-0 h-11 flex items-center gap-3 px-4"
      style={{ backgroundColor: 'var(--slack-topbar-bg)' }}
    >
      {/* Search - left aligned */}
      <div
        className="flex items-center gap-2 flex-1 max-w-md rounded px-3 py-2"
        style={{ backgroundColor: 'var(--slack-search-bg)' }}
      >
        <svg className="w-4 h-4 text-white/70 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="flex-1 bg-transparent text-[13px] text-white placeholder-white/70 outline-none min-w-0"
        />
      </div>

      {/* Right: Notifications / user */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded flex items-center justify-center text-white/80 text-[11px] font-medium bg-white/10">
          4
        </div>
        <div className="w-8 h-8 rounded flex items-center justify-center text-white/80 text-[11px] font-medium bg-white/10">
          5
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium text-white flex-shrink-0"
          style={{ backgroundColor: 'var(--slack-avatar-bg)' }}
        >
          S
        </div>
      </div>
    </header>
  )
}
