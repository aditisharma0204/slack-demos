import { useState } from 'react'
import { getAllStepTypes } from '@/extensions/stepTypeRegistry'
import { StepTypeCard } from './StepTypeCard'
import type { Persona } from '@/types'
import type { StoryStep } from '@/types'

interface StepListProps {
  steps: StoryStep[]
  onChange: (steps: StoryStep[]) => void
  personas: Persona[]
}

export function StepList({ steps, onChange, personas }: StepListProps) {
  const [showPicker, setShowPicker] = useState(false)
  const stepTypes = getAllStepTypes()

  const addStep = (typeId: string) => {
    const base: StoryStep = {
      id: `step-${Date.now()}`,
      type: typeId as any,
    } as StoryStep
    if (typeId === 'surface') {
      (base as any).context = { surface: 'dm', with: 'Slackbot' }
    } else if (typeId === 'user_message') {
      (base as any).content = { text: '', personaId: personas[0]?.id }
    } else if (typeId === 'app_message') {
      (base as any).content = { text: '', personaId: personas.find((p) => p.type === 'app')?.id }
    } else if (typeId === 'user_action') {
      (base as any).content = { action: '', trigger: 'button', personaId: personas[0]?.id }
    } else if (typeId === 'modal_open') {
      (base as any).content = { view: 'date-picker' }
    } else if (typeId === 'modal_submit') {
      (base as any).content = { values: {} }
    } else if (typeId === 'thread_reply') {
      (base as any).content = { actor: 'user', text: '' }
    } else if (typeId === 'bot_typing') {
      (base as any).content = { duration: 1 }
    }
    onChange([...steps, base])
    setShowPicker(false)
  }

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slack-msg-muted)' }}>
          Steps
        </h3>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="px-3 py-1.5 text-sm font-medium rounded border-0 transition hover:opacity-90"
        >
          + Add Step
        </button>
      </div>
      {showPicker && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--slack-text)' }}>
              Choose step type
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {stepTypes.map((def) => (
                <StepTypeCard
                  key={def.id}
                  definition={def}
                  selectable
                  onSelect={() => addStep(def.id)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="mt-5 w-full py-2.5 rounded text-sm font-medium border-0 transition hover:opacity-90"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm transition"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
            }}
          >
            <span style={{ color: 'var(--slack-text)' }}>
              {i + 1}. {step.type.replace('_', ' ')}
            </span>
            <button
              type="button"
              onClick={() => removeStep(i)}
              className="px-2.5 py-1 text-xs font-medium rounded border-0 transition hover:opacity-90"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
