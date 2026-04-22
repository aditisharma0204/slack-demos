/**
 * InvestigationCanvas — center-pane orchestrator for the Slack demo.
 *
 * Picks what to render based on the demo phase:
 *   • Default phases (alert / stopping / stopped / deploying / healthy)
 *       → tabbed view: Service graph (default) | Policy impact
 *   • Retrain phases (retraining / retrain-complete)
 *       → hybrid: collapsed Service Graph status strip on top + EvalsPanel below
 *
 * The Policy impact tab is only available in the alert / containment phases —
 * once we've fully recovered, the question shifts back to the live system.
 */

import { useState } from 'react'

import { PolicyImpactGraph } from '@/components/governance/PolicyImpactGraph'
import { EvalsPanel } from './EvalsPanel'
import { ServiceGraphCanvas, ServiceGraphStatusStrip, type ServicePhase } from './ServiceGraphCanvas'

const POLICY_IMPACT_DEFAULT_ID = 'pol_dom_rem_03'

type InvestigationTab = 'service' | 'policy'

/** Map a demo step id → ServicePhase. Drives canvas reactions to chat progress. */
export function phaseForStepId(stepId: string | undefined): ServicePhase {
  switch (stepId) {
    case 'step-3':
    case 'step-4':
    case 'step-8':
    case 'step-9':
      return 'alert'
    case 'step-10':
      return 'stopping'
    case 'step-11':
    case 'step-12':
      return 'stopped'
    case 'step-13':
    case 'step-14':
    case 'step-15':
      return 'retraining'
    case 'step-16':
    case 'step-17':
    case 'step-18':
    case 'step-19':
      return 'retrain-complete'
    case 'step-20':
    case 'step-21':
    case 'step-22':
      return 'deploying'
    case 'step-23':
    case 'step-24':
    case 'step-25':
    case 'step-26':
      return 'healthy'
    default:
      return 'alert'
  }
}

/** Tab is offered while the incident has provenance worth tracing. */
function policyTabAvailableFor(phase: ServicePhase): boolean {
  return phase === 'alert' || phase === 'stopping' || phase === 'stopped'
}

export function InvestigationCanvas({ stepId }: { stepId?: string }) {
  const phase = phaseForStepId(stepId)
  const isRetrainView = phase === 'retraining' || phase === 'retrain-complete'
  const showPolicyTab = policyTabAvailableFor(phase)
  const [tab, setTab] = useState<InvestigationTab>('service')

  if (isRetrainView) {
    return (
      <div className="flex flex-col min-h-0 min-w-0 h-full overflow-hidden">
        <ServiceGraphStatusStrip phase={phase} />
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <EvalsPanel phase={phase} />
        </div>
      </div>
    )
  }

  // Without the policy tab, render ServiceGraphCanvas directly so its `h-full`
  // chain matches the original parent context (no extra wrapper that could
  // collapse the graph's height).
  if (!showPolicyTab) {
    return <ServiceGraphCanvas phase={phase} />
  }

  return (
    <div className="flex flex-col min-h-0 min-w-0 h-full overflow-hidden">
      <div role="tablist" aria-label="Investigation views" className="mc-canvas-tabs flex-shrink-0">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'service'}
          className={`mc-canvas-tab${tab === 'service' ? ' mc-canvas-tab--active' : ''}`}
          onClick={() => setTab('service')}
        >
          Service graph
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'policy'}
          className={`mc-canvas-tab${tab === 'policy' ? ' mc-canvas-tab--active' : ''}`}
          onClick={() => setTab('policy')}
        >
          Policy impact
        </button>
      </div>
      {/* IMPORTANT: this inner container must be a flex column so children with
          `h-full` (ServiceGraphCanvas, PolicyImpactGraph) stretch correctly. */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        {tab === 'policy' ? (
          <PolicyImpactGraph policyId={POLICY_IMPACT_DEFAULT_ID} />
        ) : (
          <ServiceGraphCanvas phase={phase} />
        )}
      </div>
    </div>
  )
}
