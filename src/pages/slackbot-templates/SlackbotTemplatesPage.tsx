import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getAllTemplates,
  getTemplateComponent,
  type SlackResponseTemplate,
} from '@/extensions/slackResponseTemplateRegistry'
import {
  NegativeButton,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui/DesignSystemButtons'
import { DesignSystemSelect } from '@/components/ui/DesignSystemSelect'
import { OAuthPermissionModal } from '@/components/demo/OAuthPermissionModal'
import {
  buildBulkImportReview,
  getSlackBlockTemplates,
  upsertSlackBlockTemplates,
  type SlackBlockTemplateDefinition,
  renderSlackTemplate,
} from '@/slackbot-templates'
import { meetingConflictFixture } from '@/slackbot-templates/fixtures/meetingConflict.fixture'

export function SlackbotTemplatesPage() {
  const [templates, setTemplates] = useState<SlackResponseTemplate[]>([])
  const [bulkImportInput, setBulkImportInput] = useState('')
  const [importReview, setImportReview] = useState<BulkImportReviewResult | null>(null)
  const [importAppliedSummary, setImportAppliedSummary] = useState<{ upserted: number; overwritten: number } | null>(null)
  const [blockKitRefreshKey, setBlockKitRefreshKey] = useState(0)
  const blockKitTemplates = getSlackBlockTemplates()

  const loadTemplates = () => setTemplates(getAllTemplates())
  useEffect(() => { loadTemplates() }, [])

  const pageStyle = { backgroundColor: 'var(--slack-msg-hover)' }
  const mutedStyle = { color: 'var(--slack-msg-muted)' }
  const textStyle = { color: 'var(--slack-text)' }
  const existingIds = new Set(buildUnifiedTemplates(templates, blockKitTemplates).map((item) => item.id))

  const handleImportAll = () => {
    const review = buildBulkImportReview(bulkImportInput, existingIds)
    setImportReview(review)
    setImportAppliedSummary(null)
  }

  const handleApplyImports = () => {
    if (!importReview || importReview.valid.length === 0) return
    const result = upsertSlackBlockTemplates(importReview.valid.map((candidate) => candidate.definition))
    setImportAppliedSummary({ upserted: result.upsertedIds.length, overwritten: result.overwrittenIds.length })
    setBlockKitRefreshKey((value) => value + 1)
    setImportReview(null)
    setBulkImportInput('')
  }

  return (
    <div className="min-h-screen flex flex-col" style={pageStyle}>
      <header
        className="flex-shrink-0 px-6 py-4 border-b flex items-center justify-between"
        style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
      >
        <Link
          to="/"
          className="font-semibold text-[15px] hover:underline focus:outline-none focus:underline"
          style={{ color: 'var(--slack-text)' }}
        >
          ← Back
        </Link>
        <Link
          to="/design-system"
          className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm font-semibold border transition hover:bg-[var(--slack-btn-hover-bg)]"
          style={{
            backgroundColor: 'var(--slack-btn-bg)',
            color: 'var(--slack-text)',
            borderColor: 'var(--slack-btn-secondary-border)',
          }}
        >
          Design system
        </Link>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full py-6 px-6">
        <h1 className="font-black text-xl mb-6" style={{ ...textStyle, fontSize: '60px', paddingTop: 0, paddingBottom: 0 }}>
          Slackbot templates
        </h1>
        <p className="text-sm mb-6" style={mutedStyle}>
          All Slackbot replies in demos use only these templates. Edit labels and options here; changes will reflect in every demo.
        </p>
        <BulkImportPanel
          input={bulkImportInput}
          review={importReview}
          appliedSummary={importAppliedSummary}
          onInputChange={setBulkImportInput}
          onImportAll={handleImportAll}
          onApplyImports={handleApplyImports}
        />
        <div className="space-y-4" key={blockKitRefreshKey}>
          {buildUnifiedTemplates(templates, blockKitTemplates).map((item) => (
            <TemplateCard key={item.id} template={item} />
          ))}
        </div>
      </main>
    </div>
  )
}

type UnifiedTemplate =
  | { kind: 'legacy'; id: string; template: SlackResponseTemplate }
  | {
      kind: 'blockkit'
      id: string
      template: SlackBlockTemplateDefinition
      blocks: unknown[]
      errors: string[]
    }

function buildUnifiedTemplates(
  legacyTemplates: SlackResponseTemplate[],
  blockKitTemplates: SlackBlockTemplateDefinition[]
): UnifiedTemplate[] {
  const merged = new Map<string, UnifiedTemplate>()

  for (const template of legacyTemplates) {
    merged.set(template.id, { kind: 'legacy', id: template.id, template })
  }

  for (const template of blockKitTemplates) {
    const fixture = getFixtureForBlockKitTemplate(template.id)
    const rendered = renderSlackTemplate(template.id, fixture, { strict: false, version: template.version })
    const fallbackBlocks = Array.isArray(template.blocksTemplate) ? template.blocksTemplate : []
    merged.set(template.id, {
      kind: 'blockkit',
      id: template.id,
      template,
      blocks: rendered.payload?.blocks ?? fallbackBlocks,
      errors: rendered.errors,
    })
  }

  return Array.from(merged.values())
}

function getFixtureForBlockKitTemplate(templateId: string): Record<string, unknown> {
  switch (templateId) {
    case 'meeting_conflict':
      return meetingConflictFixture
    default:
      return {}
  }
}

function TemplateCard({ template }: { template: UnifiedTemplate }) {
  if (template.kind === 'blockkit') {
    return (
      <BlockKitTemplateCard
        template={template.template}
        blocks={template.blocks}
        errors={template.errors}
      />
    )
  }

  const Component = getTemplateComponent(template.template.type)
  const sampleContent = getSampleContent(template.template.type)

  if (template.template.id === 'connect_oauth_card' && Component) {
    return (
      <div
        className="rounded-lg border p-4 flex flex-wrap gap-4 items-start justify-between"
        style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
      >
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold" style={{ color: 'var(--slack-text)' }}>{template.template.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}
              >
                {template.template.id}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--slack-msg-muted)' }}>{template.template.description}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--slack-text)' }}>
              Slack message (in-flow connect card)
            </h4>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--slack-msg-muted)' }}>
              How the template appears in chat when you use <code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>templateId: &quot;connect_oauth_card&quot;</code> on an{' '}
              <code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>app_message</code> (same layout as the live demo).
            </p>
            <div
              className="rounded border p-4 overflow-x-auto"
              style={{ borderColor: 'var(--slack-border)', backgroundColor: '#ffffff' }}
            >
              <SlackbotMessageRowPreview
                author="HR Service Agent"
                timestamp="Just now"
              >
                <Component content={sampleContent} config={template.template.config} />
              </SlackbotMessageRowPreview>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--slack-text)' }}>
              OAuth permission modal (after Allow Access)
            </h4>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--slack-msg-muted)' }}>
              Shown when the story chains <code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>user_action</code> →{' '}
              <code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>modal_open</code> with{' '}
              <code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>view: &quot;oauth-permission&quot;</code>. Buttons here are inert in this preview.
            </p>
            <div
              className="rounded border p-4 flex justify-center"
              style={{
                borderColor: 'var(--slack-border)',
                backgroundColor: 'var(--slack-main-bg)',
              }}
            >
              <OAuthPermissionModal
                embedded
                modalTitle="Sign in to Cornerstone with Slack"
                integrationName="Cornerstone"
                appName="HR Service Agent"
                onAllow={() => {}}
                onCancel={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border p-4 flex flex-wrap gap-4 items-start justify-between"
      style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold" style={{ color: 'var(--slack-text)' }}>{template.template.name}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}>
            {template.template.id}
          </span>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--slack-msg-muted)' }}>{template.template.description}</p>
        {Component && (
          <div className="rounded border p-3 mt-[8px]" style={{ borderColor: 'var(--slack-border)', backgroundColor: 'var(--slack-main-bg)' }}>
            <span className="text-xs font-medium block mb-2" style={{ color: 'var(--slack-msg-muted)' }}>Preview</span>
            <Component content={sampleContent} config={template.template.config} />
          </div>
        )}
      </div>
    </div>
  )
}

