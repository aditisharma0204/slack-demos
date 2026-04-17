import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { ChatHeader } from '@/components/chat/ChatHeader'
import { InvestigationCanvas } from '@/components/demo/InvestigationCanvas'
import { SecondaryButton } from '@/components/ui/DesignSystemButtons'

type FleetSite = {
  id: string
  lat: number
  lng: number
  ok: boolean
  label: string
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildNorthAmericaFleetSites(): FleetSite[] {
  const rand = mulberry32(0x9e3779b1)
  const greens: FleetSite[] = []
  for (let i = 0; i < 44; i++) {
    const lat = 26 + rand() * 22.5
    const lng = -123.8 + rand() * 56.5
    greens.push({
      id: `ok-${i}`,
      lat,
      lng,
      ok: true,
      label: `Healthy agent · ${lat.toFixed(1)}°, ${lng.toFixed(1)}°`,
    })
  }
  const reds: FleetSite[] = [
    { id: 'critical-midwest', lat: 39.1, lng: -94.58, ok: false, label: 'US Central · retrieval degraded' },
    { id: 'critical-south', lat: 32.78, lng: -96.8, ok: false, label: 'US South · policy strain' },
    { id: 'critical-east', lat: 40.72, lng: -74.02, ok: false, label: 'US East · Order Processing breach' },
  ]
  return [...greens, ...reds]
}

const FLEET_SITES: FleetSite[] = buildNorthAmericaFleetSites()

const NA_MAP_CENTER: LatLngExpression = [42, -98]
const NA_MAP_ZOOM = 4
const NA_MAX_BOUNDS: LatLngBoundsExpression = [
  [18, -132],
  [58, -58],
]

function MapResizeInvalidator() {
  const map = useMap()
  useEffect(() => {
    const c = map.getContainer()
    const parent = c.parentElement
    if (!parent) return
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(parent)
    const t = window.setTimeout(() => map.invalidateSize(), 50)
    return () => {
      window.clearTimeout(t)
      ro.disconnect()
    }
  }, [map])
  return null
}

function WarningsSparkline({ gradId }: { gradId: string }) {
  const h = 52
  const w = 128
  const pts = [40, 34, 30, 36, 24, 20, 10]
  const step = w / (pts.length - 1)
  const d = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${y}`).join(' ')
  return (
    <figure className="flex flex-col items-start justify-start gap-1 m-0">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mc-critical)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--mc-critical)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${gradId})`} />
        <path
          d={d}
          fill="none"
          stroke="var(--mc-critical)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <figcaption className="mc-type-caption text-right m-0">Last 24h · sampled every 15m</figcaption>
    </figure>
  )
}

