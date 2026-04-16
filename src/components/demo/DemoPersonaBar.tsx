import type { ReactNode } from 'react'
import type { Persona } from '@/types'

interface DemoPersonaBarProps {
  /** Breadcrumb: e.g. Demos / Story title / Persona */
  breadcrumb?: ReactNode
  personas: Persona[]
  selectedPersonaId: string | null
  onPersonaChange: (personaId: string | null) => void
  /** When provided, shows step navigation (Back/Next) */
  currentStep?: number
  totalSteps?: number
  /** Step id from demo.json (e.g. "step-6") for display as demo step number */
  demoStepId?: string
  onBack?: () => void
  onNext?: () => void
  overlayEnabled?: boolean
  onOverlayToggle?: (enabled: boolean) => void
  showOverlayToggle?: boolean
}

export function DemoPersonaBar({
  breadcrumb,
  personas,
  selectedPersonaId,
  onPersonaChange,
  currentStep,
  totalSteps,
  demoStepId,
  onBack,
  onNext,
  overlayEnabled = true,
  onOverlayToggle,
  showOverlayToggle = false,
}: DemoPersonaBarProps) {
  if (personas.length === 0) return null

  // Demo step number from id (e.g. "step-6" -> "6"; otherwise use id as-is)
  const demoStepLabel =
    demoStepId != null && demoStepId !== ''
      ? (demoStepId.match(/^step-(\d+)$/)?.[1] ?? demoStepId)
      : (currentStep != null ? String(currentStep) : '–')

  const showStepNav =
    currentStep != null && totalSteps != null && onBack && onNext

  return (
    <div
      className="demo-persona-bar flex items-center justify-between gap-4 px-6 shrink-0"
      style={{
        height: 56,
        backgroundColor: 'var(--color-gray-900)',
      }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {breadcrumb != null && (
          <div className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {breadcrumb}
          </div>
        )}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-white text-sm font-medium">View as</span>
          <select
            value={selectedPersonaId ?? ''}
            onChange={(e) => onPersonaChange(e.target.value || null)}
            className="bg-white/10 text-white border-0 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
            aria-label="Select persona to view as"
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id} className="bg-gray-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {showOverlayToggle && onOverlayToggle != null && (
          <label className="flex items-center gap-2 cursor-pointer text-white text-sm">
            <input
              type="checkbox"
              checked={overlayEnabled}
              onChange={(e) => onOverlayToggle(e.target.checked)}
              className="rounded border-white/30"
              aria-label="Toggle click-through overlay"
            />
            <span>Show overlay</span>
          </label>
        )}
        {showStepNav && (
          <>
            <span className="text-white/80 text-sm">
              Step {demoStepLabel} ({currentStep} of {totalSteps})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="text-white text-sm font-medium hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded px-2 py-1 bg-white/10"
                aria-label="Go to previous step"
              >
                ←
              </button>
              <button
                type="button"
                onClick={onNext}
                className="text-white text-sm font-medium hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded px-2 py-1 bg-white/10"
                aria-label="Go to next step"
              >
                →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
