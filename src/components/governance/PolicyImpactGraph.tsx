/**
 * PolicyImpactGraph
 *
 * Three-column SVG topology for the Mission Control investigation tab:
 *   [ Cohorts ] → [ Policy ] → [ Agents ]
 *
 * Edges are weighted by interaction count and colored by cohort/agent severity.
 * Edge labels sit in white pills so they stay legible where edges cross.
 *
 * Type sizing: every glyph is rendered at fixed CSS pixel sizes (≥14px).
 * To guarantee that, the SVG uses absolute width/height in CSS pixels and
 * NO viewBox — viewBox scaling would silently shrink text on narrow panes.
 * On narrower containers the parent scrolls horizontally; we deliberately
 * choose legibility over fluid responsiveness here because the audience
 * (60+ year old SVPs) reads this without zoom.
 */

import { useMemo } from 'react'

import {
  getImpactForPolicy,
  type AgentRef,
  type Cohort,
  type PolicyId,
  type Severity,
} from '@/data/governance/policyImpact'

// Fixed pixel canvas — no viewBox, no scaling, no font shrink.
// Columns are spread wide enough that edge labels can sit in the gap
// between nodes (centered on each node's own Y) without ever colliding
// with the cohort/agent name stacks that hang below the nodes.
const W = 820
const H = 500
const COL_X = { cohort: 130, policy: 400, agent: 660 } as const
const POLICY_W = 230
const POLICY_H = 84
const COHORT_R = 32
const AGENT_W = 92
const AGENT_H = 62

function severityFill(s: Severity): string {
  switch (s) {
    case 'critical':
      return '#fef0f2'
    case 'warn':
      return '#fff7e0'
    case 'success':
      return '#e9f7f0'
  }
}
function severityStroke(s: Severity): string {
  switch (s) {
    case 'critical':
      return '#c0132f'
    case 'warn':
      return '#b15300'
    case 'success':
      return '#007a5a'
  }
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? `${n} ${one}` : `${n} ${many}`
}

export function PolicyImpactGraph({ policyId }: { policyId: PolicyId }) {
  const impact = useMemo(() => getImpactForPolicy(policyId), [policyId])
  if (!impact) return null
  const { policy, cohorts, agents } = impact

  // Vertical layout — keep room top/bottom for the 3-line label stacks.
  const cohortYs = layoutY(cohorts.length, 120, H - 120)
  const agentYs = layoutY(agents.length, 110, H - 110)
  const policyY = H / 2
  const maxEdge = Math.max(1, ...cohorts.map((c) => c.count), ...agents.map((a) => a.count))

  return (
    <div className="mc-policy-graph">
      <div className="mc-policy-graph__legend" aria-hidden>
        <span>
          <span className="mc-policy-graph__legend-dot" style={{ background: '#c0132f' }} />
          Critical
        </span>
        <span>
          <span className="mc-policy-graph__legend-dot" style={{ background: '#b15300' }} />
          Warn
        </span>
        <span>
          <span className="mc-policy-graph__legend-dot" style={{ background: '#007a5a' }} />
          Healthy
        </span>
      </div>
      <div className="mc-policy-graph__scroller">
        <svg
          width={W}
          height={H}
          className="mc-policy-graph__svg"
          role="img"
          aria-label={`Policy impact graph for ${policy.ref}`}
        >
          {/* edges drawn first so labels overlay them.
              Edge labels are pinned to the column gap, centered on the
              source/target node's Y. This keeps every pill in a clean strip
              that has no other text in it (cohort/agent names live below
              the nodes), so labels never overlap node labels. */}
          {cohorts.map(({ cohort, count }, i) => {
            const y = cohortYs[i]
            const stroke = severityStroke(cohort.severity)
            const width = 1.5 + (count / maxEdge) * 4
            const startX = COL_X.cohort + COHORT_R
            const endX = COL_X.policy - POLICY_W / 2
            const path = curve(startX, y, endX, policyY)
            const labelX = (startX + endX) / 2
            return (
              <g key={`ce-${cohort.id}`}>
                <path d={path} stroke={stroke} strokeWidth={width} fill="none" opacity={0.7} strokeLinecap="round" />
                <EdgeLabel x={labelX} y={y} text={plural(count, 'hit', 'hits')} color={stroke} />
              </g>
            )
          })}

          {agents.map(({ agent, count }, i) => {
            const y = agentYs[i]
            const stroke = severityStroke(agent.status)
            const width = 1.5 + (count / maxEdge) * 4
            const startX = COL_X.policy + POLICY_W / 2
            const endX = COL_X.agent - AGENT_W / 2
            const path = curve(startX, policyY, endX, y)
            const labelX = (startX + endX) / 2
            return (
              <g key={`ae-${agent.id}`}>
                <path d={path} stroke={stroke} strokeWidth={width} fill="none" opacity={0.7} strokeLinecap="round" />
                <EdgeLabel x={labelX} y={y} text={plural(count, 'route', 'routes')} color={stroke} />
              </g>
            )
          })}

          {cohorts.map(({ cohort }, i) => (
            <CohortNode key={cohort.id} cohort={cohort} x={COL_X.cohort} y={cohortYs[i]} />
          ))}
          <PolicyNode x={COL_X.policy} y={policyY} ref_={policy.ref} title={policy.title} />
          {agents.map(({ agent }, i) => (
            <AgentNode key={agent.id} agent={agent} x={COL_X.agent} y={agentYs[i]} />
          ))}

          {/* column headers */}
          <text x={COL_X.cohort} y={42} fontSize="16" fontWeight="700" fill="#1d1c1d" textAnchor="middle" letterSpacing="1.6">
            USER COHORTS
          </text>
          <text x={COL_X.policy} y={42} fontSize="16" fontWeight="700" fill="#1d1c1d" textAnchor="middle" letterSpacing="1.6">
            POLICY
          </text>
          <text x={COL_X.agent} y={42} fontSize="16" fontWeight="700" fill="#1d1c1d" textAnchor="middle" letterSpacing="1.6">
            AGENTS
          </text>
        </svg>
      </div>
    </div>
  )
}