function BlockKitTemplateCard({
  template,
  blocks,
  errors,
}: {
  template: SlackBlockTemplateDefinition
  blocks: unknown[]
  errors: string[]
}) {
  return (
    <div
      className="rounded-lg border p-4 flex flex-wrap gap-4 items-start justify-between"
      style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold" style={{ color: 'var(--slack-text)' }}>{template.name}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-msg-muted)' }}>
            {template.id}@{template.version}
          </span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#e8f4ff', color: '#0b4f9c' }}>
            Block Kit
          </span>
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--slack-msg-muted)' }}>
          {template.description}
        </p>
        <p className="text-xs mb-3" style={{ color: 'var(--slack-msg-muted)' }}>
          Persona: {template.persona} · Story tags: {template.storyTags.join(', ')}
        </p>
        {errors.length > 0 && (
          <div className="rounded border p-2 mb-3" style={{ borderColor: '#f3c6c6', backgroundColor: '#fff5f5' }}>
            <span className="text-xs font-semibold block mb-1" style={{ color: '#9b1c1c' }}>
              Template validation warnings
            </span>
            {errors.map((error) => (
              <div key={error} className="text-xs" style={{ color: '#9b1c1c' }}>
                {error}
              </div>
            ))}
          </div>
        )}
        <div className="rounded border p-3 mt-[8px]" style={{ borderColor: 'var(--slack-border)', backgroundColor: '#ffffff' }}>
          <span className="text-xs font-medium block mb-2" style={{ color: 'var(--slack-msg-muted)' }}>Preview</span>
          <SlackbotMessageRowPreview author="Slackbot" timestamp="Just now">
            <BlockKitBlocksPreview blocks={blocks} />
          </SlackbotMessageRowPreview>
        </div>
      </div>
    </div>
  )
}

