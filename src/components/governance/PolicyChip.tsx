/**
 * PolicyChip
 *
 * Inline pill that surfaces a policy reference (e.g. POL-AGT-DOMAIN-REM-03)
 * as a clickable affordance. When clicked, expands a `PolicyImpactCard`
 * inline below the parent block, showing what the policy says, who is
 * impacted (cohorts), and recent violating interactions.
 *
 * Usage:
 *   <PolicyChip policyRef="POL-AGT-DOMAIN-REM-03" expanded={open} onToggle={...} />
 *   {open && <PolicyImpactCard policyId={...} />}
 *
 * Most consumers should use `<PolicyChipWithImpact />` which composes the two
 * and manages its own open/closed state.
 */

import { useState } from 'react'

import {
  getImpactForPolicy,
  getPolicyByRef,
  type PolicyId,
  type Severity,
} from '@/data/governance/policyImpact'

function severityVar(s: Severity): string {
  switch (s) {
    case 'critical':
      return 'var(--mc-cohort-critical)'
    case 'warn':
      return 'var(--mc-cohort-warn)'
    case 'success':
      return 'var(--mc-cohort-success)'
  }
}

export function PolicyChip({
  policyRef,
  expanded,
  onToggle,
}: {
  policyRef: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="mc-policy-chip"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={`${expanded ? 'Hide' : 'Show'} impact for policy ${policyRef}`}
    >
      <span>{policyRef}</span>
      <span className="mc-policy-chip__caret" aria-hidden>
        {expanded ? '▾' : '▸'}
      </span>
    </button>
  )
}

export function PolicyImpactCard({ policyId }: { policyId: PolicyId }) {
  const impact = getImpactForPolicy(policyId)
  if (!impact) return null
  const { policy, cohorts, agents, recentInteractions, totalViolations } = impact
  const exposedTotal = cohorts.reduce((acc, { cohort, count }) => acc + cohort.exposedPerHour * count, 0)
  return (
    <div className="mc-policy-impact" role="region" aria-label={`Impact for ${policy.ref}`}>
      <div className="mc-policy-impact__head">
        <h4 className="mc-policy-impact__title">
          {policy.ref} — {policy.title}
        </h4>
        <span className="mc-policy-impact__meta">
          {policy.owner} · {policy.version}
        </span>
      </div>
      <p className="mc-policy-impact__text">{policy.text}</p>

      <div className="mc-policy-impact__counts">
        <div>
          <span className="mc-policy-impact__count-v mc-policy-impact__count-v--critical">
            {totalViolations}
          </span>
          <span className="mc-policy-impact__count-l">Violations · last 24h</span>
        </div>
        <div>
          <span className="mc-policy-impact__count-v">{cohorts.length}</span>
          <span className="mc-policy-impact__count-l">Cohorts impacted</span>
        </div>
        <div>
          <span className="mc-policy-impact__count-v">{agents.length}</span>
          <span className="mc-policy-impact__count-l">Agents involved</span>
        </div>
      </div>

      <ul className="mc-policy-impact__cohorts">
        {cohorts.map(({ cohort, count }) => (
          <li key={cohort.id} className="mc-policy-impact__cohort">
            <span
              className="mc-policy-impact__cohort-dot"
              style={{ backgroundColor: severityVar(cohort.severity) }}
              aria-hidden
            />
            <span className="mc-policy-impact__cohort-label">{cohort.label}</span>
            <span className="mc-policy-impact__cohort-scope">· {cohort.scope}</span>
            <span className="mc-policy-impact__cohort-count">{count} hits</span>
          </li>
        ))}
      </ul>

      {recentInteractions.length > 0 && (
        <ul className="mc-policy-impact__samples" aria-label="Recent interactions">
          {recentInteractions.slice(0, 3).map((i) => (
            <li key={i.id} className="mc-policy-impact__sample">
              <span
                className={`mc-policy-impact__sample-verdict mc-policy-impact__sample-verdict--${i.verdict === 'violated' ? 'violated' : 'borderline'}`}
              >
                {i.verdict}
              </span>
              {i.snippetRedacted}
            </li>
          ))}
        </ul>
      )}

      <div className="text-[11px] text-right" style={{ color: 'var(--slack-msg-muted)' }}>
        Estimated exposure: <strong style={{ color: 'var(--mc-critical)' }}>~{exposedTotal}</strong> users / hr while breach is live
      </div>
    </div>
  )
}

/** Convenience: chip + impact card with self-managed open state. */
export function PolicyChipWithImpact({ policyRef, defaultOpen = false }: { policyRef: string; defaultOpen?: boolean }) {
  const policy = getPolicyByRef(policyRef)
  const [open, setOpen] = useState(defaultOpen)
  if (!policy) {
    return <span style={{ fontFamily: 'ui-monospace, monospace' }}>{policyRef}</span>
  }
  return (
    <>
      <PolicyChip policyRef={policy.ref} expanded={open} onToggle={() => setOpen((v) => !v)} />
      {open && <PolicyImpactCard policyId={policy.id} />}
    </>
  )
}
