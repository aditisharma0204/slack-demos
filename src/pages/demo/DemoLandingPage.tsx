import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useSharedDemoMode } from '@/hooks/useSharedDemoMode'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getStory, getPersonaConfigs, getStoryMarkdown } from '@/stories'
import type { Persona } from '@/types'

export function DemoLandingPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const { search } = useLocation()
  const isShared = useSharedDemoMode()
  const story = storyId ? getStory(storyId) : undefined
  const personaConfigs = storyId ? getPersonaConfigs(storyId) : []
  const storyMarkdown = storyId ? getStoryMarkdown(storyId) : undefined

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--slack-main-bg)]">
        <p className="text-[var(--slack-msg-muted)]">Story not found</p>
      </div>
    )
  }

  // Only user personas get their own prototype; app personas (e.g. Slackbot) assist
  const userPersonas = story.personas.filter((p) => p.type === 'user')
  const configsByPersona = new Map(personaConfigs.map((c) => [c.personaId, c]))

  const goToEditAndRegenerate = () => {
    navigate('/canvas', {
      state: { initialStory: storyMarkdown ?? '', demoId: story.id, demoTitle: story.title },
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--slack-main-bg)' }}
    >
      <header
        className="flex-shrink-0 px-6 py-4 border-b flex items-center justify-between"
        style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
      >
        {isShared ? (
          <span className="font-semibold text-[15px]" style={{ color: 'var(--slack-text)' }}>
            {story.title}
          </span>
        ) : (
          <Link
            to="/"
            className="font-semibold text-[15px] hover:underline focus:outline-none focus:underline"
            style={{ color: 'var(--slack-text)' }}
          >
            ← Back
          </Link>
        )}
        {!isShared && (
          <button
            type="button"
            onClick={goToEditAndRegenerate}
            className="px-3 py-1.5 rounded text-sm font-medium transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--slack-btn-default-bg)',
              color: 'var(--slack-btn-default-text)',
            }}
          >
            Edit story
          </button>
        )}
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 min-h-0 min-w-0">
        {/* Story: 8 of 12 columns */}
        <section
          className="col-span-12 lg:col-span-8 flex flex-col min-h-0 min-w-0 rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--slack-pane-bg)',
            borderColor: 'var(--slack-border)',
          }}
        >
          <div
            className="flex-1 overflow-y-auto px-4 py-4 text-[14px] leading-relaxed [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:my-2 [&_table]:w-full [&_th]:text-left [&_td]:p-2 [&_a]:text-[var(--slack-mention)] [&_a]:font-semibold"
            style={{ color: 'var(--slack-text)' }}
          >
            {storyMarkdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{storyMarkdown}</ReactMarkdown>
            ) : (
              <p style={{ color: 'var(--slack-msg-muted)' }}>No story content for this demo.</p>
            )}
          </div>
        </section>

        {/* Personas: 4 of 12 columns */}
        <section className="col-span-12 lg:col-span-4 flex flex-col min-h-0 min-w-0 overflow-y-auto">
          <p className="text-[14px] mb-4" style={{ color: 'var(--slack-msg-muted)' }}>
            Run the full story step-by-step, or choose a persona to see only their part:
          </p>
          <div className="flex flex-col gap-4">
            <Link
              to={{ pathname: `/demo/${storyId}/full`, search }}
              className="block p-6 rounded-lg border transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{
                backgroundColor: 'var(--slack-pane-bg)',
                borderColor: 'var(--slack-border)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                  style={{ backgroundColor: 'var(--slack-avatar-bg)' }}
                >
                  📖
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-[16px]" style={{ color: 'var(--slack-text)' }}>
                    Full story (step-by-step)
                  </h2>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--slack-msg-muted)' }}>
                    Showcase
                  </p>
                  <p className="text-[13px] mt-2" style={{ color: 'var(--slack-msg-text)' }}>
                    Walk through every step in story order as in demo.json. Ideal for presenting the full narrative.
                  </p>
                </div>
              </div>
            </Link>
            {userPersonas.map((persona) => {
              const config = configsByPersona.get(persona.id)
              return (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  config={config}
                  storyId={story.id}
                  linkSearch={search}
                />
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

function PersonaCard({
  persona,
  config,
  storyId,
  linkSearch,
}: {
  persona: Persona
  config?: { title: string; description: string }
  storyId: string
  linkSearch: string
}) {
  const title = config?.title ?? persona.name
  const description = config?.description ?? persona.role

  return (
    <Link
      to={{ pathname: `/demo/${storyId}/${persona.id}`, search: linkSearch }}
      className="block p-6 rounded-lg border transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
      style={{
        backgroundColor: 'var(--slack-pane-bg)',
        borderColor: 'var(--slack-border)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
          style={{ backgroundColor: 'var(--slack-avatar-bg)' }}
        >
          {persona.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-[16px]" style={{ color: 'var(--slack-text)' }}>
            {title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--slack-msg-muted)' }}>
            {persona.designation}
          </p>
          <p className="text-[13px] mt-2" style={{ color: 'var(--slack-msg-text)' }}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}
