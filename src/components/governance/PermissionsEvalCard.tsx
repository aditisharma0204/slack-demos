/**
 * PermissionsEvalCard
 *
 * Shows results from the recurring permissions/policy eval suite as
 * compact horizontal bars per policy domain, plus a short stats footer.
 * Sits next to EvaluationCard on the Mission Control homepage so quality
 * evals (subjective) and permissions evals (objective rule conformance)
 * read as siblings.
 *
 * Reacts to `fleetState`:
 *   • `active_incident` (default): Domain restriction is failing — this is
 *     the policy that drove the original USW-7 alert.
 *   • `all_clear`: post-retrain + post-deploy posture. Domain restriction has
 *     recovered, all three policies pass the gate, and the suite has just
 *     finished a fresh run against the new revision.
 *
 * Other fleet states fall back to the active-incident dataset until they're
 * designed; v1 of the demo only exercises these two ends of the spectrum.
 */

import { POLICIES } from '@/data/governance/policyImpact'
import type { FleetState } from '@/data/governance/missionControlState'

interface PermBar {
  policyRef: string
  label: string
  passPct: number
  tone: 'critical' | 'warn' | 'success'
  cases: number
}

type PermDataset = {
  bars: PermBar[]
  autoRemediated: number
  /** Human-readable freshness for the suite (e.g. "18m ago", "2m ago"). */
  lastRunAgo: string
}

const ACTIVE_INCIDENT_DATA: PermDataset = {
  bars: [
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
  ],
  autoRemediated: 3,
  lastRunAgo: '18m ago',
}

const ALL_CLEAR_DATA: PermDataset = {
  bars: [
    {
      policyRef: POLICIES[0].ref,
      label: 'Domain restriction',
      passPct: 99.2,
      tone: 'success',
      cases: 246,
    },
    {
      policyRef: POLICIES[1].ref,
      label: 'PII handling',
      passPct: 99.5,
      tone: 'success',
      cases: 438,
    },
    {
      policyRef: 'POL-AGT-TONE-04',
      label: 'Tone & escalation',
      passPct: 97.6,
      tone: 'success',
      cases: 197,
    },
  ],
  autoRemediated: 0,
  lastRunAgo: '2m ago',
}

function datasetFor(fleetState: FleetState): PermDataset {
  return fleetState === 'all_clear' ? ALL_CLEAR_DATA : ACTIVE_INCIDENT_DATA
}

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

export function PermissionsEvalCard({ fleetState = 'active_incident' }: { fleetState?: FleetState }) {
  const data = datasetFor(fleetState)
  const totalCases = data.bars.reduce((acc, b) => acc + b.cases, 0)
  const failing = data.bars.filter((b) => b.tone === 'critical').length
  const headlineColor = failing > 0 ? 'var(--mc-critical)' : 'var(--mc-success)'
  const headlineText = failing > 0 ? `${failing} failing` : 'All passing'

  return (
    <section className="mc-galileo-card" aria-labelledby="mc-galileo-perm-heading">
      <header className="mc-galileo-section-meta">
        <span className="mc-galileo-num">05</span>
        <span className="mc-galileo-kicker" id="mc-galileo-perm-heading">
          Permissions Evals
        </span>
      </header>
      <div className="mc-galileo-card-headline">
        <span className="mc-galileo-card-headline__v" style={{ color: headlineColor }}>
          {headlineText}
        </span>
        <span className="mc-galileo-card-headline__l">
          policy gate · {totalCases} cases · last suite {data.lastRunAgo}
        </span>
      </div>
      <div className="mc-perm-bars">
        {data.bars.map((b) => (
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
          <span className="mc-perm-row__v" style={{ color: headlineColor }}>
            {failing}
          </span>
        </div>
        <div className="mc-perm-row">
          <span>Auto-remediated</span>
          <span className="mc-perm-row__v">{data.autoRemediated}</span>
        </div>
      </div>
    </section>
  )
}