function FleetStatsGrid() {
  const barData = [38, 40, 36, 42, 39, 44, 48, 54, 62, 80]
  const maxBar = Math.max(...barData)
  const trustPath = 'M 0 38 C 20 38 40 36 60 34 C 80 32 100 30 120 28 C 140 26 160 22 180 14 C 195 8 205 4 220 2'

  const statCard =
    'rounded-xl border px-4 py-3.5 flex flex-col gap-2 min-h-0 transition-shadow hover:shadow-sm'
  const cardBorder = { border: '1px solid var(--slack-border)', backgroundColor: 'var(--slack-pane-bg)' }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className={statCard} style={cardBorder}>
        <div className="flex items-center justify-between gap-2">
          <span className="mc-type-meta font-semibold m-0" style={{ color: 'var(--mc-muted-strong)' }}>
            Total requests
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--mc-success)' }}>
            &#8593; 12%
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: 'var(--slack-text)' }}>
            14.2M
          </span>
          <span className="mc-type-meta m-0">/min</span>
        </div>
        <div className="flex items-end gap-[3px] h-8 mt-1" aria-hidden>
          {barData.map((v, i) => {
            const pct = (v / maxBar) * 100
            const isLast = i === barData.length - 1
            return (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${pct}%`,
                  backgroundColor: isLast ? 'var(--mc-success)' : `rgba(0, 122, 90, ${0.15 + (i / barData.length) * 0.35})`,
                }}
              />
            )
          })}
        </div>
      </div>

      <div className={statCard} style={cardBorder}>
        <span className="mc-type-meta font-semibold m-0" style={{ color: 'var(--mc-muted-strong)' }}>
          Trust score trend
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: 'var(--slack-text)' }}>
            98.7%
          </span>
          <span className="mc-type-meta m-0">North America avg</span>
        </div>
        <svg className="w-full mt-1" height="42" viewBox="0 0 220 42" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="mc-trust-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--mc-accent)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--mc-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${trustPath} L 220 42 L 0 42 Z`} fill="url(#mc-trust-grad)" />
          <path d={trustPath} fill="none" stroke="var(--mc-accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className={statCard} style={cardBorder}>
        <div className="flex flex-col gap-2">
          <div>
            <span className="mc-type-meta font-semibold m-0 block" style={{ color: 'var(--mc-muted-strong)' }}>
              Active sessions
            </span>
            <span className="text-[28px] font-extrabold leading-none tracking-tight mt-1.5 block" style={{ color: 'var(--slack-text)' }}>
              42,891
            </span>
          </div>
          <div className="pt-2 border-t" style={{ borderColor: 'var(--mc-divider)' }}>
            <span className="mc-type-meta font-semibold m-0 block" style={{ color: 'var(--mc-muted-strong)' }}>
              System latency
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: 'var(--slack-text)' }}>
                124ms
              </span>
              <span className="mc-type-meta m-0">avg across North America</span>
            </div>
          </div>
        </div>
      </div>

      <div className={statCard} style={cardBorder}>
        <div className="flex items-center gap-2">
          <span className="mc-type-meta font-bold m-0" style={{ color: 'var(--slack-text)', fontSize: 'var(--slack-font-lg)' }}>
            Agent clusters
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--mc-tier3-border)', color: 'var(--mc-muted-strong)' }}
          >
            43 total
          </span>
        </div>
        <span className="mc-type-meta m-0">Canada &middot; United States &middot; Mexico</span>
        <ul className="list-none m-0 p-0 space-y-1.5 mt-1">
          {([
            { label: 'Healthy', count: 42, color: 'var(--mc-success)' },
            { label: 'Urgent', count: 1, color: 'var(--mc-critical)' },
            { label: 'Warning', count: 2, color: 'var(--mc-warn-amber)' },
          ] as const).map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                <span className="mc-type-body font-medium" style={{ color: row.color }}>{row.label}</span>
              </span>
              <span className="mc-type-body font-bold" style={{ color: 'var(--slack-text)' }}>{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function AgentFleetMap({
  onSelectProblem,
}: {
  onSelectProblem: (site: FleetSite) => void
}) {
  const criticalSites = FLEET_SITES.filter((s) => !s.ok)

  return (
    <div className="mc-map-panel">
      <MapContainer
        className="mc-map-leaflet flex-1 min-h-[14rem] w-full min-w-0"
        style={{ width: '100%' }}
        center={NA_MAP_CENTER}
        zoom={NA_MAP_ZOOM}
        minZoom={3}
        maxZoom={12}
        maxBounds={NA_MAX_BOUNDS}
        maxBoundsViscosity={0.9}
        scrollWheelZoom
        zoomControl={false}
        aria-label="North America fleet map. Scroll to zoom, drag to pan. Click a red pin to open incident details."
      >
        <MapResizeInvalidator />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <ZoomControl position="bottomright" />
        {FLEET_SITES.map((s) =>
          s.ok ? (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={4}
              pathOptions={{
                interactive: false,
                fillColor: '#007a5a',
                fillOpacity: 0.92,
                color: '#ffffff',
                weight: 1.25,
                opacity: 1,
              }}
            />
          ) : (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={9}
              pathOptions={{
                interactive: true,
                className: 'mc-map-leaflet-critical-pin',
                fillColor: '#c0132f',
                fillOpacity: 1,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
              }}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent?.stopPropagation?.()
                  onSelectProblem(s)
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95} sticky>
                {s.label}
              </Tooltip>
            </CircleMarker>
          )
        )}
      </MapContainer>

      <div className="mc-map-floating-chrome">
        <div className="mc-map-floating-title">
          <p className="mc-type-overline m-0" style={{ color: 'var(--mc-muted-strong)' }}>
            North America fleet
          </p>
          <p className="mc-type-caption m-0 mt-0.5">
            Scroll to zoom · drag to pan · click a red pin for incident details
          </p>
        </div>
        <div className="mc-map-floating-legend" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: 'var(--mc-success)' }} />
            OK
          </span>
          <span className="opacity-35">|</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: 'var(--mc-critical)' }} />
            Issue
          </span>
        </div>
      </div>

      <div className="sr-only">
        <p>Keyboard shortcuts: use the links below to open each active incident without using the map.</p>
        <ul className="m-0 p-0 list-none space-y-1">
          {criticalSites.map((s) => (
            <li key={s.id}>
              <button type="button" className="underline text-left" onClick={() => onSelectProblem(s)}>
                Open incident: {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── Agent Hub Topology ── */

type TopoNode = {
  id: string
  label: string
  sub?: string
  x: number
  y: number
  kind: 'gateway' | 'hub' | 'agent'
  status: 'ok' | 'warning' | 'critical'
}

type TopoEdge = { from: string; to: string; dashed?: boolean; color?: string }

const TOPO_NODES: TopoNode[] = [
  { id: 'gw', label: 'US enterprise entry', x: 480, y: 360, kind: 'gateway', status: 'ok' },
  { id: 'usw-hub', label: 'US West hub', sub: 'Router Node', x: 290, y: 200, kind: 'hub', status: 'ok' },
  { id: 'use-hub', label: 'US East hub', sub: 'Router Node', x: 680, y: 200, kind: 'hub', status: 'ok' },
  { id: 'qa-hub', label: 'Internal QA Auth', sub: 'Router Node', x: 480, y: 530, kind: 'hub', status: 'ok' },
  { id: 'usw-1', label: 'Agent USW-1', x: 135, y: 70, kind: 'agent', status: 'ok' },
  { id: 'usw-2', label: 'Agent USW-2', x: 300, y: 50, kind: 'agent', status: 'ok' },
  { id: 'usw-3', label: 'Agent USW-3', x: 440, y: 90, kind: 'agent', status: 'ok' },
  { id: 'usw-4', label: 'Agent USW-4', x: 100, y: 195, kind: 'agent', status: 'ok' },
  { id: 'usw-5', label: 'Agent USW-5', x: 170, y: 305, kind: 'agent', status: 'ok' },
  { id: 'usw-6', label: 'Agent USW-6', x: 280, y: 350, kind: 'agent', status: 'ok' },
  { id: 'usw-7', label: 'Agent USW-7', x: 400, y: 290, kind: 'agent', status: 'critical' },
  { id: 'usw-8', label: 'Agent USW-8', x: 40, y: 285, kind: 'agent', status: 'ok' },
  { id: 'use-1', label: 'Agent USE-1', x: 600, y: 90, kind: 'agent', status: 'ok' },
  { id: 'use-2', label: 'Agent USE-2', x: 700, y: 55, kind: 'agent', status: 'ok' },
  { id: 'use-3', label: 'Agent USE-3', x: 860, y: 80, kind: 'agent', status: 'ok' },
  { id: 'use-4', label: 'Agent USE-4', x: 870, y: 195, kind: 'agent', status: 'ok' },
  { id: 'use-5', label: 'Agent USE-5', x: 830, y: 310, kind: 'agent', status: 'ok' },
  { id: 'use-6', label: 'Agent USE-6', x: 700, y: 345, kind: 'agent', status: 'ok' },
  { id: 'qa-1', label: 'Agent QA-1', x: 340, y: 650, kind: 'agent', status: 'ok' },
  { id: 'qa-2', label: 'Agent QA-2', x: 460, y: 670, kind: 'agent', status: 'ok' },
  { id: 'qa-3', label: 'Agent QA-3', x: 550, y: 670, kind: 'agent', status: 'ok' },
  { id: 'qa-4', label: 'Agent QA-4', x: 630, y: 650, kind: 'agent', status: 'ok' },
]

const TOPO_EDGES: TopoEdge[] = [
  { from: 'gw', to: 'usw-hub', dashed: true },
  { from: 'gw', to: 'use-hub', dashed: true },
  { from: 'gw', to: 'qa-hub', dashed: true },
  { from: 'usw-hub', to: 'usw-1' }, { from: 'usw-hub', to: 'usw-2' }, { from: 'usw-hub', to: 'usw-3' },
  { from: 'usw-hub', to: 'usw-4' }, { from: 'usw-hub', to: 'usw-5' }, { from: 'usw-hub', to: 'usw-6' },
  { from: 'usw-hub', to: 'usw-7', dashed: true, color: 'var(--mc-warn-amber)' },
  { from: 'usw-hub', to: 'usw-8' },
  { from: 'use-hub', to: 'use-1' }, { from: 'use-hub', to: 'use-2' }, { from: 'use-hub', to: 'use-3' },
  { from: 'use-hub', to: 'use-4' }, { from: 'use-hub', to: 'use-5' }, { from: 'use-hub', to: 'use-6' },
  { from: 'qa-hub', to: 'qa-1' }, { from: 'qa-hub', to: 'qa-2' },
  { from: 'qa-hub', to: 'qa-3' }, { from: 'qa-hub', to: 'qa-4' },
]

const USW7_AGENTS = [
  { name: 'Order Processing Agent', sub: 'US production \u00b7 Retail', status: 'critical' as const, statusLabel: 'Policy breach detected', actionLabel: 'Stop traffic' },
  { name: 'Response Orchestrator Agent', sub: 'Synthesis + policy', status: 'ok' as const, statusLabel: 'Nominal' },
  { name: 'LLM Routing Agent', sub: 'Primary + fallback', status: 'warning' as const, statusLabel: 'Elevated latency' },
  { name: 'Evaluator Agent', sub: 'Golden sets \u00b7 RAG', status: 'warning' as const, statusLabel: 'Drift detected' },
  { name: 'Compliance Agent', sub: 'Policy enforcement', status: 'ok' as const, statusLabel: 'Nominal' },
  { name: 'Knowledge Base Agent', sub: 'Vector store \u00b7 Retrieval', status: 'ok' as const, statusLabel: 'Nominal' },
]

function statusColor(s: 'ok' | 'warning' | 'critical') {
  if (s === 'critical') return 'var(--mc-critical)'
  if (s === 'warning') return 'var(--mc-warn-amber)'
  return 'var(--mc-success)'
}

function TopoNodeBox({
  node,
  onClick,
  hovered,
  onHover,
}: {
  node: TopoNode
  onClick?: () => void
  hovered: boolean
  onHover: (id: string | null) => void
}) {
  const w = node.kind === 'gateway' ? 160 : node.kind === 'hub' ? 150 : 130
  const h = node.sub ? 52 : 34
  const pad = 6
  const isCritical = node.status === 'critical'
  const isWarning = node.status === 'warning'
  const border = isCritical
    ? '2px solid var(--mc-warn-amber)'
    : isWarning
      ? '2px solid var(--mc-critical)'
      : 'none'
  const bg = isCritical ? '#fffaf0' : 'var(--slack-pane-bg)'
  const shadow = hovered ? '0 3px 12px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.04)'
  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <foreignObject
        x={node.x - w / 2 - pad}
        y={node.y - h / 2 - pad}
        width={w + pad * 2}
        height={h + pad * 2}
      >
        <div style={{ padding: pad, width: '100%', height: '100%' }}>
          <div
            style={{
              border,
              backgroundColor: bg,
              borderRadius: 8,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 10px',
              boxShadow: shadow,
              transition: 'box-shadow 0.2s, transform 0.15s',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slack-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.label}</div>
              {node.sub && <div style={{ fontSize: 10, color: 'var(--slack-msg-muted)', marginTop: 1 }}>{node.sub}</div>}
            </div>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor(node.status), flexShrink: 0 }} />
          </div>
        </div>
      </foreignObject>
    </g>
  )
}

function TopoEdgeLine({
  edge,
  nodeMap,
  hoveredNode,
}: {
  edge: TopoEdge
  nodeMap: Record<string, TopoNode>
  hoveredNode: string | null
}) {
  const a = nodeMap[edge.from]
  const b = nodeMap[edge.to]
  if (!a || !b) return null

  const isConnected = hoveredNode === edge.from || hoveredNode === edge.to
  const baseColor = edge.color ?? '#d4d4d4'
  const stroke = isConnected ? (edge.color ?? 'var(--mc-success)') : baseColor
  const strokeWidth = isConnected ? 2 : (edge.color ? 2 : 1)
  const opacity = hoveredNode ? (isConnected ? 1 : 0.25) : 0.7

  return (
    <line
      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray="6 4"
      opacity={opacity}
      style={{
        transition: 'opacity 0.2s, stroke 0.2s, stroke-width 0.15s',
        animation: isConnected ? 'topo-flow 0.6s linear infinite' : undefined,
      }}
    />
  )
}

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.5
const ZOOM_STEP = 0.1

function AgentHubTopology({ onSelectUSW7 }: { onSelectUSW7: () => void }) {
  const nodeMap = Object.fromEntries(TOPO_NODES.map((n) => [n.id, n]))
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    })
  }, [dragging])

  const handleMouseUp = useCallback(() => setDragging(false), [])

  useEffect(() => {
    if (!dragging) return
    const up = () => setDragging(false)
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [dragging])

  return (
    <div
      ref={containerRef}
      className="overflow-hidden flex-1 min-h-0 relative select-none"
      style={{ background: '#fafafa', cursor: dragging ? 'grabbing' : 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <style>{`@keyframes topo-flow { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }`}</style>
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-colors hover:bg-[#eee]"
          style={{ backgroundColor: '#fff', border: '1px solid var(--slack-border)', color: 'var(--slack-text)' }}
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP * 2))}
          aria-label="Zoom in"
        >+</button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-colors hover:bg-[#eee]"
          style={{ backgroundColor: '#fff', border: '1px solid var(--slack-border)', color: 'var(--slack-text)' }}
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP * 2))}
          aria-label="Zoom out"
        >&minus;</button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-md text-[10px] font-semibold transition-colors hover:bg-[#eee]"
          style={{ backgroundColor: '#fff', border: '1px solid var(--slack-border)', color: 'var(--slack-text)' }}
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          aria-label="Reset view"
        >1:1</button>
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 960 720"
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          overflow: 'visible',
          boxSizing: 'content-box',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: dragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <text x="290" y="160" textAnchor="middle" style={{ fontSize: 10, fill: '#999' }}>US West hub zone</text>
        <text x="680" y="160" textAnchor="middle" style={{ fontSize: 10, fill: '#999' }}>US East hub zone</text>
        {TOPO_EDGES.map((e, idx) => (
          <TopoEdgeLine key={idx} edge={e} nodeMap={nodeMap} hoveredNode={hoveredNode} />
        ))}
        {TOPO_NODES.map((n) => (
          <TopoNodeBox
            key={n.id}
            node={n}
            onClick={n.id === 'usw-7' ? onSelectUSW7 : undefined}
            hovered={hoveredNode === n.id}
            onHover={setHoveredNode}
          />
        ))}
      </svg>
    </div>
  )
}

function ModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-full flex-shrink-0 transition-colors min-h-9 px-2.5 hover:bg-[#ebebeb]"
      style={{ backgroundColor: '#ffffff', border: '1px solid rgba(232, 232, 232, 1)', color: '#1d1c1d' }}
      aria-label="Close"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path fillRule="evenodd" clipRule="evenodd" d="M15.4697 3.46962C15.7626 3.17673 16.2373 3.17673 16.5302 3.46962C16.8231 3.76252 16.8231 4.23728 16.5302 4.53017L11.0605 9.9999L16.5302 15.4696C16.8231 15.7625 16.8231 16.2373 16.5302 16.5302C16.2373 16.8231 15.7626 16.8231 15.4697 16.5302L9.99994 11.0604L4.53022 16.5302C4.23732 16.8231 3.76256 16.8231 3.46967 16.5302C3.17678 16.2373 3.17678 15.7625 3.46967 15.4696L8.9394 9.9999L3.46967 4.53017C3.1768 4.23728 3.17679 3.76251 3.46967 3.46962C3.76256 3.17677 4.23733 3.17677 4.53022 3.46962L9.99994 8.93935L15.4697 3.46962Z" fill="currentColor" fillOpacity="0.75" />
      </svg>
    </button>
  )
}

function AgentUSW7Detail({ onInvestigate, onClose }: { onInvestigate: () => void; onClose: () => void }) {
  const criticalCount = USW7_AGENTS.filter((a) => a.status === 'critical').length
  const warningCount = USW7_AGENTS.filter((a) => a.status === 'warning').length
  return (
    <div
      className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
      style={{ backgroundColor: 'var(--slack-pane-bg)', border: '1px solid var(--slack-border)' }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
    >
      <header className="flex items-start justify-between gap-3 px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--slack-border)' }}>
        <div className="min-w-0">
          <h2 className="text-lg font-bold m-0" style={{ color: 'var(--slack-text)' }}>Agent USW-7</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="mc-type-meta m-0">US West hub &middot; 6 agents</span>
            {criticalCount > 0 && (
              <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded" style={{ backgroundColor: '#fef0f2', color: 'var(--mc-critical)' }}>
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded" style={{ backgroundColor: '#fff7e0', color: 'var(--mc-warn-amber)' }}>
                {warningCount} Warning
              </span>
            )}
          </div>
        </div>
        <ModalCloseButton onClick={onClose} />
      </header>
      <div className="px-4 py-3 space-y-2 overflow-auto flex-1 min-h-0">
        {USW7_AGENTS.map((agent) => {
          const borderColor = agent.status === 'critical' ? 'var(--mc-critical-soft-border)' : agent.status === 'warning' ? '#f0d9a8' : 'var(--slack-border)'
          const bgColor = agent.status === 'critical' ? 'var(--mc-critical-soft-bg)' : agent.status === 'warning' ? '#fffaf0' : 'var(--slack-pane-bg)'
          return (
            <div
              key={agent.name}
              className="rounded-lg px-4 py-3"
              style={{ border: `1px solid ${borderColor}`, backgroundColor: bgColor }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="inline-block size-2 rounded-full shrink-0" style={{ backgroundColor: statusColor(agent.status) }} />
                    <span className="text-[11px] font-medium" style={{ color: statusColor(agent.status) }}>{agent.statusLabel}</span>
                  </div>
                  <div className="text-sm font-semibold m-0" style={{ color: 'var(--slack-text)' }}>{agent.name}</div>
                  <div className="text-xs mt-0.5 m-0" style={{ color: 'var(--slack-msg-muted)' }}>{agent.sub}</div>
                </div>
              </div>
              {agent.actionLabel && (
                <button
                  type="button"
                  className="mt-2 px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors hover:bg-[#f0f0f0] active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--slack-pane-bg)', border: '1px solid var(--slack-border)', color: 'var(--slack-text)', lineHeight: '16px' }}
                  onClick={onInvestigate}
                >
                  {agent.actionLabel}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type AgentHubModalView = 'topology' | 'usw7-detail'

function AgentHubModal({
  onInvestigate,
  onClose,
}: {
  onInvestigate: () => void
  onClose: () => void
}) {
  const [view, setView] = useState<AgentHubModalView>('topology')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      role="presentation"
      onClick={onClose}
    >
      {view === 'topology' ? (
        <div
          className="w-full rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxWidth: 820, maxHeight: '90vh', backgroundColor: 'var(--slack-pane-bg)', border: '1px solid var(--slack-border)' }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--slack-border)' }}>
            <h2 className="text-base font-bold m-0" style={{ color: 'var(--slack-text)' }}>United States &mdash; Agent hubs &amp; coverage</h2>
            <ModalCloseButton onClick={onClose} />
          </header>
          <AgentHubTopology onSelectUSW7={() => setView('usw7-detail')} />
        </div>
      ) : (
        <AgentUSW7Detail
          onInvestigate={onInvestigate}
          onClose={onClose}
        />
      )}
    </div>
  )
}

/**
 * Light-mode control tower for Agentic Mission Control (demo).
 * Uses design tokens from slack.css (--mc-* / --slack-*) and tiered surfaces.
 *
 * Once `investigated` is true, swaps to the InvestigationCanvas which renders
 * the live Service Graph (or Evals overlay during retrain) driven by `currentStepId`.
 */
export function MissionControlTowerPanel({
  onInvestigate,
  currentStepId,
}: {
  onInvestigate?: () => void
  currentStepId?: string
}) {
  const liveIncidentRef = useRef<HTMLDivElement>(null)
  const [agentHubOpen, setAgentHubOpen] = useState(false)
  const [investigated, setInvestigated] = useState(false)
  const gradIdBase = useId().replace(/:/g, '_')
  const warnGradId = `mcwg_${gradIdBase}`

  const scrollToIncident = useCallback(() => {
    liveIncidentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleInvestigate = useCallback(() => {
    setAgentHubOpen(false)
    setInvestigated(true)
    onInvestigate?.()
  }, [onInvestigate])

  const bulletRow = 'mc-type-body flex gap-2.5 items-start m-0'
  const bullet = 'mt-0.5 shrink-0 font-bold select-none'
  const bulletStyle = { color: 'var(--slack-msg-muted)' }

  return (
    <div
      className="mission-control-canvas flex flex-col min-h-0 min-w-0 h-full overflow-auto"
      role="region"
      aria-label="Agentic Mission Control"
    >
      <ChatHeader
        viewType="channel"
        title={investigated ? 'Order Processing Agent — Investigation' : 'Agentic Mission Control'}
        avatarUrl="/assets/mc-agent-icon.png"
        channelShowCalls={false}
      />

      {investigated ? (
        <InvestigationCanvas stepId={currentStepId} />
      ) : (
        <section className="mc-hero-shell p-4" aria-labelledby="mc-hero-heading">
          <h2 id="mc-hero-heading" className="sr-only">
            Incident response
          </h2>
          <div className="mc-hero-segment">
            <div className="mc-alert-strip" role="status">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'var(--mc-alert-icon-bg)',
                  border: '1px solid var(--mc-alert-icon-border)',
                  color: 'var(--mc-warn-amber)',
                }}
                aria-hidden
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2.5L17.5 16.25H2.5L10 2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="none" />
                  <path d="M10 7.5V11.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                  <circle cx="10" cy="13.75" r="0.75" fill="currentColor" />
                </svg>
              </span>
              <p className="flex-1 min-w-0 m-0 mc-type-body leading-snug" style={{ color: 'var(--mc-muted-strong)' }}>
                <span className="font-semibold" style={{ color: 'var(--mc-warn-amber)' }}>4 open alerts</span>
                <span className="mx-1.5" style={{ color: 'var(--color-gray-900)' }} aria-hidden>&middot;</span>
                <span className="font-semibold" style={{ color: 'var(--mc-warn-amber)' }}>1 critical</span>
                <span className="mx-1.5" style={{ color: 'var(--color-gray-900)' }} aria-hidden>&middot;</span>
                <span className="font-semibold" style={{ color: 'var(--mc-warn-amber)' }}>4 operational zones</span>
                <span className="mx-1.5" style={{ color: 'var(--color-gray-900)' }} aria-hidden>&middot;</span>
                <span className="font-semibold" style={{ color: 'var(--mc-warn-amber)' }}>Top: Retrieval degraded</span>
              </p>
              <SecondaryButton
                onClick={scrollToIncident}
                className="shrink-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mc-accent)] focus-visible:ring-offset-1"
              >
                View alerts
              </SecondaryButton>
            </div>
          </div>

          <div className="mc-hero-segment mc-hero-segment--map">
            <AgentFleetMap onSelectProblem={() => setAgentHubOpen(true)} />
          </div>

          <div className="mc-hero-segment">
            <div ref={liveIncidentRef} className="mc-hero-incident">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <span className="mc-type-overline" style={{ color: 'var(--mc-critical)' }}>Critical Incident</span>
              </div>
              <h3 className="mc-type-section m-0 mb-3">Order Processing Agent — policy breach</h3>

              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                <div className="space-y-3 min-w-0">
                  <span className="mc-type-body font-semibold m-0">Governance signal · production fleet</span>
                  <ul className="space-y-2.5 list-none m-0 p-0">
                    <li className={bulletRow}>
                      <span className={bullet} style={bulletStyle}>•</span>
                      <span><span className="font-semibold">Symptom:</span> Answering off-topic questions at{' '}<span className="font-semibold">3 warnings/min</span></span>
                    </li>
                    <li className={bulletRow}>
                      <span className={bullet} style={bulletStyle}>•</span>
                      <span><span className="font-semibold">Policy:</span> Domain must stay within assignment (ref:{' '}<span className="font-semibold">POL-AGT-DOMAIN-REM-03</span>)</span>
                    </li>
                  </ul>
                </div>
                <div
                  className="flex flex-col items-start justify-start gap-1 rounded-lg p-3 min-w-[8.5rem] transition-colors hover:brightness-[1.02]"
                  style={{ border: '1px solid var(--mc-critical-soft-border)', backgroundColor: 'var(--mc-critical-soft-bg)' }}
                >
                  <span className="mc-type-overline m-0" style={{ color: 'var(--mc-critical)' }}>Warnings / min</span>
                  <span className="text-2xl font-black leading-none m-0" style={{ color: 'var(--mc-critical)' }}>3</span>
                  <WarningsSparkline gradId={warnGradId} />
                </div>
              </div>

              <div className="pt-3 mt-3 border-t" style={{ borderColor: 'var(--mc-divider)' }}>
                <p className="mc-type-section m-0 mb-2 text-[15px]">Operational impact</p>
                <ul className="space-y-2.5 list-none m-0 p-0">
                  <li className={bulletRow}>
                    <span className={bullet} style={bulletStyle}>•</span>
                    <span><span className="font-semibold">Users exposed / hr:</span> ~420</span>
                  </li>
                  <li className={bulletRow}>
                    <span className={bullet} style={bulletStyle}>•</span>
                    <span><span className="font-semibold">Apps affected:</span> Order Processing, Checkout Assist (read-only)</span>
                  </li>
                  <li className={bulletRow}>
                    <span className={bullet} style={bulletStyle}>•</span>
                    <span>
                      <span className="font-semibold">Revenue at risk (est.):</span>{' '}
                      <span className="font-semibold" style={{ color: 'var(--mc-critical)' }}>$180k / hr</span> until contained
                    </span>
                  </li>
                  <li className={bulletRow}>
                    <span className={bullet} style={bulletStyle}>•</span>
                    <span><span className="font-semibold">Cluster:</span> USW-7</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <FleetStatsGrid />
        </section>
      )}

      {agentHubOpen && (
        <AgentHubModal
          onInvestigate={handleInvestigate}
          onClose={() => setAgentHubOpen(false)}
        />
      )}
    </div>
  )
}
