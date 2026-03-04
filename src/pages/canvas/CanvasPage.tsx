import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DEFAULT_DEMO_INSTRUCTIONS } from '@/constants/demoInstructions'

const STORAGE_KEYS = {
  demoInstructions: 'slack-demos:demo-instructions',
  createdBy: 'slack-demos:created-by',
} as const

const PLACEHOLDER = `Write your story in plain paragraphs. Describe what happens step by step.

Example:

Alex is an employee who needs to request paternity leave. He opens a direct message with Slackbot and says he wants to apply. Slackbot explains the policy: 2 weeks paid, manager approval required. Alex clicks a button to choose his dates and selects March 15–22. His manager Sarah receives a notification in her DM and approves the request. Alex gets a confirmation message that his leave is approved.`

type CanvasLocationState = { initialStory?: string; demoId?: string; demoTitle?: string } | null

export function CanvasPage() {
  const location = useLocation()
  const state = location.state as CanvasLocationState
  const [story, setStory] = useState(() => (state?.initialStory != null ? state.initialStory : ''))
  const [copied, setCopied] = useState(false)
  const [createdBy, setCreatedBy] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.createdBy) ?? 'Pritesh Chavan'
    } catch {
      return 'Pritesh Chavan'
    }
  })
  const [instructions, setInstructions] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.demoInstructions) ?? DEFAULT_DEMO_INSTRUCTIONS
    } catch {
      return DEFAULT_DEMO_INSTRUCTIONS
    }
  })
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.createdBy, createdBy)
    } catch {
      /* ignore */
    }
  }, [createdBy])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.demoInstructions, instructions)
    } catch {
      /* ignore */
    }
  }, [instructions])

  const handleResetInstructions = () => {
    setInstructions(DEFAULT_DEMO_INSTRUCTIONS)
  }

  const handleGenerate = async () => {
    const storyText = story.trim() || 'No story written yet.'
    const textToCopy =
      `${instructions}\n\n---\n\nCreated by: ${createdBy}\n\nStory:\n\n${storyText}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback: show the prompt in a way user can copy manually
      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([story], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'story-draft.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f8f8' }}>
      <header
        className="flex-shrink-0 px-6 border-b flex flex-col"
        style={{ backgroundColor: 'var(--slack-pane-bg)', borderColor: 'var(--slack-border)' }}
      >
        <div className="py-4 flex items-center justify-between">
          <Link
            to="/"
            className="font-semibold text-[15px] hover:underline focus:outline-none focus:underline"
            style={{ color: 'var(--slack-text)' }}
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="max-w-3xl mx-auto w-full pb-6">
          <h1 className="font-black text-[60px] mb-2" style={{ color: 'var(--slack-text)' }}>
            Story Canvas
          </h1>
          <p className="text-base" style={{ color: 'var(--slack-msg-muted)' }}>
            Write your story in paragraphs. I&apos;ll create the Slack demo—chat bubbles, personas, and all.
          </p>
        </div>
        {state?.demoTitle && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--slack-msg-hover)', color: 'var(--slack-text)' }}
          >
            <strong>Editing story for:</strong> {state.demoTitle}. Update the story below, then click <strong>Copy Demo Prompt</strong> and paste in Cursor to regenerate the demo files.
          </div>
        )}
        <p className="text-sm mb-4" style={{ color: 'var(--slack-msg-muted)' }}>
          Write your story in paragraphs. Describe what happens—who does what, what they say, how the conversation flows. Set <strong>Created by</strong>, edit instructions (and Slack persona) if needed, then click Copy Demo Prompt and paste in Cursor to create the Slack demo.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--slack-text)' }}>
              Created by
            </span>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Your name"
              className="rounded border px-3 py-2 text-[15px] w-48 max-w-full"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e0e0e0',
                color: 'var(--slack-text)',
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => setShowInstructions((v) => !v)}
            className="link-button text-sm font-medium"
          >
            {showInstructions ? 'Hide instructions' : 'Show demo instructions'}
          </button>
        </div>

        {showInstructions && (
          <div
            className="mb-6 rounded-lg p-4 flex flex-col gap-3"
            style={{
              backgroundColor: '#fafafa',
              border: '1px solid #e0e0e0',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--slack-text)' }}>
                Demo generation instructions & Slack persona
              </span>
              <button
                type="button"
                onClick={handleResetInstructions}
                className="link-button text-sm font-medium"
              >
                Reset to default
              </button>
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full rounded border p-4 text-[14px] leading-relaxed font-mono resize-y min-h-[280px]"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e0e0e0',
                color: 'var(--slack-text)',
              }}
              spellCheck={false}
            />
          </div>
        )}

        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder={PLACEHOLDER}
          className="w-full rounded-lg p-5 text-[15px] leading-relaxed outline-none transition resize-y min-h-[320px]"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            color: 'var(--slack-text)',
          }}
        />

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={handleGenerate}
            className="px-6 py-3 rounded text-base font-semibold transition"
            style={{
              backgroundColor: 'rgba(97, 31, 105, 1)',
              color: '#ffffff',
            }}
          >
            {copied ? 'Copied! Paste in Cursor' : 'Copy Demo Prompt'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-6 py-3 rounded text-base font-medium border-0 transition hover:opacity-90"
          >
            Download story
          </button>
        </div>

        {copied && (
          <div
            className="mt-6 p-4 rounded-lg"
            style={{ backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--slack-text)' }}>
              Copied to clipboard!
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--slack-msg-muted)' }}>
              Paste in Cursor chat (Cmd+V) and send. The copied text includes your instructions (and Slack persona) plus Created by and your story—Cursor will create the demo in Demos/&lt;Title&gt; by &lt;Created by&gt;/.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
