/**
 * ServiceGraphCanvas — Slack-styled port of the web app's BlastRadiusGraph.
 *
 * Renders the Order Processing Agent service graph (USW-7) and reacts to
 * the current `phase` to show traffic stop, retrain, and deploy states.
 *
 * Used inside the dual-viewport center pane during the Slack demo to give
 * the user a live visual of what Mission Control Agent is doing in the chat.
 */

import { type CSSProperties } from 'react'

export type ServicePhase =
  | 'alert' // before stop traffic — degraded
  | 'stopping' // stop-traffic in flight
  | 'stopped' // 0% traffic, fallback active
  | 'retraining' // retrain pipeline running (evals overlay shows)
  | 'retrain-complete' // retrain done, ready to deploy
  | 'deploying' // promoting to prod
  | 'healthy' // back to nominal

type NodeVisual = 'default' | 'warn' | 'affected' | 'disabled' | 'processing' | 'healthy'
type EdgeVisual = 'default' | 'alert' | 'alert-warn' | 'muted' | 'dim' | 'processing' | 'healthy'

function deriveVisuals(phase: ServicePhase) {
  const n = {
    orderAgent: 'default' as NodeVisual,
    llmRouting: 'default' as NodeVisual,
    evaluator: 'default' as NodeVisual,
    storeCustomers: 'default' as NodeVisual,
    responseOrch: 'default' as NodeVisual,
    compliance: 'default' as NodeVisual,
  }
  const e = {
    storeToGw: 'default' as EdgeVisual,
    gwToOrder: 'default' as EdgeVisual,
    orderToLlm: 'default' as EdgeVisual,
    orderToResponse: 'default' as EdgeVisual,
    orderToEval: 'default' as EdgeVisual,
    evalToZendesk: 'default' as EdgeVisual,
    compToEval: 'muted' as EdgeVisual,
  }

  switch (phase) {
    case 'alert':
      n.orderAgent = 'warn'
      n.llmRouting = 'affected'
      n.evaluator = 'warn'
      n.storeCustomers = 'affected'
      e.storeToGw = 'alert-warn'
      e.gwToOrder = 'alert'
      e.orderToLlm = 'alert-warn'
      e.orderToEval = 'alert-warn'
      break

    case 'stopping':
      n.orderAgent = 'warn'
      e.storeToGw = 'alert-warn'
      e.gwToOrder = 'processing'
      e.orderToLlm = 'dim'
      e.orderToResponse = 'dim'
      e.orderToEval = 'dim'
      break

    case 'stopped':
      n.orderAgent = 'disabled'
      e.storeToGw = 'dim'
      e.gwToOrder = 'dim'
      e.orderToLlm = 'dim'
      e.orderToResponse = 'dim'
      e.orderToEval = 'dim'
      break

    case 'retraining':
      n.orderAgent = 'disabled'
      n.evaluator = 'processing'
      e.storeToGw = 'dim'
      e.gwToOrder = 'dim'
      e.orderToLlm = 'dim'
      e.orderToResponse = 'dim'
      e.orderToEval = 'processing'
      e.compToEval = 'processing'
      break

    case 'retrain-complete':
      n.orderAgent = 'disabled'
      n.evaluator = 'healthy'
      e.storeToGw = 'dim'
      e.gwToOrder = 'dim'
      e.orderToLlm = 'dim'
      e.orderToResponse = 'dim'
      e.orderToEval = 'dim'
      break

    case 'deploying':
      n.orderAgent = 'processing'
      n.evaluator = 'healthy'
      e.storeToGw = 'dim'
      e.gwToOrder = 'processing'
      e.orderToLlm = 'dim'
      e.orderToResponse = 'dim'
      e.orderToEval = 'dim'
      break

    case 'healthy':
      n.orderAgent = 'healthy'
      n.llmRouting = 'healthy'
      n.evaluator = 'healthy'
      n.responseOrch = 'healthy'
      e.storeToGw = 'healthy'
      e.gwToOrder = 'healthy'
      e.orderToLlm = 'healthy'
      e.orderToResponse = 'healthy'
      e.orderToEval = 'healthy'
      e.evalToZendesk = 'healthy'
      e.compToEval = 'healthy'
      break
  }

  return { n, e }
}

const EDGE_TOKENS: Record<EdgeVisual, { color: string; width: number; animated: boolean; dashed: boolean }> = {
  default: { color: 'var(--slack-border)', width: 1.5, animated: false, dashed: false },
  alert: { color: 'var(--mc-critical)', width: 2.25, animated: true, dashed: false },
  'alert-warn': { color: 'var(--mc-warn-amber)', width: 2.25, animated: true, dashed: false },
  muted: { color: '#d4d4d4', width: 1, animated: false, dashed: false },
  dim: { color: '#e4e4e4', width: 1, animated: false, dashed: true },
  processing: { color: 'var(--mc-accent)', width: 2, animated: true, dashed: false },
  healthy: { color: 'var(--mc-success)', width: 2, animated: false, dashed: false },
}

