import { Link, useParams } from 'react-router-dom'
import { getStory, getPersonaConfigs } from '@/stories'
import type { Persona } from '@/types'

export function DemoLandingPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const story = storyId ? getStory(storyId) : undefined
  const personaConfigs = storyId ? getPersonaConfigs(storyId) : []

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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--slack-main-bg)' }}
    >
      <header
        className="flex-shrink-0 px-6 py-6 border-b"
        style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
      >
        <Link
          to="/"
          className="text-sm font-medium mb-4 inline-block"
          style={{ color: 'var(--slack-msg-muted)' }}
        >
          ← Back to demos
        </Link>
        <h1 className="font-bold text-[22px]" style={{ color: 'var(--slack-text)' }}>
          {story.title}
        </h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--slack-msg-muted)' }}>
          by {story.createdBy} • {story.workspaceName ?? 'Acme Inc'}
        </p>
      </header>

      <main className="flex-1 p-6">
        <p className="text-[14px] mb-6" style={{ color: 'var(--slack-msg-muted)' }}>
          Choose a persona to experience this demo from their perspective:
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          {userPersonas.map((persona) => {
            const config = configsByPersona.get(persona.id)
            return (
              <PersonaCard
                key={persona.id}
                persona={persona}
                config={config}
                storyId={story.id}
              />
            )
          })}
        </div>
      </main>
    </div>
  )
}

function PersonaCard({
  persona,
  config,
  storyId,
}: {
  persona: Persona
  config?: { title: string; description: string }
  storyId: string
}) {
  const title = config?.title ?? persona.name
  const description = config?.description ?? persona.role

  return (
    <Link
      to={`/demo/${storyId}/${persona.id}`}
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
