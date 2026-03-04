import type { TemplateRenderProps } from './types'
import { registerTemplateComponent } from '@/extensions/slackResponseTemplateRegistry'

function ThinkingWithStatusTemplate({ content, config }: TemplateRenderProps) {
  const defaultLabel = (config.defaultLabel as string) ?? 'Thinking...'
  const statusText = (content.statusText as string) ?? defaultLabel
  return (
    <div className="py-2">
      <span className="text-[15px]" style={{ color: 'var(--slack-msg-muted)' }}>
        {statusText}
      </span>
    </div>
  )
}

registerTemplateComponent('thinking_with_status', ThinkingWithStatusTemplate)
export { ThinkingWithStatusTemplate }
