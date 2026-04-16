import { StoryBuilder } from '@/builder/StoryBuilder'

const pageStyle = { backgroundColor: 'var(--slack-msg-hover)' }
const headerStyle = { backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }
const textStyle = { color: 'var(--slack-text)' }

export function BuilderPage() {
  return (
    <div className="min-h-screen flex flex-col" style={pageStyle}>
      <header className="sticky top-0 z-20 flex-shrink-0 px-6 py-4 border-b" style={{ ...headerStyle, width: '100%' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4" style={{ width: '100%', justifyContent: 'flex-start' }}>
          <h1 className="font-black text-xl" style={{ ...textStyle, fontSize: '60px', paddingTop: '60px', paddingBottom: '60px' }}>
            Story Builder
          </h1>
        </div>
      </header>
      <StoryBuilder />
    </div>
  )
}
