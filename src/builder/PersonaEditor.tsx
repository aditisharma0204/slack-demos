import type { Persona } from '@/types'

interface PersonaEditorProps {
  personas: Omit<Persona, 'channels' | 'dms'>[]
  onChange: (personas: Omit<Persona, 'channels' | 'dms'>[]) => void
}

export function PersonaEditor({ personas, onChange }: PersonaEditorProps) {
  const addPersona = () => {
    onChange([
      ...personas,
      {
        id: `p${Date.now()}`,
        name: 'New Persona',
        designation: 'Employee',
        role: '',
        type: 'user',
      },
    ])
  }

  const updatePersona = (id: string, updates: Partial<Persona>) => {
    onChange(
      personas.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  const removePersona = (id: string) => {
    onChange(personas.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--slack-msg-muted)' }}>
          Personas
        </h3>
        <button
          type="button"
          onClick={addPersona}
          className="px-3 py-1.5 text-sm font-medium rounded border-0 transition hover:opacity-90"
        >
          + Add
        </button>
      </div>
      <div className="space-y-4">
        {personas.map((p) => (
          <div
            key={p.id}
            className="rounded-lg p-4 transition"
            style={{
              backgroundColor: 'var(--slack-msg-hover)',
              border: '1px solid var(--slack-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--slack-avatar-bg)' }}
              >
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePersona(p.id, { name: e.target.value })}
                className="flex-1 font-semibold text-sm rounded px-2.5 py-1.5 outline-none transition"
                style={{
                  backgroundColor: 'var(--slack-input-bg)',
                  border: '1px solid var(--slack-input-border)',
                  color: 'var(--slack-text)',
                }}
                placeholder="Name"
              />
            </div>
            <input
              type="text"
              value={p.designation}
              onChange={(e) => updatePersona(p.id, { designation: e.target.value })}
              className="w-full text-sm rounded px-2.5 py-1.5 mb-2 outline-none transition"
              style={{
                backgroundColor: 'var(--slack-input-bg)',
                border: '1px solid var(--slack-input-border)',
                color: 'var(--slack-text)',
              }}
              placeholder="Designation (e.g. Manager)"
            />
            <input
              type="text"
              value={p.role}
              onChange={(e) => updatePersona(p.id, { role: e.target.value })}
              className="w-full text-sm rounded px-2.5 py-1.5 mb-2 outline-none transition"
              style={{
                backgroundColor: 'var(--slack-input-bg)',
                border: '1px solid var(--slack-input-border)',
                color: 'var(--slack-text)',
              }}
              placeholder="Role description"
            />
            <select
              value={p.type}
              onChange={(e) => updatePersona(p.id, { type: e.target.value as 'user' | 'app' })}
              className="w-full text-sm rounded px-2.5 py-1.5 mb-2 outline-none transition"
              style={{
                backgroundColor: 'var(--slack-input-bg)',
                border: '1px solid var(--slack-input-border)',
                color: 'var(--slack-text)',
              }}
            >
              <option value="user">User</option>
              <option value="app">App</option>
            </select>
            <button
              type="button"
              onClick={() => removePersona(p.id)}
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
