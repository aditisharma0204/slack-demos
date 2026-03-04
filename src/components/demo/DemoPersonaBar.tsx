import type { Persona } from '@/types'

interface DemoPersonaBarProps {
  personas: Persona[]
  selectedPersonaId: string | null
  onPersonaChange: (personaId: string | null) => void
  /** When provided, shows step navigation (Back/Next) */
  currentStep?: number
  totalSteps?: number
  onBack?: () => void
  onNext?: () => void
}

export function DemoPersonaBar({
  personas,
  selectedPersonaId,
  onPersonaChange,
  currentStep,
  totalSteps,
  onBack,
  onNext,
}: DemoPersonaBarProps) {
  if (personas.length === 0) return null

  const showStepNav =
    currentStep != null && totalSteps != null && onBack && onNext

  return (
    <div
      className="demo-persona-bar flex items-center justify-between px-6 shrink-0"
      style={{
        height: 56,
        backgroundColor: 'var(--slack-footer-bg)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-white text-sm font-medium">View as</span>
        <select
          value={selectedPersonaId ?? ''}
          onChange={(e) => onPersonaChange(e.target.value || null)}
          className="bg-white/10 text-white border border-white/20 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
          aria-label="Select persona to view as"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id} className="bg-gray-900 text-white">
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {showStepNav && (
        <div className="flex items-center gap-4">
          <span className="text-white/80 text-sm">
            Step {currentStep} of {totalSteps}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="text-white text-sm font-medium hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded px-2 py-1"
              aria-label="Go to previous step"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={onNext}
              className="text-white text-sm font-medium hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded px-2 py-1"
              aria-label="Go to next step"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
