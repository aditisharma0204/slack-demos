/**
 * InvestigationCanvas — center-pane orchestrator for the Slack demo.
 *
 * Picks what to render based on the demo phase:
 *   • Default phases (alert / stopping / stopped / deploying / healthy)
 *       → full ServiceGraphCanvas
 *   • Retrain phases (retraining / retrain-complete)
 *       → hybrid: collapsed Service Graph status strip on top + EvalsPanel below
 *
 * This keeps the user's mental thread on the agent under remediation while the
 * eval suite runs, so context never disappears mid-conversation.
 */

import { EvalsPanel } from './EvalsPanel'
import { ServiceGraphCanvas, ServiceGraphStatusStrip, type ServicePhase } from './ServiceGraphCanvas'

/** Map a demo step id → ServicePhase. Drives canvas reactions to chat progress. */
export function phaseForStepId(stepId: string | undefined): ServicePhase {
  switch (stepId) {
    // Pre-stop: critical signal is live, agent is misbehaving
    case 'step-3':
    case 'step-4':
    case 'step-8':
    case 'step-9':
      return 'alert'

    // Stop-traffic in flight
    case 'step-10':
      return 'stopping'

    // Traffic stopped, fallback active, awaiting capture/retrain
    case 'step-11':
    case 'step-12':
      return 'stopped'

    // Retrain pipeline running — evals appear here
    case 'step-13':
    case 'step-14':
    case 'step-15':
      return 'retraining'

    // Retrain done, quality gate passed, awaiting deploy
    case 'step-16':
    case 'step-17':
    case 'step-18':
    case 'step-19':
      return 'retrain-complete'

    // Deploy in flight
    case 'step-20':
    case 'step-21':
    case 'step-22':
      return 'deploying'

    // Live on prod, healthy
    case 'step-23':
    case 'step-24':
    case 'step-25':
    case 'step-26':
      return 'healthy'

    // Anything before the canvas exists (step-1, step-2) defaults to alert so it's
    // ready to show context the moment the dual viewport opens at step-3.
    default:
      return 'alert'
  }
}

export function InvestigationCanvas({ stepId }: { stepId?: string }) {
  const phase = phaseForStepId(stepId)
  const isRetrainView = phase === 'retraining' || phase === 'retrain-complete'

  if (isRetrainView) {
    return (
      <div className="flex flex-col min-h-0 h-full overflow-hidden">
        <ServiceGraphStatusStrip phase={phase} />
        <div className="flex-1 min-h-0 overflow-hidden">
          <EvalsPanel phase={phase} />
        </div>
      </div>
    )
  }

  return <ServiceGraphCanvas phase={phase} />
}
