/**
 * PolicyImpactGraph
 *
 * Three-column SVG topology for the Mission Control investigation tab:
 *   [ Cohorts ] → [ Policy ] → [ Agents ]
 *
 * Edges are weighted by interaction count and colored by cohort/agent severity.
 * Edge labels sit in white pills so they stay legible where edges cross.
 *
 * Sizing: the SVG uses a viewBox so it scales crisply with the container and
 * with the zoom toolbar. Default zoom (1.0) fits a comfortable 820×460 canvas.
 * Zooming sets explicit pixel width/height on the SVG so the surrounding
 * scroller can handle pan when the viewer wants more detail.
 */

import { useMemo, useState } from 'react'

import {
  getImpactForPolicy,
  type AgentRef,
  type Cohort,
  type PolicyId,
  type Severity,
} from '@/data/governance/policyImpact'

// ── Canvas geometry (in viewBox units) ──────────────────────────────────────
const VIEW_W = 820
const VIEW_H = 460
const COL_X = { cohort: 110, policy: 410, agent: 700 } as const
const POLICY_W = 220
const POLICY_H = 70
const COHORT_R = 26
const AGENT_W = 96
const AGENT_H = 54

// ── Zoom ────────────────────────────────────────────────────────────────────
const ZOOM_MIN = 0.6
const ZOOM_MAX = 2
const ZOOM_STEP = 0.2

function severityFill(s: Severity): string {
  switch (s) {
    case 'critical':
      return '#fdecef'
    case 'warn':
      return '#fff5dd'
    case 'success':
      return '#e6f5ee'
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

export function PolicyImpactGraph({ policyId }: { policyId: PolicyId }) {
  const impact = useMemo(() => getImpactForPolicy(policyId), [policyId])
  const [zoom, setZoom] = useState(1)

  if (!impact) return null
  const { policy, cohorts, agents } = impact

  const cohortYs = layoutY(cohorts.length, 96, VIEW_H - 78)
  const agentYs = layoutY(agents.length, 88, VIEW_H - 70)
  const policyY = VIEW_H / 2
  const maxEdge = Math.max(1, ...cohorts.map((c) => c.count), ...agents.map((a) => a.count))

  const handleZoomIn = () =>
    setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
  const handleZoomOut = () =>
    setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
  const handleZoomReset = () => setZoom(1)

  return (
    <div className="mc-policy-graph">
      <div className="mc-policy-graph__toolbar">
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
        <div className="mc-policy-graph__zoom" role="group" aria-label="Zoom controls">
          <button
            type="button"
            className="mc-policy-graph__zoom-btn"
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="mc-policy-graph__zoom-level"
            onClick={handleZoomReset}
            aria-label={`Reset zoom (currently ${Math.round(zoom * 100)} percent)`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="mc-policy-graph__zoom-btn"
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>
      <div className="mc-policy-graph__scroller">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width={VIEW_W * zoom}
          height={VIEW_H * zoom}
          className="mc-policy-graph__svg"
          role="img"
          aria-label={`Policy impact graph for ${policy.ref}`}
        >
          {/* edges drawn first so labels overlay them. */}
          {cohorts.map(({ cohort, count }, i) => {
            const y = cohortYs[i]
            const stroke = severityStroke(cohort.severity)
            const width = 1.25 + (count / maxEdge) * 3
            const startX = COL_X.cohort + COHORT_R
            const endX = COL_X.policy - POLICY_W / 2
            const path = curve(startX, y, endX, policyY)
            const labelX = (startX + endX) / 2
            return (
              <g key={`ce-${cohort.id}`}>
                <path
                  d={path}
                  stroke={stroke}
                  strokeWidth={width}
                  fill="none"
                  opacity={0.55}
                  strokeLinecap="round"
                />
                <EdgeLabel x={labelX} y={y} text={String(count)} color={stroke} />
              </g>
            )
          })}

          {agents.map(({ agent, count }, i) => {
            const y = agentYs[i]
            const stroke = severityStroke(agent.status)
            const width = 1.25 + (count / maxEdge) * 3
            const startX = COL_X.policy + POLICY_W / 2
            const endX = COL_X.agent - AGENT_W / 2
            const path = curve(startX, policyY, endX, y)
            const labelX = (startX + endX) / 2
            return (
              <g key={`ae-${agent.id}`}>
                <path
                  d={path}
                  stroke={stroke}
                  strokeWidth={width}
                  fill="none"
                  opacity={0.55}
                  strokeLinecap="round"
                />
                <EdgeLabel x={labelX} y={y} text={String(count)} color={stroke} />
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

          {/* slim column captions, top-aligned */}
          <ColumnCaption x={COL_X.cohort} text="Cohorts" />
          <ColumnCaption x={COL_X.policy} text="Policy" />
          <ColumnCaption x={COL_X.agent} text="Agents" />
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

function ColumnCaption({ x, text }: { x: number; text: string }) {
  return (
    <text
      x={x}
      y={36}
      fontSize="12"
      fontWeight="600"
      fill="#616061"
      textAnchor="middle"
      letterSpacing="1.4"
    >
      {text.toUpperCase()}
    </text>
  )
}

function EdgeLabel({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  // Numeric-only label: small circular pill.
  const w = Math.max(28, text.length * 8 + 14)
  const h = 22
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
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <text
        x={x}
        y={y + 4}
        fontSize="12"
        fill={color}
        fontWeight="700"
        textAnchor="middle"
      >
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
      <circle cx={x} cy={y} r={COHORT_R} fill={fill} stroke={stroke} strokeWidth={1.75} />
      <text
        x={x}
        y={y + 6}
        fontSize="18"
        fontWeight="700"
        fill={stroke}
        textAnchor="middle"
      >
        {cohort.exposedPerHour}
      </text>
      <text
        x={x}
        y={y + COHORT_R + 18}
        fontSize="13"
        fontWeight="600"
        fill="#1d1c1d"
        textAnchor="middle"
      >
        {cohort.label}
      </text>
    </g>
  )
}

function PolicyNode({
  x,
  y,
  ref_,
  title,
}: {
  x: number
  y: number
  ref_: string
  title: string
}) {
  return (
    <g>
      <rect
        x={x - POLICY_W / 2}
        y={y - POLICY_H / 2}
        width={POLICY_W}
        height={POLICY_H}
        rx={10}
        fill="#eef4fb"
        stroke="#1264a3"
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y - 4}
        fontSize="13"
        fontWeight="700"
        fill="#1264a3"
        textAnchor="middle"
        fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace"
      >
        {ref_}
      </text>
      <text x={x} y={y + 16} fontSize="13" fill="#1264a3" textAnchor="middle">
        {truncate(title, 32)}
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
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y + 4}
        fontSize="13"
        fontWeight="700"
        fill={stroke}
        textAnchor="middle"
      >
        {agent.cluster}
      </text>
      <text
        x={x}
        y={y + AGENT_H / 2 + 16}
        fontSize="12"
        fontWeight="500"
        fill="#454245"
        textAnchor="middle"
      >
        {truncate(agent.name, 18)}
      </text>
    </g>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}
