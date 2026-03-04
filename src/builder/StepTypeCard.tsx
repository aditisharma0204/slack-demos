import type { StepTypeDefinition } from '@/types'

interface StepTypeCardProps {
  definition: StepTypeDefinition
  selectable?: boolean
  onSelect?: () => void
}

export function StepTypeCard({ definition, selectable, onSelect }: StepTypeCardProps) {
  return (
    <div
      className={`rounded-lg p-4 transition ${
        selectable ? 'cursor-pointer hover:shadow-md hover:border-[var(--slack-avatar-bg)]' : ''
      }`}
      style={{
        backgroundColor: '#ffffff',
        border: selectable ? '2px solid #e0e0e0' : '1px solid #e0e0e0',
      }}
      onClick={selectable ? onSelect : undefined}
      onKeyDown={selectable ? (e) => e.key === 'Enter' && onSelect?.() : undefined}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
    >
      <h3 className="font-bold" style={{ color: 'var(--slack-text)' }}>
        {definition.name}
      </h3>
      <p className="text-sm mt-1" style={{ color: 'var(--slack-msg-muted)' }}>
        {definition.description}
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--slack-msg-muted)' }}>
        <span className="font-semibold">When to use:</span> {definition.whenToUse}
      </p>
      {definition.fields.length > 0 && (
        <div className="mt-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--slack-msg-muted)' }}>
            Fields:
          </span>
          <ul className="text-xs mt-1 space-y-0.5" style={{ color: 'var(--slack-msg-muted)' }}>
            {definition.fields.map((f) => (
              <li key={f.id}>
                • {f.label}
                {f.required && ' (required)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
