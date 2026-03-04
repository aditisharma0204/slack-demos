export function ThinkingIndicator() {
  return (
    <div className="slack-message flex gap-3 py-1 px-4">
      <img
        src="/assets/slackbot-icon.png"
        alt="Slackbot"
        className="flex-shrink-0 w-9 h-9 rounded-lg object-cover"
      />
      <div className="py-2">
        <span className="text-[13px]" style={{ color: 'var(--slack-msg-muted)' }}>Thinking...</span>
      </div>
    </div>
  )
}
