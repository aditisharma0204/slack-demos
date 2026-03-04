import { useState, useEffect } from 'react'
import {
  getAllTemplates,
  getTemplateComponent,
  type SlackResponseTemplate,
} from '@/extensions/slackResponseTemplateRegistry'
import { PrimaryLinkLarge, SecondaryLinkLarge } from '@/components/ui/DesignSystemButtons'

export function SlackbotTemplatesPage() {
  const [templates, setTemplates] = useState<SlackResponseTemplate[]>([])

  const loadTemplates = () => setTemplates(getAllTemplates())
  useEffect(() => { loadTemplates() }, [])

  const pageStyle = { backgroundColor: 'var(--slack-msg-hover)' }
  const mutedStyle = { color: 'var(--slack-msg-muted)' }
  const textStyle = { color: 'var(--slack-text)' }

  return (
    <div className="min-h-screen flex flex-col" style={pageStyle}>
      <header className="px-6 lg:px-12 py-6 border-b" style={{ borderColor: 'var(--slack-border)', backgroundColor: 'var(--slack-pane-bg)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 justify-center sm:justify-start flex-wrap items-center">
          <SecondaryLinkLarge to="/">Home</SecondaryLinkLarge>
          <PrimaryLinkLarge to="/canvas">Create new story</PrimaryLinkLarge>
          <SecondaryLinkLarge to="/reference">Instructions</SecondaryLinkLarge>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full py-6 px-6">
        <h1 className="font-black text-xl mb-6" style={{ ...textStyle, fontSize: '60px', paddingTop: 0, paddingBottom: 0 }}>
          Slackbot templates
        </h1>
        <p className="text-sm mb-6" style={mutedStyle}>
          All Slackbot replies in demos use only these templates. Edit labels and options here; changes will reflect in every demo.
        </p>
        <div className="space-y-4">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </main>
    </div>
  )
}

function TemplateCard({ template }: { template: SlackResponseTemplate }) {
  const Component = getTemplateComponent(template.type)
  const sampleContent = getSampleContent(template.type)
  return (
    <div
      className="rounded-lg border p-4 flex flex-wrap gap-4 items-start justify-between"
      style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold" style={{ color: 'var(--slack-text)' }}>{template.name}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}>
            {template.id}
          </span>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--slack-msg-muted)' }}>{template.description}</p>
        {Component && (
          <div className="rounded border p-3 mt-2" style={{ borderColor: 'var(--slack-border)', backgroundColor: 'var(--slack-main-bg)' }}>
            <span className="text-xs font-medium block mb-2" style={{ color: 'var(--slack-msg-muted)' }}>Preview</span>
            <Component content={sampleContent} config={template.config} />
          </div>
        )}
      </div>
    </div>
  )
}

function getSampleContent(type: string): Record<string, unknown> {
  switch (type) {
    case 'plain_text':
      return { text: 'Sample reply text.' }
    case 'text_with_buttons':
      return { text: 'Choose an option:', choices: ['Option A', 'Option B'] }
    case 'thinking':
    case 'thinking_with_status':
      return { statusText: 'Looking into Slack history...' }
    case 'construct_case':
      return {
        caseTitle: 'Case #123',
        caseStatus: 'Open',
        caseFields: [
          { label: 'Status', value: 'Open' },
          { label: 'Priority', value: 'High' },
        ],
        choices: ['Claim Case', 'View Full Assessment'],
      }
    default:
      return { text: 'Sample' }
  }
}
