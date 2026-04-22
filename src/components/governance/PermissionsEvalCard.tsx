/**
 * PermissionsEvalCard
 *
 * Shows results from the recurring permissions/policy eval suite as
 * compact horizontal bars per policy domain, plus a short stats footer.
 * Sits next to EvaluationCard on the Mission Control homepage so quality
 * evals (subjective) and permissions evals (objective rule conformance)
 * read as siblings.
 */

import { POLICIES } from '@/data/governance/policyImpact'

interface PermBar {
  policyRef: string
  label: string
  passPct: number
  tone: 'critical' | 'warn' | 'success'
  cases: number
}

const BARS: PermBar[] = [
  {
    policyRef: POLICIES[0].ref,
    label: 'Domain restriction',
    passPct: 64.2,
    tone: 'critical',
    cases: 218,
  },
  {
    policyRef: POLICIES[1].ref,
    label: 'PII handling',
    passPct: 96.8,
    tone: 'success',
    cases: 412,
  },
  {
    policyRef: 'POL-AGT-TONE-04',
    label: 'Tone & escalation',
    passPct: 88.4,
    tone: 'warn',
    cases: 184,
  },
]

function fillFor(tone: PermBar['tone']) {
  switch (tone) {
    case 'critical':
      return 'var(--mc-critical)'
    case 'warn':
      return 'var(--mc-warn-amber)'
    case 'success':
      return 'var(--mc-success)'
  }
}

export function PermissionsEvalCard() {
  const totalCases = BARS.reduce((acc, b) => acc + b.cases, 0)
  const failing = BARS.filter((b) => b.tone === 'critical').length
  return (
    <section className="mc-galileo-card" aria-labelledby="mc-galileo-perm-heading">
      <header className="mc-galileo-section-meta">
        <span className="mc-galileo-num">05</span>
        <span className="mc-galileo-kicker" id="mc-galileo-perm-heading">
          Permissions Evals
        </span>
      </header>
      <div className="mc-galileo-card-headline">
        <span
          className="mc-galileo-card-headline__v"
          style={{ color: failing > 0 ? 'var(--mc-critical)' : 'var(--mc-success)' }}
        >
          {failing > 0 ? `${failing} failing` : 'All passing'}
        </span>
        <span className="mc-galileo-card-headline__l">
          policy gate · {totalCases} cases · last suite 18m ago
        </span>
      </div>
      <div className="mc-perm-bars">
        {BARS.map((b) => (
          <div key={b.policyRef} className="mc-perm-bar" title={b.policyRef}>
            <span className="mc-perm-bar__label">{b.label}</span>
            <span className="mc-perm-bar__track">
              <span
                className="mc-perm-bar__fill"
                style={{
                  width: `${b.passPct}%`,
                  backgroundColor: fillFor(b.tone),
                }}
              />
            </span>
            <span className="mc-perm-bar__pct" style={{ color: fillFor(b.tone) }}>
              {b.passPct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      <div>
        <div className="mc-perm-row">
          <span>Cases run</span>
          <span className="mc-perm-row__v">{totalCases}</span>
        </div>
        <div className="mc-perm-row">
          <span>Below threshold</span>
          <span className="mc-perm-row__v" style={{ color: failing > 0 ? 'var(--mc-critical)' : 'var(--mc-success)' }}>
            {failing}
          </span>
        </div>
        <div className="mc-perm-row">
          <span>Auto-remediated</span>
          <span className="mc-perm-row__v">3</span>
        </div>
      </div>
    </section>
  )
}