function BlockKitBlocksPreview({ blocks }: { blocks: unknown[] }) {
  return (
    <div className="w-full text-[15px] leading-[1.35]">
      {blocks.map((block, index) => (
        <BlockKitBlockRenderer key={index} block={block} />
      ))}
    </div>
  )
}

function BlockKitBlockRenderer({ block }: { block: unknown }) {
  if (!block || typeof block !== 'object') return null
  const typedBlock = block as Record<string, unknown>
  const type = typedBlock.type
  if (type === 'header') {
    const text = typedBlock.text as Record<string, unknown> | undefined
    const body = text && typeof text.text === 'string' ? text.text : ''
    return (
      <div className="text-[18px] font-bold leading-[1.25] mb-2" style={{ color: 'var(--slack-text)' }}>
        {body}
      </div>
    )
  }
  if (type === 'image') {
    const imageUrl = typeof typedBlock.image_url === 'string' ? typedBlock.image_url : ''
    const altText = typeof typedBlock.alt_text === 'string' ? typedBlock.alt_text : ''
    const title = typedBlock.title as Record<string, unknown> | undefined
    const titleText = title && typeof title.text === 'string' ? title.text : ''
    if (!imageUrl) return null
    return (
      <div className="mb-2.5">
        {titleText ? (
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--slack-msg-muted)' }}>
            {titleText}
          </div>
        ) : null}
        <img src={imageUrl} alt={altText} className="w-full max-w-[460px] rounded border object-cover" style={{ borderColor: 'var(--slack-border)' }} />
      </div>
    )
  }
  if (type === 'divider') {
    return <hr className="my-2.5 border-0 h-px" style={{ backgroundColor: 'var(--slack-border)' }} />
  }
  if (type === 'section') {
    const text = typedBlock.text as Record<string, unknown> | undefined
    const fields = Array.isArray(typedBlock.fields) ? (typedBlock.fields as unknown[]) : []
    const accessory = typedBlock.accessory as Record<string, unknown> | undefined
    return (
      <div className="flex items-start justify-between gap-4 mb-2.5">
        <div className="min-w-0 flex-1">
          {text ? <BlockKitText text={text} /> : null}
          {fields.length > 0 ? <BlockKitFields fields={fields} /> : null}
        </div>
        {accessory ? <BlockKitAccessory accessory={accessory} /> : null}
      </div>
    )
  }
  if (type === 'context') {
    const elements = (typedBlock.elements as unknown[]) ?? []
    return (
      <div className="flex items-center flex-wrap gap-2 mb-2.5">
        {elements.map((element, index) => (
          <BlockKitContextElement key={index} element={element} />
        ))}
      </div>
    )
  }
  if (type === 'actions') {
    const elements = Array.isArray(typedBlock.elements) ? (typedBlock.elements as unknown[]) : []
    return (
      <div className="flex items-center flex-wrap gap-2 mb-2.5">
        {elements.map((element, index) => (
          <BlockKitActionElement key={index} element={element} />
        ))}
      </div>
    )
  }
  return null
}

