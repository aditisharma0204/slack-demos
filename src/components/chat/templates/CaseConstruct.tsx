import { useState } from 'react'
import type { TemplateRenderProps } from './types'
import { registerTemplateComponent } from '@/extensions/slackResponseTemplateRegistry'
import { PrimaryButton, SecondaryButton } from '@/components/ui/DesignSystemButtons'
import { formatMessageWithMentions } from '@/components/chat/formatMessageWithMentions'

interface CaseConstructProps extends TemplateRenderProps {
  onChoiceClick?: (choice: string) => void
}

/**
 * Case card construct matching the Figma "File card entity" design:
 * - Card with white bg, light border, 12px radius
 * - Header: title + subtitle (status), optional avatar; border-bottom separator
 * - Content: optional body copy, then 2-column grid of label/value pairs
 * - When content.choices is set (e.g. next step is user_action), renders CTAs below the card.
 */
function CaseConstruct({ content, config, onChoiceClick }: CaseConstructProps) {
  const titleLabel = (config.titleLabel as string) ?? 'Case'
  const title = content.caseTitle ?? (config.defaultTitle as string) ?? titleLabel
  const fields = (content.caseFields ?? []) as { label: string; value: string }[]
  const introText = content.text as string | undefined
  const status = content.caseStatus as string | undefined
  const [expanded, setExpanded] = useState(false)
  const expandableNote = content.caseNote as string | undefined
  const avatarUrl = content.caseAvatarUrl as string | undefined
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
        {/* Header: optional avatar + title, status tag on the right */}
        <div
          className="flex gap-3 items-center p-3 border-b border-solid"
          style={{ borderColor }}
        >
          {avatarUrl && (
            <div className="shrink-0 w-9 h-9 rounded-[9px] overflow-hidden">
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
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

        {/* Fields (Figma) */}
        <div className="flex flex-col gap-3 p-3">
          {fields.length > 0 && (
            <div className="flex flex-col gap-[17px]">
              {chunk(fields, 2).map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 items-start">
                  {row.map((f, i) => (
                    <div key={i} className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <p
                        className="font-normal text-[12px] leading-tight"
                        style={{ color: '#77757a' }}
                      >
                        {f.label}
                      </p>
                      <p
                        className="font-normal text-[15px] leading-[22px] break-words"
                        style={{ color: '#1d1c1d' }}
                      >
                        {f.value}
                      </p>
                    </div>
                  ))}
                  {row.length === 1 && <div className="flex-1 min-w-0" />}
                </div>
              ))}
            </div>
          )}

          {expandableNote && expanded && (
            <p
              className="pt-3 mt-1 border-t border-solid text-[13px]"
              style={{ borderColor, color: '#77757a' }}
            >
              {expandableNote}
            </p>
          )}
        </div>
      </div>

      {expandableNote && (
        <PrimaryButton
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2"
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'View details'}
        </PrimaryButton>
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
    </div>
  )
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

registerTemplateComponent('construct_case', CaseConstruct)
export { CaseConstruct }
