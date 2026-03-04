import { useParams, useNavigate } from 'react-router-dom'
import { getStory, getPersonaConfig } from '@/stories'
import { StoryEngine } from '@/engine/StoryEngine'
import { DemoLandingPage } from './DemoLandingPage'

export function DemoPage() {
  const { storyId, personaId } = useParams<{ storyId: string; personaId?: string }>()
  const navigate = useNavigate()
  const story = storyId ? getStory(storyId) : undefined
  const personaConfig = storyId && personaId ? getPersonaConfig(storyId, personaId) : undefined

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--slack-main-bg)]">
        <p className="text-[var(--slack-msg-muted)]">Story not found</p>
      </div>
    )
  }

  // No personaId = landing page (persona picker)
  if (!personaId) {
    return <DemoLandingPage />
  }

  // PersonaId but no config = invalid; redirect to landing
  if (!personaConfig) {
    navigate(`/demo/${storyId}`, { replace: true })
    return null
  }

  const onPersonaChange = (newPersonaId: string | null) => {
    if (newPersonaId) {
      navigate(`/demo/${storyId}/${newPersonaId}`)
    } else {
      navigate(`/demo/${storyId}`)
    }
  }

  return (
    <StoryEngine
      story={story}
      personaConfig={personaConfig}
      onPersonaChange={onPersonaChange}
    />
  )
}
