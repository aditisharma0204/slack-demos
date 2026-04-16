import { useState } from 'react'
import { PersonaEditor } from './PersonaEditor'
import { StepList } from './StepList'
import { DemoPersonaBar } from '@/components/demo/DemoPersonaBar'
import { SlackLayout } from '@/components/layout/SlackLayout'
import type { Persona } from '@/types'

type Tab = 'personas' | 'steps'

export function StoryBuilder() {
  const [activeTab, setActiveTab] = useState<Tab>('personas')
  const [personas, setPersonas] = useState<Persona[]>([
    { id: 'p1', name: 'Alex Kim', designation: 'Employee', role: 'Employee', type: 'user' },
    { id: 'p2', name: 'Sarah Chen', designation: 'Manager', role: 'Manager', type: 'user' },
    { id: 'p3', name: 'Slackbot', designation: 'App', role: 'App', type: 'app' },
  ])
  const [steps, setSteps] = useState<any[]>([])
  const [storyTitle, setStoryTitle] = useState('New Story')
  const [createdBy, setCreatedBy] = useState('')
  const [viewAsPersonaId, setViewAsPersonaId] = useState<string | null>('p1')

  return (
    <div className="flex-1 flex min-h-0" style={{ minHeight: 0 }}>
      {/* Sidebar - Slack-style */}
      <aside
        className="w-96 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--slack-pane-bg)', borderRight: '1px solid var(--slack-border)' }}
      >
        <div className="flex border-b" style={{ borderColor: 'var(--slack-border)' }}>
          <button
            type="button"
            className={`flex-1 py-3 px-4 text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--slack-avatar-bg)] focus:ring-inset -mb-px ${
              activeTab === 'personas'
                ? 'border-b-2'
                : 'hover:bg-[var(--slack-msg-hover)]'
            }`}
            style={{
              color: activeTab === 'personas' ? 'var(--slack-text)' : 'var(--slack-msg-muted)',
              borderBottomColor: activeTab === 'personas' ? 'var(--slack-tab-active)' : 'transparent',
            }}
            onClick={() => setActiveTab('personas')}
          >
            Personas
          </button>
          <button
            type="button"
            className={`flex-1 py-3 px-4 text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--slack-avatar-bg)] focus:ring-inset -mb-px ${
              activeTab === 'steps'
                ? 'border-b-2'
                : 'hover:bg-[var(--slack-msg-hover)]'
            }`}
            style={{
              color: activeTab === 'steps' ? 'var(--slack-text)' : 'var(--slack-msg-muted)',
              borderBottomColor: activeTab === 'steps' ? 'var(--slack-tab-active)' : 'transparent',
            }}
            onClick={() => setActiveTab('steps')}
          >
            Steps
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--slack-msg-muted)' }}>
              Story Title
            </label>
            <input
              type="text"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              className="w-full rounded px-3 py-2.5 text-sm outline-none transition"
              style={{
                backgroundColor: 'var(--slack-input-bg)',
                border: '1px solid var(--slack-input-border)',
                color: 'var(--slack-text)',
              }}
              placeholder="e.g. Paternity Leave Request"
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--slack-msg-muted)' }}>
              Created By
            </label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              className="w-full rounded px-3 py-2.5 text-sm outline-none transition"
              style={{
                backgroundColor: 'var(--slack-input-bg)',
                border: '1px solid var(--slack-input-border)',
                color: 'var(--slack-text)',
              }}
              placeholder="Your name"
            />
          </div>
          {activeTab === 'personas' && (
            <PersonaEditor personas={personas} onChange={setPersonas} />
          )}
          {activeTab === 'steps' && (
            <StepList steps={steps} onChange={setSteps} personas={personas} />
          )}
        </div>
      </aside>

      {/* Preview area */}
      <main className="flex-1 p-6 overflow-auto flex flex-col min-w-0">
        <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full min-h-0 rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <DemoPersonaBar
            personas={personas}
            selectedPersonaId={viewAsPersonaId}
            onPersonaChange={setViewAsPersonaId}
          />
          <div className="flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: 'var(--slack-main-bg)' }}>
            <SlackLayout
              workspaceName="Acme Inc"
              channels={['#general', '#project-1']}
              dms={personas.filter((p) => p.type === 'app').map((p) => p.name)}
              searchPlaceholder="Search Acme Inc"
            >
              <div className="p-6 text-sm" style={{ color: 'var(--slack-msg-muted)' }}>
                Live preview will appear here. Build your story in the Personas and Steps tabs.
              </div>
            </SlackLayout>
          </div>
        </div>
      </main>
    </div>
  )
}
