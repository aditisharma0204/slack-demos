import type { TemplateRenderProps } from './types'
import { registerTemplateComponent } from '@/extensions/slackResponseTemplateRegistry'
import { SecondaryButton } from '@/components/ui/DesignSystemButtons'
import { formatMessageWithMentions } from '@/components/chat/formatMessageWithMentions'

interface TextWithButtonsMessageProps extends TemplateRenderProps {
  onChoiceClick?: (choice: string) => void
}

function TextWithButtonsMessage({ content, onChoiceClick }: TextWithButtonsMessageProps) {
  const personaNames = (content.personaNames as string[] | undefined) ?? []
  return (
    <>
      {content.text && (
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--slack-text)' }}>
          {formatMessageWithMentions(content.text, personaNames)}
        </div>
      )}
      {content.choices && content.choices.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 items-center">
          {content.choices.map((choice) => (
            <SecondaryButton
              key={choice}
              onClick={() => onChoiceClick?.(choice)}
              className="whitespace-nowrap"
            >
              {choice}
            </SecondaryButton>
          ))}
        </div>
      )}
    </>
  )
}

registerTemplateComponent('text_with_buttons', TextWithButtonsMessage)
export { TextWithButtonsMessage }
