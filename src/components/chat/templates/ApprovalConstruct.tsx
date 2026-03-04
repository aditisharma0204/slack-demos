import type { TemplateRenderProps } from './types'
import { registerTemplateComponent } from '@/extensions/slackResponseTemplateRegistry'
import { formatMessageWithMentions } from '@/components/chat/formatMessageWithMentions'

/**
 * Approval card construct for Slackbot messages (e.g. approval requests, status).
 * Card with white bg, light border, 12px radius; header with title and status.
 */
function ApprovalConstruct({ content }: TemplateRenderProps) {
  const title = (content.approvalTitle as string) ?? 'Approval'
  const status = content.approvalStatus as string | undefined
  const introText = content.text as string | undefined
  const personaNames = (content.personaNames as string[] | undefined) ?? []
  const borderColor = 'rgba(94, 93, 96, 0.13)'

  return (
    <div className="mt-1">
      {introText && (
        <p
          className="font-normal text-[15px] leading-[22px] break-words whitespace-pre-wrap mb-2"
          style={{ color: '#1d1c1d' }}
        >
          {formatMessageWithMentions(introText, personaNames)}
        </p>
      )}
      <div
        className="overflow-hidden rounded-[12px] border border-solid bg-white"
        style={{ borderColor, backgroundColor: '#ffffff' }}
      >
        <div
          className="flex gap-3 items-center p-3 border-b border-solid"
          style={{ borderColor }}
        >
          <p
            className="flex-1 min-w-0 font-bold text-[15px] leading-[22px] truncate"
            style={{ color: '#1d1c1d' }}
          >
            {title}
          </p>
          {status && (
            <span
              className="shrink-0 px-2.5 py-1 rounded-md text-[12px] font-semibold"
              style={{
                backgroundColor: 'rgba(94, 93, 96, 0.12)',
                color: '#1d1c1d',
              }}
            >
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

registerTemplateComponent('construct_approval', ApprovalConstruct)
export { ApprovalConstruct }