export function ServiceGraphCanvas({
  phase,
  collapsed = false,
}: {
  phase: ServicePhase
  collapsed?: boolean
}) {
  const { n, e } = deriveVisuals(phase)
  const isStopped = phase === 'stopped' || phase === 'retraining' || phase === 'retrain-complete'

  if (collapsed) {
    return <ServiceGraphStatusStrip phase={phase} />
  }

  return (
    <div className="sgc-root flex flex-col min-h-0 h-full overflow-hidden">
      <style>{`
        @keyframes sgc-edge-flow {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }
        .sgc-edge-animated {
          stroke-dasharray: 6 4;
          animation: sgc-edge-flow 0.8s linear infinite;
        }
        @keyframes sgc-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(18, 100, 163, 0.45); }
          50% { box-shadow: 0 0 0 6px rgba(18, 100, 163, 0); }
        }
        .sgc-node-processing { animation: sgc-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--slack-border)', backgroundColor: 'var(--slack-pane-bg)' }}
      >
        <span className="text-sm font-bold m-0" style={{ color: 'var(--slack-text)' }}>
          Service Graph · USW-7
        </span>
        <PhaseBadge phase={phase} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto" style={{ backgroundColor: '#fafafa' }}>
        <div className="sgc-map relative" style={{ width: 920, height: 560, margin: '0 auto' }}>
          <svg className="absolute inset-0 pointer-events-none" width={920} height={560} viewBox="0 0 920 560">
            <Edge d="M 80 140 L 290 255" visual="muted" />
            <Edge d="M 80 280 L 290 255" visual={e.storeToGw} />
            <Edge d="M 80 420 L 290 255" visual="muted" />

            <Edge d="M 290 255 L 490 255" visual={e.gwToOrder} />

            <Edge d="M 490 255 L 690 160" visual={e.orderToLlm} />
            <Edge d="M 490 255 L 690 280" visual={e.orderToResponse} />
            <Edge d="M 490 255 L 690 400" visual={e.orderToEval} />

            <Edge d="M 690 280 L 850 200" visual="muted" />
            <Edge d="M 690 280 L 850 355" visual="muted" />
            <Edge d="M 690 160 L 850 80" visual="muted" />
            <Edge d="M 690 400 L 850 460" visual={e.evalToZendesk} />

            <Edge d="M 290 255 L 290 450" visual="muted" />
            <Edge d="M 290 450 L 690 400" visual={e.compToEval} />
          </svg>

          <Node x={80} y={140} title="Enterprise users" subtitle="SSO · SAML" small />
          <Node x={80} y={280} title="Store customers" subtitle="Chat widget" small visual={n.storeCustomers} />
          <Node x={80} y={420} title="Mobile clients" subtitle="iOS / Android" small />

          <Node x={290} y={255} title="API Gateway" subtitle="Rate limits · OAuth" />

          <Node
            x={490}
            y={255}
            title="Order Processing Agent"
            subtitle={isStopped ? 'Traffic stopped' : 'US production'}
            visual={n.orderAgent}
            emphasis
          />

          <Node x={690} y={160} title="LLM Routing Agent" subtitle="Primary + fallback" visual={n.llmRouting} />
          <Node x={690} y={280} title="Response Orchestrator" subtitle="Synthesis + policy" visual={n.responseOrch} />
          <Node x={690} y={400} title="Evaluator Agent" subtitle="Golden sets · RAG" visual={n.evaluator} />

          <Node x={850} y={80} title="Knowledge Base" subtitle="Vector store" small />
          <Node x={850} y={200} title="Salesforce CRM" subtitle="Account graph" small />
          <Node x={850} y={355} title="Snowflake" subtitle="Telemetry lake" small />
          <Node x={850} y={460} title="Zendesk Bridge" subtitle="Ticket enrichment" small />

          <Node x={290} y={450} title="Compliance Agent" subtitle="Policy enforcement" visual={n.compliance} />
        </div>
      </div>
    </div>
  )
}

/** Compact status strip used at the top of the canvas during retrain. */
export function ServiceGraphStatusStrip({ phase }: { phase: ServicePhase }) {
  const { label, sub, dotColor } = strpStatusForPhase(phase)
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
      style={{
        borderBottom: '1px solid var(--slack-border)',
        backgroundColor: '#fafafa',
      }}
    >
      <span className="inline-block size-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold m-0" style={{ color: 'var(--slack-text)' }}>
          {label}
        </span>
        <span className="text-xs m-0 ml-1.5" style={{ color: 'var(--slack-msg-muted)' }}>
          · {sub}
        </span>
      </div>
      <span
        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
        style={{ backgroundColor: '#eef4f8', color: 'var(--mc-accent)' }}
      >
        Service Graph · USW-7
      </span>
    </div>
  )
}

function strpStatusForPhase(phase: ServicePhase) {
  switch (phase) {
    case 'retraining':
      return {
        label: 'Order Processing Agent · paused',
        sub: '0% live traffic · fallback active · retraining in progress',
        dotColor: 'var(--mc-warn-amber)',
      }
    case 'retrain-complete':
      return {
        label: 'Order Processing Agent · paused',
        sub: 'Retrain complete · awaiting deploy approval',
        dotColor: 'var(--mc-accent)',
      }
    default:
      return {
        label: 'Order Processing Agent',
        sub: 'Service Graph view',
        dotColor: 'var(--mc-success)',
      }
  }
}

function PhaseBadge({ phase }: { phase: ServicePhase }) {
  const { label, color, bg } = phaseBadgeStyle(phase)
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  )
}

function phaseBadgeStyle(phase: ServicePhase): { label: string; color: string; bg: string } {
  switch (phase) {
    case 'alert':
      return { label: 'Critical · Live', color: 'var(--mc-critical)', bg: '#fef0f2' }
    case 'stopping':
      return { label: 'Stopping traffic', color: 'var(--mc-warn-amber)', bg: '#fff7e0' }
    case 'stopped':
      return { label: 'Traffic stopped', color: 'var(--mc-warn-amber)', bg: '#fff7e0' }
    case 'retraining':
      return { label: 'Retraining', color: 'var(--mc-accent)', bg: '#eef4f8' }
    case 'retrain-complete':
      return { label: 'Retrain complete', color: 'var(--mc-accent)', bg: '#eef4f8' }
    case 'deploying':
      return { label: 'Deploying', color: 'var(--mc-accent)', bg: '#eef4f8' }
    case 'healthy':
      return { label: 'Healthy', color: 'var(--mc-success)', bg: '#e8f5ef' }
  }
}

function Edge({ d, visual = 'default' }: { d: string; visual?: EdgeVisual }) {
  const t = EDGE_TOKENS[visual]
  const dashArray = t.dashed ? '4 6' : t.animated ? '6 4' : undefined
  return (
    <path
      d={d}
      fill="none"
      stroke={t.color}
      strokeWidth={t.width}
      strokeDasharray={dashArray}
      strokeLinecap="round"
      className={t.animated ? 'sgc-edge-animated' : ''}
      style={{ transition: 'stroke 0.5s ease, stroke-width 0.4s ease, opacity 0.4s ease' }}
    />
  )
}

function Node({
  x,
  y,
  title,
  subtitle,
  small,
  visual = 'default',
  emphasis,
}: {
  x: number
  y: number
  title: string
  subtitle: string
  small?: boolean
  visual?: NodeVisual
  emphasis?: boolean
}) {
  const w = small ? 130 : emphasis ? 180 : 160
  const h = 48

  let border = '1px solid var(--slack-border)'
  let bg = 'var(--slack-pane-bg)'
  let titleColor = 'var(--slack-text)'
  let subColor = 'var(--slack-msg-muted)'
  let strike = false
  let processing = false

  switch (visual) {
    case 'warn':
      border = '2px solid var(--mc-warn-amber)'
      bg = '#fffaf0'
      break
    case 'affected':
      border = '1.5px solid #f0d9a8'
      bg = '#fffaf0'
      break
    case 'disabled':
      border = '1.5px dashed #c7c7c7'
      bg = '#f5f5f5'
      titleColor = '#9e9e9e'
      subColor = '#9e9e9e'
      strike = true
      break
    case 'processing':
      border = '2px solid var(--mc-accent)'
      bg = '#f3f9fd'
      processing = true
      break
    case 'healthy':
      border = '2px solid var(--mc-success)'
      bg = '#f0faf6'
      break
  }

  const style: CSSProperties = {
    position: 'absolute',
    left: x - w / 2,
    top: y - h / 2,
    width: w,
    height: h,
    border,
    backgroundColor: bg,
    borderRadius: 8,
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: emphasis ? '0 2px 6px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.03)',
    transition: 'border 0.4s ease, background-color 0.4s ease, box-shadow 0.4s ease',
  }

  return (
    <div style={style} className={processing ? 'sgc-node-processing' : ''}>
      <div
        style={{
          fontSize: small ? 11 : 12.5,
          fontWeight: 700,
          color: titleColor,
          textDecoration: strike ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: subColor,
          marginTop: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}
