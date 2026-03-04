import type { TemplateRenderProps } from './types'
import { registerTemplateComponent } from '@/extensions/slackResponseTemplateRegistry'
import { formatMessageWithMentions } from '@/components/chat/formatMessageWithMentions'

function PlainTextMessage({ content }: TemplateRenderProps) {
  const personaNames = (content.personaNames as string[] | undefined) ?? []
  return (
    <>
      {content.text && (
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--slack-text)' }}>
          {formatMessageWithMentions(content.text, personaNames)}
        </div>
      )}
    </>
  )
}

registerTemplateComponent('plain_text', PlainTextMessage)
export { PlainTextMessage }
