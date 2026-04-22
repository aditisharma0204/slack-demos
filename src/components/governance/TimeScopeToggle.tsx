/**
 * TimeScopeToggle
 *
 * Segmented control (1D / 7D / 30D) used above dashboard sections
 * (e.g. Observability KPI strip) to scope the time range of what's shown.
 * Stateless — owner controls value via props.
 */

export type TimeScope = '1D' | '7D' | '30D'

export const TIME_SCOPES: TimeScope[] = ['1D', '7D', '30D']

export function TimeScopeToggle({
  value,
  onChange,
  label = 'Time scope',
}: {
  value: TimeScope
  onChange: (next: TimeScope) => void
  label?: string
}) {
  return (
    <div
      className="mc-scope-toggle"
      role="group"
      aria-label={label}
    >
      {TIME_SCOPES.map((s) => {
        const active = s === value
        return (
          <button
            key={s}
            type="button"
            className={`mc-scope-toggle__btn${active ? ' mc-scope-toggle__btn--active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(s)}
          >
            {s}
          </button>
        )
      })}
    </div>
  )
}