function layoutY(n: number, top: number, bottom: number): number[] {
  if (n <= 0) return []
  if (n === 1) return [(top + bottom) / 2]
  const step = (bottom - top) / (n - 1)
  return Array.from({ length: n }, (_, i) => top + i * step)
}

function curve(x1: number, y1: number, x2: number, y2: number) {
  const cx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
}

function EdgeLabel({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  // 14px font, ~7.6px per char. Pad horizontal generously.
  const padX = 12
  const w = text.length * 7.6 + padX * 2
  const h = 26
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill="#ffffff"
        stroke={color}
        strokeOpacity={0.45}
        strokeWidth={1.2}
      />
      <text x={x} y={y + 5} fontSize="14" fill={color} fontWeight="700" textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

function CohortNode({ cohort, x, y }: { cohort: Cohort; x: number; y: number }) {
  const fill = severityFill(cohort.severity)
  const stroke = severityStroke(cohort.severity)
  return (
    <g>
      <circle cx={x} cy={y} r={COHORT_R} fill={fill} stroke={stroke} strokeWidth={2} />
      <text x={x} y={y + 7} fontSize="22" fontWeight="700" fill={stroke} textAnchor="middle">
        {cohort.exposedPerHour}
      </text>
      <text x={x} y={y + COHORT_R + 22} fontSize="15" fontWeight="700" fill="#1d1c1d" textAnchor="middle">
        {cohort.label}
      </text>
      <text x={x} y={y + COHORT_R + 40} fontSize="14" fill="#454245" textAnchor="middle">
        {cohort.scope.split(' · ').slice(0, 2).join(' · ')}
      </text>
      <text x={x} y={y + COHORT_R + 56} fontSize="14" fill="#616061" textAnchor="middle">
        users/hr exposed
      </text>
    </g>
  )
}

function PolicyNode({ x, y, ref_, title }: { x: number; y: number; ref_: string; title: string }) {
  return (
    <g>
      <rect
        x={x - POLICY_W / 2}
        y={y - POLICY_H / 2}
        width={POLICY_W}
        height={POLICY_H}
        rx={12}
        fill="#eef4fb"
        stroke="#1264a3"
        strokeWidth={2}
      />
      <text
        x={x}
        y={y - 4}
        fontSize="16"
        fontWeight="700"
        fill="#1264a3"
        textAnchor="middle"
        fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace"
      >
        {ref_}
      </text>
      <text x={x} y={y + 20} fontSize="14" fill="#1264a3" textAnchor="middle">
        {title}
      </text>
    </g>
  )
}

function AgentNode({ agent, x, y }: { agent: AgentRef; x: number; y: number }) {
  const fill = severityFill(agent.status)
  const stroke = severityStroke(agent.status)
  return (
    <g>
      <rect
        x={x - AGENT_W / 2}
        y={y - AGENT_H / 2}
        width={AGENT_W}
        height={AGENT_H}
        rx={10}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
      <text x={x} y={y + 4} fontSize="16" fontWeight="700" fill={stroke} textAnchor="middle">
        {agent.cluster}
      </text>
      <text x={x} y={y + 22} fontSize="14" fill={stroke} textAnchor="middle">
        cluster
      </text>
      <text x={x} y={y + AGENT_H / 2 + 22} fontSize="15" fontWeight="700" fill="#1d1c1d" textAnchor="middle">
        {truncate(agent.name, 22)}
      </text>
    </g>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}
