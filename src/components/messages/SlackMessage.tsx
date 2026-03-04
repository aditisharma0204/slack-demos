interface SlackMessageProps {
  author: string
  avatar?: string
  text?: string
  timestamp?: string
  isApp?: boolean
  children?: React.ReactNode
}

export function SlackMessage({
  author,
  avatar,
  text,
  timestamp = '10:30 AM',
  children,
}: SlackMessageProps) {
  const initials = author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="slack-message flex gap-3 py-2 px-4 hover:bg-[var(--slack-msg-hover)]">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--slack-avatar-bg)] flex items-center justify-center text-[13px] font-medium text-[var(--slack-avatar-text)] overflow-hidden">
        {avatar ? (
          <img src={avatar} alt={author} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-[var(--slack-msg-author)] text-[13px]">
            {author}
          </span>
          <span className="text-[11px] text-[var(--slack-msg-muted)]">
            {timestamp}
          </span>
        </div>
        {text && (
          <div className="text-[var(--slack-msg-text)] text-[13px] whitespace-pre-wrap break-words mt-0.5 leading-relaxed">
            {text.split(/(@\w+)/g).map((part, i) =>
              part.startsWith('@') ? (
                <span key={i} className="text-[var(--slack-mention)] font-medium">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
