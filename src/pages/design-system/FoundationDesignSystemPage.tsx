import { PrimaryButtonLarge, SecondaryButton, DisabledButton, PrimaryLinkLarge, SecondaryLinkLarge } from '@/components/ui/DesignSystemButtons'

const COLOR_SWATCHES = [
  { name: 'Text primary', token: '--slack-text', value: '#1d1c1d' },
  { name: 'Text muted', token: '--slack-msg-muted', value: '#616061' },
  { name: 'Border', token: '--slack-border', value: '#e0e0e0' },
  { name: 'Background light', token: '--slack-msg-hover', value: '#f5f5f5' },
  { name: 'Background page', value: '#f8f8f8' },
  { name: 'White', value: '#ffffff' },
  { name: 'Primary / accent', token: '--slack-avatar-bg', value: '#611f69' },
  { name: 'Sidebar', token: '--slack-sidebar-bg', value: '#3F0E40' },
  { name: 'Mention link', token: '--slack-mention', value: '#1264a3' },
]

const pageStyle = { backgroundColor: 'unset', background: 'unset' }
const textStyle = { color: 'var(--slack-text)' }
const mutedStyle = { color: 'var(--slack-msg-muted)' }
const surfaceStyle = { backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }

export function FoundationDesignSystemPage() {
  return (
    <div className="min-h-screen flex flex-col" style={pageStyle}>
      <header className="px-6 lg:px-12 py-6 border-b" style={{ borderColor: 'var(--slack-border)', backgroundColor: 'var(--slack-pane-bg)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 justify-center sm:justify-start flex-wrap items-center">
          <SecondaryLinkLarge to="/">Home</SecondaryLinkLarge>
          <PrimaryLinkLarge to="/canvas">Create new story</PrimaryLinkLarge>
          <SecondaryLinkLarge to="/reference">Instructions</SecondaryLinkLarge>
          <SecondaryLinkLarge to="/view-headers">View headers (Channel &amp; Thread)</SecondaryLinkLarge>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-12">
        <div className="max-w-4xl mx-auto flex items-center gap-4" style={{ width: '100%', justifyContent: 'flex-start' }}>
          <h1 className="font-black text-xl" style={{ ...textStyle, fontSize: '60px', paddingTop: '0px', paddingBottom: '0px' }}>
            Foundation design system
          </h1>
        </div>
        <p className="text-sm" style={mutedStyle}>
          Foundational UI components and tokens used across this project.
        </p>

        {/* Colors */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>Colors</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLOR_SWATCHES.map((c) => (
              <div
                key={c.value}
                className="rounded-lg border overflow-hidden"
                style={surfaceStyle}
              >
                <div className="h-16 w-full" style={{ backgroundColor: c.value }} />
                <div className="p-3">
                  <div className="font-medium text-sm" style={textStyle}>{c.name}</div>
                  <div className="text-xs font-mono" style={mutedStyle}>{c.value}</div>
                  {c.token && (
                    <div className="text-xs font-mono mt-1" style={mutedStyle}>{c.token}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>Typography</h2>
          <div className="rounded-lg border p-6 space-y-4" style={surfaceStyle}>
            <p className="text-xs" style={mutedStyle}>Font family: Lato, system fallbacks</p>
            <div>
              <span className="text-xs font-medium block mb-1" style={mutedStyle}>11px (xs)</span>
              <p className="text-[11px]" style={textStyle}>Caption and metadata</p>
            </div>
            <div>
              <span className="text-xs font-medium block mb-1" style={mutedStyle}>13px (sm)</span>
              <p className="text-[13px]" style={textStyle}>Secondary text and labels</p>
            </div>
            <div>
              <span className="text-xs font-medium block mb-1" style={mutedStyle}>15px (base)</span>
              <p className="text-[15px]" style={textStyle}>Body and message text</p>
            </div>
            <div>
              <span className="text-xs font-medium block mb-1" style={mutedStyle}>18px (lg)</span>
              <p className="text-[18px] font-bold" style={textStyle}>Headings</p>
            </div>
          </div>
        </section>

        {/* Buttons - shared components so changes apply everywhere */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>Buttons</h2>
          <div className="rounded-lg border p-6 flex flex-wrap gap-4 items-center" style={surfaceStyle}>
            <PrimaryButtonLarge>Primary</PrimaryButtonLarge>
            <SecondaryButton className="whitespace-nowrap">Secondary</SecondaryButton>
            <DisabledButton>Disabled</DisabledButton>
            <button
              type="button"
              className="link-button text-[13px] leading-relaxed font-semibold"
            >
              Link button
            </button>
          </div>
          <p className="text-sm mt-2" style={mutedStyle}>
            <strong>Secondary</strong> (<code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>SecondaryButton</code>) — 36px height, 13px text, 1px border, rounded-lg. Used for chat choices (e.g. Claim Case, Option A). Tokens: <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>--slack-btn-bg</code>, <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>--slack-btn-border</code>, <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>--slack-btn-hover-bg</code>, <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>--slack-text</code>.
          </p>
        </section>

        {/* Text link / mention (persona names as in formatMessageWithMentions) */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>Text link (mention)</h2>
          <div className="rounded-lg border p-6 flex flex-wrap gap-4 items-center" style={surfaceStyle}>
            <p className="text-[15px] leading-relaxed" style={textStyle}>
              Message from{' '}
              <span style={{ color: 'var(--slack-mention)' }}>@Alex Kim</span>
              {' '}and{' '}
              <span style={{ color: 'var(--slack-mention)' }}>@Sarah Chen</span>
              . Use <code className="px-1 py-0.5 rounded text-[13px]" style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}>formatMessageWithMentions</code> with <code className="px-1 py-0.5 rounded text-[13px]" style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}>var(--slack-mention)</code>.
            </p>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>Inputs</h2>
          <div className="rounded-lg border p-6 space-y-4" style={surfaceStyle}>
            <div>
              <label className="block text-xs font-semibold mb-1" style={mutedStyle}>Text input</label>
              <input
                type="text"
                placeholder="Placeholder text"
                className="w-full max-w-md rounded px-2 py-2 text-sm border outline-none focus:ring-2 focus:ring-[var(--slack-avatar-bg)] focus:ring-offset-0"
                readOnly
                aria-readonly
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={mutedStyle}>Dropdown</label>
              <select
                className="w-full max-w-md rounded px-2 py-2 text-sm border outline-none mx-0"
                defaultValue=""
              >
                <option value="">Choose...</option>
                <option value="a">Option A</option>
                <option value="b">Option B</option>
              </select>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>Spacing</h2>
          <div className="rounded-lg border p-6 space-y-3" style={surfaceStyle}>
            {[4, 8, 12, 16, 24, 32].map((n) => (
              <div key={n} className="flex items-center gap-4">
                <span className="text-xs font-mono w-12" style={mutedStyle}>{n}px</span>
                <div className="h-6 rounded" style={{ width: n, backgroundColor: 'var(--slack-avatar-bg)', opacity: 0.6 }} />
              </div>
            ))}
          </div>
        </section>

        {/* Icons */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>Icons</h2>
          <p className="text-sm mb-3" style={mutedStyle}>
            Icons used in chat composer and UI (from <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>src/assets/icons/</code>).
          </p>
          <div className="rounded-lg border p-6 flex flex-wrap gap-4" style={surfaceStyle}>
            {['plus', 'send', 'at', 'smile', 'font', 'search', 'more', 'edit', 'close', 'caret-down'].map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 rounded text-xs font-mono"
                style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}
              >
                {name}.svg
              </span>
            ))}
          </div>
        </section>

        {/* Cards / surfaces */}
        <section>
          <h2 className="font-bold text-lg mb-4" style={textStyle}>Cards / surfaces</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="rounded-lg border p-6 transition hover:shadow-md"
              style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <h3 className="font-bold text-lg mb-1" style={textStyle}>Demo card</h3>
              <p className="text-sm" style={mutedStyle}>Used for demo links on the home page.</p>
            </div>
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--slack-main-bg)', borderColor: 'var(--slack-border)' }}
            >
              <h3 className="font-semibold text-sm mb-2" style={textStyle}>Template / construct card</h3>
              <p className="text-[13px]" style={mutedStyle}>Used for Case, Approval, Report constructs in Slackbot messages.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