function BlockKitFields({ fields }: { fields: unknown[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-1">
      {fields.map((field, index) => {
        if (!field || typeof field !== 'object') return null
        const typedField = field as Record<string, unknown>
        const text = typeof typedField.text === 'string' ? typedField.text : ''
        return (
          <div
            key={index}
            className="text-[14px] leading-relaxed break-words [&_p]:m-0 [&_strong]:font-bold [&_em]:italic [&_a]:text-[var(--slack-mention)] [&_a]:font-semibold [&_a]:no-underline hover:[&_a]:underline"
            style={{ color: 'var(--slack-text)' }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {slackMrkdwnToMarkdown(text)}
            </ReactMarkdown>
          </div>
        )
      })}
    </div>
  )
}

function BlockKitText({ text }: { text?: Record<string, unknown> }) {
  if (!text) return null
  const body = typeof text.text === 'string' ? text.text : ''
  if (text.type === 'mrkdwn') {
    const markdown = slackMrkdwnToMarkdown(body)
    return (
      <div
        className="text-[15px] leading-[1.35] break-words [&_p]:m-0 [&_strong]:font-bold [&_em]:italic [&_a]:text-[var(--slack-mention)] [&_a]:font-semibold [&_a]:no-underline hover:[&_a]:underline"
        style={{ color: 'var(--slack-text)' }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    )
  }
  return (
    <div className="text-[15px] leading-[1.35] whitespace-pre-wrap break-words" style={{ color: 'var(--slack-text)' }}>
      {body}
    </div>
  )
}

function BlockKitAccessory({ accessory }: { accessory: Record<string, unknown> }) {
  if (accessory.type === 'image') {
    const imageUrl = typeof accessory.image_url === 'string' ? accessory.image_url : ''
    const altText = typeof accessory.alt_text === 'string' ? accessory.alt_text : ''
    if (!imageUrl) return null
    return (
      <img
        src={imageUrl}
        alt={altText}
        className="w-[136px] h-[102px] rounded-xl object-cover border flex-shrink-0"
        style={{ borderColor: 'var(--slack-border)' }}
      />
    )
  }
  if (accessory.type === 'button') {
    const text = accessory.text as Record<string, unknown> | undefined
    const label = text && typeof text.text === 'string' ? text.text : 'Button'
    return (
      <SecondaryButton className="font-medium">
        {label}
      </SecondaryButton>
    )
  }
  if (accessory.type === 'conversations_select' || accessory.type === 'static_select') {
    const placeholder = accessory.placeholder as Record<string, unknown> | undefined
    const placeholderText = placeholder && typeof placeholder.text === 'string' ? placeholder.text : 'Select'
    const options = Array.isArray(accessory.options) ? (accessory.options as unknown[]) : []

    return (
      <DesignSystemSelect
        className="h-9 min-w-[122px] w-auto max-w-none text-[13px] font-medium"
        defaultValue=""
      >
        <option value="">{placeholderText}</option>
        {options.map((option, index) => {
          if (!option || typeof option !== 'object') return null
          const typedOption = option as Record<string, unknown>
          const text = typedOption.text as Record<string, unknown> | undefined
          const label = text && typeof text.text === 'string' ? text.text : `Option ${index + 1}`
          const value = typeof typedOption.value === 'string' ? typedOption.value : `${index}`
          return (
            <option key={value} value={value}>
              {label}
            </option>
          )
        })}
      </DesignSystemSelect>
    )
  }
  if (accessory.type === 'overflow') {
    return (
      <SecondaryButton
        aria-label="More actions"
        className="w-12 px-0 text-[20px] leading-none font-medium"
      >
        …
      </SecondaryButton>
    )
  }
  return null
}

function BlockKitActionElement({ element }: { element: unknown }) {
  if (!element || typeof element !== 'object') return null
  const typedElement = element as Record<string, unknown>
  if (typedElement.type !== 'button') return null
  const text = typedElement.text as Record<string, unknown> | undefined
  const label = text && typeof text.text === 'string' ? text.text : 'Button'
  const style = typeof typedElement.style === 'string' ? typedElement.style : undefined
  const isPrimary = style === 'primary'
  const isDanger = style === 'danger'
  if (isPrimary) {
    return <PrimaryButton className="h-10 px-4 font-medium">{label}</PrimaryButton>
  }

  if (isDanger) {
    return <NegativeButton className="h-10 px-4 font-medium">{label}</NegativeButton>
  }

  return <SecondaryButton className="h-10 px-4 font-medium">{label}</SecondaryButton>
}

function BlockKitContextElement({ element }: { element: unknown }) {
  if (!element || typeof element !== 'object') return null
  const typedElement = element as Record<string, unknown>
  if (typedElement.type === 'image') {
    const imageUrl = typeof typedElement.image_url === 'string' ? typedElement.image_url : ''
    const altText = typeof typedElement.alt_text === 'string' ? typedElement.alt_text : ''
    if (!imageUrl) return null
    return <img src={imageUrl} alt={altText} className="w-4 h-4 rounded object-cover" />
  }
  if (typedElement.type === 'mrkdwn') {
    const text = typeof typedElement.text === 'string' ? typedElement.text : ''
    return (
      <div className="text-xs leading-relaxed [&_p]:m-0 [&_a]:text-[var(--slack-mention)] [&_a]:font-semibold [&_a]:no-underline hover:[&_a]:underline" style={{ color: 'var(--slack-msg-muted)' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{slackMrkdwnToMarkdown(text)}</ReactMarkdown>
      </div>
    )
  }
  if (typedElement.type === 'plain_text') {
    const text = typeof typedElement.text === 'string' ? typedElement.text : ''
    return (
      <span className="text-xs leading-relaxed" style={{ color: 'var(--slack-msg-muted)' }}>
        {text}
      </span>
    )
  }
  return null
}

function slackMrkdwnToMarkdown(value: string): string {
  return value
    .replace(/<([^|>]+)\|([^>]+)>/g, '[$2]($1)')
    .replace(/~([^~]+)~/g, '~~$1~~')
    .replace(/:([a-z0-9_+\-]+):/gi, (match, shortcode: string) => {
      const emoji = SLACK_EMOJI_SHORTCODE_MAP[shortcode.toLowerCase()]
      return emoji ?? match
    })
}

const SLACK_EMOJI_SHORTCODE_MAP: Record<string, string> = {
  wave: '👋',
  sushi: '🍣',
  mag: '🔍',
  newspaper: '📰',
  loud_sound: '🔊',
}

/** Matches ChatView message row for app (Slackbot) messages — avatar, header, body. */
function SlackbotMessageRowPreview({
  author,
  timestamp,
  children,
}: {
  author: string
  timestamp: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3 py-0 w-full max-w-[736px]">
      <img
        src="/assets/slackbot-icon.png"
        alt=""
        className="w-9 h-9 rounded-lg flex-shrink-0 object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-start gap-2 h-[20px] m-0 mb-1">
          <span className="font-extrabold text-[15px]" style={{ color: 'var(--slack-text)' }}>
            {author}
          </span>
          <span
            className="inline-flex items-center h-[18px] px-1.5 rounded text-[11px] font-bold uppercase tracking-[0.02em]"
            style={{ backgroundColor: '#e8e8e8', color: '#616061' }}
          >
            App
          </span>
          <span className="text-[11px]" style={{ color: 'var(--slack-msg-muted)' }}>
            {timestamp}
          </span>
        </div>
        {children}
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
    case 'connect_oauth_card':
      return {
        text: "I'd be happy to find those internal roles and skill gaps for you! First, I just need your permission to securely access your Cornerstone learning profile.",
        choices: ['Allow Access'],
        personaNames: ['Alex Rivera', 'Sarah Chen'],
      }
    default:
      return { text: 'Sample' }
  }
}

type BulkImportReviewResult = {
  valid: Array<{ sourceUrl: string; definition: SlackBlockTemplateDefinition; willOverwrite: boolean }>
  invalid: Array<{ sourceUrl: string; reason: string }>
  overwrittenIds: string[]
}

function BulkImportPanel({
  input,
  review,
  appliedSummary,
  onInputChange,
  onImportAll,
  onApplyImports,
}: {
  input: string
  review: BulkImportReviewResult | null
  appliedSummary: { upserted: number; overwritten: number } | null
  onInputChange: (value: string) => void
  onImportAll: () => void
  onApplyImports: () => void
}) {
  return (
    <section
      className="rounded-lg border p-4 mb-6"
      style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--slack-text)' }}>
          Bulk import from Block Kit Builder
        </h2>
        <button
          type="button"
          onClick={onImportAll}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm font-semibold border transition hover:bg-[var(--slack-btn-hover-bg)]"
          style={{
            backgroundColor: 'var(--slack-btn-bg)',
            color: 'var(--slack-text)',
            borderColor: 'var(--slack-btn-secondary-border)',
          }}
        >
          Import All
        </button>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--slack-msg-muted)' }}>
        Paste one Block Kit Builder URL per line. Import review shows valid templates, overwrite impact, and failures.
      </p>
      <textarea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        rows={5}
        placeholder="https://app.slack.com/block-kit-builder/#..."
        className="w-full rounded border px-3 py-2 text-sm"
        style={{
          borderColor: 'var(--slack-border)',
          backgroundColor: 'var(--slack-main-bg)',
          color: 'var(--slack-text)',
        }}
      />
      {appliedSummary && (
        <div className="mt-3 text-xs" style={{ color: 'var(--slack-msg-muted)' }}>
          Applied {appliedSummary.upserted} template(s), including {appliedSummary.overwritten} overwrite(s).
        </div>
      )}
      {review && (
        <div className="mt-4 rounded border p-3" style={{ borderColor: 'var(--slack-border)', backgroundColor: 'var(--slack-main-bg)' }}>
          <div className="flex flex-wrap items-center gap-4 mb-3 text-xs" style={{ color: 'var(--slack-msg-muted)' }}>
            <span>Imported: {review.valid.length}</span>
            <span>Overwrites: {review.overwrittenIds.length}</span>
            <span>Failures: {review.invalid.length}</span>
          </div>
          {review.valid.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--slack-text)' }}>
                Valid templates
              </div>
              <div className="space-y-1">
                {review.valid.map((candidate) => (
                  <div key={candidate.sourceUrl} className="text-xs" style={{ color: 'var(--slack-msg-muted)' }}>
                    <span className="font-medium" style={{ color: 'var(--slack-text)' }}>
                      {candidate.definition.id}
                    </span>
                    {candidate.willOverwrite ? ' (overwrite)' : ' (new)'} - {candidate.sourceUrl}
                  </div>
                ))}
              </div>
            </div>
          )}
          {review.invalid.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold mb-1" style={{ color: '#9b1c1c' }}>
                Invalid URLs
              </div>
              <div className="space-y-1">
                {review.invalid.map((failure) => (
                  <div key={`${failure.sourceUrl}:${failure.reason}`} className="text-xs" style={{ color: '#9b1c1c' }}>
                    {failure.sourceUrl} - {failure.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onApplyImports}
            disabled={review.valid.length === 0}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded text-sm font-semibold border transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: 'var(--slack-btn-bg)',
              color: 'var(--slack-text)',
              borderColor: 'var(--slack-btn-secondary-border)',
            }}
          >
            Apply Imports
          </button>
        </div>
      )}
    </section>
  )
}
