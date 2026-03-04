import { useParams, useNavigate } from 'react-router-dom'
import { getStory, getPersonaConfig } from '@/stories'
import { StoryEngine, FULL_STORY_PERSONA_ID } from '@/engine/StoryEngine'
import { DemoLandingPage } from './DemoLandingPage'

export function DemoPage() {
  const { storyId, personaId } = useParams<{ storyId: string; personaId?: string }>()
  const navigate = useNavigate()
  const story = storyId ? getStory(storyId) : undefined
  const isFullStoryMode = personaId === FULL_STORY_PERSONA_ID
  const personaConfig =
    storyId && personaId && !isFullStoryMode
      ? getPersonaConfig(storyId, personaId)
      : undefined

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

  // PersonaId but no config and not full story = invalid; redirect to landing
  if (!isFullStoryMode && !personaConfig) {
    navigate(`/demo/${storyId}`, { replace: true })
    return null
  }

  const onPersonaChange = (newPersonaId: string | null) => {
    if (newPersonaId === FULL_STORY_PERSONA_ID) {
      navigate(`/demo/${storyId}/${FULL_STORY_PERSONA_ID}`)
    } else if (newPersonaId) {
      navigate(`/demo/${storyId}/${newPersonaId}`)
    } else {
      navigate(`/demo/${storyId}`)
    }
  }

  return (
    <StoryEngine
      story={story}
      personaConfig={isFullStoryMode ? undefined : personaConfig}
      onPersonaChange={onPersonaChange}
      fullStoryMode={isFullStoryMode}
    />
  )
}
