import { ChatHeader } from '@/components/chat/ChatHeader'
import { PrimaryLinkLarge, SecondaryLinkLarge } from '@/components/ui/DesignSystemButtons'

const pageStyle = { backgroundColor: 'var(--slack-msg-hover)' }
const textStyle = { color: 'var(--slack-text)' }
const mutedStyle = { color: 'var(--slack-msg-muted)' }

/** Wraps a view (header + body) so it looks like the demo pane. Use point-and-click in Cursor on the header to edit ChatHeader.tsx. */
function ViewPane({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden bg-white flex-1 min-w-0"
      style={{
        borderColor: 'var(--slack-border)',
        minHeight: 320,
      }}
      data-view-headers-pane={label}
    >
      <div
        className="px-3 py-1.5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--slack-border)', backgroundColor: 'var(--slack-msg-hover)' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={mutedStyle}>
          {label}
        </span>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}

export function ViewHeadersDesignPage() {
  return (
    <div className="min-h-screen flex flex-col" style={pageStyle}>
      <header className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--slack-border)', backgroundColor: 'var(--slack-pane-bg)' }}>
        <div className="max-w-5xl mx-auto flex flex-wrap gap-4 items-center">
          <SecondaryLinkLarge to="/">Home</SecondaryLinkLarge>
          <PrimaryLinkLarge to="/canvas">Create new story</PrimaryLinkLarge>
          <SecondaryLinkLarge to="/reference">Instructions</SecondaryLinkLarge>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-6 flex flex-col min-h-[400px]">
        <div className="mb-4 flex-shrink-0">
          <h1 className="font-black text-2xl mb-1" style={textStyle}>
            View headers: Channel & Thread
          </h1>
          <p className="text-sm mb-1" style={mutedStyle}>
            Channel and Thread views side by side. Edit headers in <code className="px-1 rounded bg-white border text-xs" style={{ borderColor: 'var(--slack-border)' }}>src/components/chat/ChatHeader.tsx</code>—changes apply to all demos. Use Cursor&apos;s point-and-click on the headers to jump to the source.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-[360px]">
          <ViewPane label="Channel view">
            <ChatHeader viewType="channel" title="#hr-relocation-leads" />
            <div
              className="flex-1 min-h-[120px] px-4 py-3 border-t"
              style={{ borderColor: 'var(--slack-border)', backgroundColor: '#ffffff' }}
              aria-hidden
            >
              <p className="text-xs" style={mutedStyle}>
                Message area (header above is the Channel header from ChatHeader.tsx)
              </p>
            </div>
          </ViewPane>

          <ViewPane label="Thread view">
            <ChatHeader viewType="thread" title="Thread" threadParentPreview="New Relocation Request: Case #9912" />
            <div
              className="flex-1 min-h-[120px] px-4 py-3 border-t"
              style={{ borderColor: 'var(--slack-border)', backgroundColor: '#ffffff' }}
              aria-hidden
            >
              <p className="text-xs" style={mutedStyle}>
                Message area (header above is the Thread header from ChatHeader.tsx)
              </p>
            </div>
          </ViewPane>
        </div>

        <div className="mt-6 flex-shrink-0 rounded-xl border p-4 bg-white" style={{ borderColor: 'var(--slack-border)' }}>
          <h2 className="font-semibold text-sm mb-2" style={textStyle}>
            Slackbot view (reference)
          </h2>
          <ChatHeader viewType="slackbot" title="Slackbot" />
        </div>
      </main>
    </div>
  )
}
