import type { TemplateRenderProps } from './types'
import { registerTemplateComponent } from '@/extensions/slackResponseTemplateRegistry'

function ThinkingIndicatorTemplate(_props: TemplateRenderProps) {
  return (
    <div className="py-2">
      <p className="text-[15px] leading-[22px] italic" style={{ color: 'var(--slack-text)' }}>
        Thinking...
      </p>
    </div>
  )
}

registerTemplateComponent('thinking', ThinkingIndicatorTemplate)
export { ThinkingIndicatorTemplate }
