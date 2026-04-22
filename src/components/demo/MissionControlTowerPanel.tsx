import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { ChatHeader } from '@/components/chat/ChatHeader'
import { InvestigationCanvas } from '@/components/demo/InvestigationCanvas'
import { PermissionsEvalCard } from '@/components/governance/PermissionsEvalCard'
import { PolicyChipWithImpact } from '@/components/governance/PolicyChip'
import { TimeScopeToggle, type TimeScope } from '@/components/governance/TimeScopeToggle'
import { SecondaryButton } from '@/components/ui/DesignSystemButtons'
import { getFleetStateFromUrl, type FleetState } from '@/data/governance/missionControlState'

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

// ──────────────────────────────────────────────────────────────────────────────
// Galileo-inspired governance modules (observability, protection, evaluation).
// Mirrors the three pillars from the Galileo product (docs.galileo.ai) in a
// compact, scannable layout suited to an IT director monitoring an agent fleet.
// ──────────────────────────────────────────────────────────────────────────────

type KpiTone = 'critical' | 'warn' | 'success'

type KpiSpec = {
  label: string
  value: string
  trendPct: number
  /** When true, an upward trend is *bad* (e.g. latency). */
  higherIsWorse?: boolean
  tone: KpiTone
  data: number[]
}

function toneAccent(tone: KpiTone) {
  if (tone === 'critical') return 'var(--mc-critical)'
  if (tone === 'warn') return 'var(--mc-warn-amber)'
  return 'var(--mc-success)'
}

function toneSoftBg(tone: KpiTone) {
  if (tone === 'critical') return 'var(--mc-critical-soft-bg)'
  if (tone === 'warn') return '#fdf5e7'
  return 'var(--mc-success-soft-bg)'
}

function KpiCard({ kpi, gradId }: { kpi: KpiSpec; gradId: string }) {
  const accent = toneAccent(kpi.tone)
  const max = Math.max(...kpi.data)
  const min = Math.min(...kpi.data)
  const range = max - min || 1
  const w = 220
  const h = 44
  const stepX = w / (kpi.data.length - 1)
  const points = kpi.data.map((v, i) => {
    const x = i * stepX
    const y = h - ((v - min) / range) * (h - 4) - 2
    return [x, y] as const
  })
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const fillPath = `${linePath} L ${w} ${h} L 0 ${h} Z`
  const trendIsUp = kpi.trendPct > 0
  const trendBad = kpi.higherIsWorse ? trendIsUp : !trendIsUp
  const trendColor = trendBad ? accent : 'var(--mc-success)'

  return (
    <div className="mc-kpi-card">
      <div className="mc-kpi-card__head">
        <span className="mc-kpi-card__label">{kpi.label}</span>
        <span
          className="mc-kpi-card__pill"
          style={{ color: accent, backgroundColor: toneSoftBg(kpi.tone), borderColor: accent + '33' }}
        >
          {kpi.value}
        </span>
      </div>
      <svg className="mc-kpi-card__chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={accent}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mc-kpi-card__foot">
        <span className="mc-kpi-card__trend" style={{ color: trendColor }}>
          {trendIsUp ? '↑' : '↓'} {Math.abs(kpi.trendPct).toFixed(1)}%
        </span>
        <span className="mc-kpi-card__time">10AM · 12PM · 2PM · 4PM · 6PM</span>
      </div>
    </div>
  )
}

type KpiScopeSet = Record<TimeScope, KpiSpec[]>

const OBS_KPIS_INCIDENT: KpiScopeSet = {
  '1D': [
    { label: 'Tool Selection Quality', value: '81.2%', trendPct: -2.1, tone: 'warn', data: [78, 80, 82, 81, 83, 79, 82, 81, 80, 81, 79, 78, 80, 81] },
    { label: 'Context Adherence', value: '73.6%', trendPct: -8.4, tone: 'critical', data: [88, 86, 84, 82, 80, 78, 76, 74, 72, 73, 72, 73, 74, 73] },
    { label: 'Agent Action Completion', value: '49.8%', trendPct: -22.1, tone: 'critical', data: [88, 84, 78, 70, 60, 55, 50, 48, 50, 49, 50, 48, 50, 49] },
    { label: 'Time to First Token', value: '743 ms', trendPct: 18.2, tone: 'warn', higherIsWorse: true, data: [320, 380, 420, 480, 540, 600, 680, 720, 740, 720, 740, 750, 730, 740] },
  ],
  '7D': [
    { label: 'Tool Selection Quality', value: '83.8%', trendPct: -0.6, tone: 'warn', data: [86, 85, 84, 84, 83, 82, 84, 83, 84, 83, 84, 83, 84, 84] },
    { label: 'Context Adherence', value: '82.1%', trendPct: -3.4, tone: 'warn', data: [90, 89, 88, 87, 85, 84, 82, 83, 82, 81, 82, 82, 82, 82] },
    { label: 'Agent Action Completion', value: '71.2%', trendPct: -8.1, tone: 'warn', data: [82, 80, 78, 76, 74, 72, 70, 71, 70, 71, 72, 71, 72, 71] },
    { label: 'Time to First Token', value: '612 ms', trendPct: 6.1, tone: 'warn', higherIsWorse: true, data: [560, 580, 600, 610, 620, 600, 615, 612, 620, 612, 615, 612, 612, 612] },
  ],
  '30D': [
    { label: 'Tool Selection Quality', value: '86.4%', trendPct: 1.2, tone: 'success', data: [85, 86, 86, 87, 86, 87, 86, 87, 86, 86, 87, 86, 87, 86] },
    { label: 'Context Adherence', value: '88.2%', trendPct: 0.4, tone: 'success', data: [88, 88, 88, 89, 88, 88, 89, 88, 88, 88, 89, 88, 88, 88] },
    { label: 'Agent Action Completion', value: '83.6%', trendPct: -0.8, tone: 'warn', data: [85, 85, 84, 84, 84, 83, 84, 83, 84, 84, 83, 84, 83, 84] },
    { label: 'Time to First Token', value: '548 ms', trendPct: 0.9, tone: 'success', higherIsWorse: true, data: [550, 545, 548, 550, 545, 548, 550, 548, 548, 545, 548, 548, 548, 548] },
  ],
}

const OBS_KPIS_CLEAR: KpiScopeSet = {
  '1D': [
    { label: 'Tool Selection Quality', value: '94.6%', trendPct: 0.8, tone: 'success', data: [93, 94, 94, 95, 94, 95, 94, 95, 95, 94, 95, 95, 95, 95] },
    { label: 'Context Adherence', value: '96.2%', trendPct: 0.4, tone: 'success', data: [95, 96, 96, 96, 95, 96, 96, 96, 96, 96, 96, 96, 96, 96] },
    { label: 'Agent Action Completion', value: '92.4%', trendPct: 1.6, tone: 'success', data: [89, 90, 90, 91, 91, 92, 91, 92, 92, 92, 92, 92, 92, 92] },
    { label: 'Time to First Token', value: '418 ms', trendPct: -3.2, tone: 'success', higherIsWorse: true, data: [430, 425, 425, 420, 420, 418, 418, 415, 418, 418, 418, 418, 418, 418] },
  ],
  '7D': [
    { label: 'Tool Selection Quality', value: '93.8%', trendPct: 1.2, tone: 'success', data: [92, 93, 93, 93, 94, 94, 94, 94, 94, 94, 94, 94, 94, 94] },
    { label: 'Context Adherence', value: '95.7%', trendPct: 0.6, tone: 'success', data: [95, 95, 95, 96, 95, 96, 96, 96, 96, 96, 96, 96, 96, 96] },
    { label: 'Agent Action Completion', value: '91.0%', trendPct: 0.9, tone: 'success', data: [90, 90, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91] },
    { label: 'Time to First Token', value: '432 ms', trendPct: -1.4, tone: 'success', higherIsWorse: true, data: [440, 438, 435, 432, 432, 430, 432, 432, 432, 432, 432, 432, 432, 432] },
  ],
  '30D': [
    { label: 'Tool Selection Quality', value: '92.1%', trendPct: 0.5, tone: 'success', data: [91, 91, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92, 92] },
    { label: 'Context Adherence', value: '94.4%', trendPct: 0.2, tone: 'success', data: [94, 94, 94, 94, 94, 94, 94, 94, 94, 94, 94, 94, 94, 94] },
    { label: 'Agent Action Completion', value: '89.2%', trendPct: 1.4, tone: 'success', data: [87, 88, 88, 88, 89, 89, 89, 89, 89, 89, 89, 89, 89, 89] },
    { label: 'Time to First Token', value: '448 ms', trendPct: -0.5, tone: 'success', higherIsWorse: true, data: [450, 450, 448, 448, 448, 448, 448, 448, 448, 448, 448, 448, 448, 448] },
  ],
}

function ObservabilityKpiStrip({
  idBase,
  scope,
  onScopeChange,
  fleetState,
}: {
  idBase: string
  scope: TimeScope
  onScopeChange: (s: TimeScope) => void
  fleetState: FleetState
}) {
  const set = fleetState === 'all_clear' ? OBS_KPIS_CLEAR : OBS_KPIS_INCIDENT
  const kpis = set[scope]
  return (
    <section className="mc-galileo-section" aria-labelledby="mc-galileo-obs-heading">
      <header className="mc-galileo-section-meta mc-galileo-section-meta--with-action">
        <div className="mc-galileo-section-meta__left">
          <span className="mc-galileo-num">02</span>
          <span className="mc-galileo-kicker" id="mc-galileo-obs-heading">AI Observability</span>
          <span className="mc-galileo-loc">Production traces · last {scope}</span>
        </div>
        <TimeScopeToggle value={scope} onChange={onScopeChange} label="Observability time scope" />
      </header>
      <div className="mc-kpi-grid">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} kpi={k} gradId={`${idBase}_kpi_${scope}_${i}`} />
        ))}
      </div>
    </section>
  )
}

function ProtectionCard() {
  const rulesets = [
    {
      name: 'Ruleset 1 · Quality',
      checks: ['Adherence', 'Completeness'],
      triggered: 12,
      tone: 'warn' as KpiTone,
    },
    {
      name: 'Ruleset 2 · Safety',
      checks: ['Prompt Injections', 'PII'],
      triggered: 4,
      tone: 'critical' as KpiTone,
    },
  ]
  return (
    <section className="mc-galileo-card" aria-labelledby="mc-galileo-protect-heading">
      <header className="mc-galileo-section-meta">
        <span className="mc-galileo-num">03</span>
        <span className="mc-galileo-kicker" id="mc-galileo-protect-heading">Real-time Protection</span>
      </header>
      <div className="mc-galileo-card-headline">
        <span className="mc-galileo-card-headline__v">16</span>
        <span className="mc-galileo-card-headline__l">risks blocked in production · last 24h</span>
      </div>
      <ul className="mc-protect-list">
        {rulesets.map((r) => {
          const accent = toneAccent(r.tone)
          return (
            <li key={r.name} className="mc-protect-row">
              <div className="mc-protect-row__head">
                <span className="mc-protect-row__name">{r.name}</span>
                <span
                  className="mc-protect-row__pill"
                  style={{ color: accent, backgroundColor: toneSoftBg(r.tone), borderColor: accent + '33' }}
                >
                  {r.triggered} triggered
                </span>
              </div>
              <div className="mc-protect-row__checks">
                {r.checks.map((c) => (
                  <span key={c} className="mc-protect-chip">{c}</span>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function EvaluationCard({ gradId }: { gradId: string }) {
  const data = [89, 88, 90, 91, 89, 92, 91, 93, 95, 94, 96, 97, 98, 98]
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 220
  const h = 56
  const stepX = w / (data.length - 1)
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = h - ((v - min) / range) * (h - 4) - 2
    return [x, y] as const
  })
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const fillPath = `${linePath} L ${w} ${h} L 0 ${h} Z`

  return (
    <section className="mc-galileo-card" aria-labelledby="mc-galileo-eval-heading">
      <header className="mc-galileo-section-meta">
        <span className="mc-galileo-num">04</span>
        <span className="mc-galileo-kicker" id="mc-galileo-eval-heading">AI Evaluation</span>
      </header>
      <div className="mc-galileo-card-headline">
        <span className="mc-galileo-card-headline__v" style={{ color: 'var(--mc-success)' }}>98.4%</span>
        <span className="mc-galileo-card-headline__l">eval gate pass rate · last run 12m ago</span>
      </div>
      <svg className="mc-eval-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mc-success)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--mc-success)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke="var(--mc-success)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mc-eval-stats">
        <div className="mc-eval-stat">
          <span className="mc-eval-stat__v">124</span>
          <span className="mc-eval-stat__l">cases run</span>
        </div>
        <div className="mc-eval-stat">
          <span className="mc-eval-stat__v" style={{ color: 'var(--mc-success)' }}>+7.2%</span>
          <span className="mc-eval-stat__l">vs last week</span>
        </div>
        <div className="mc-eval-stat">
          <span className="mc-eval-stat__v">2</span>
          <span className="mc-eval-stat__l">regressions blocked</span>
        </div>
      </div>
    </section>
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
                  className={
                    agent.status === 'critical'
                      ? 'mc-cta mc-cta--primary mt-3'
                      : 'mc-cta mc-cta--secondary mt-3'
                  }
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

/* ─── Hero segment subcomponents ─────────────────────────────────────────── */

function IncidentAlertStrip({ onViewAlerts }: { onViewAlerts: () => void }) {
  return (
    <div className="mc-alert-strip" role="status">
      <span className="mc-alert-icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2.5L17.5 16.25H2.5L10 2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="none" />
          <path d="M10 7.5V11.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="10" cy="13.75" r="0.75" fill="currentColor" />
        </svg>
      </span>
      <p className="mc-alert-text">
        <strong style={{ color: 'var(--mc-warn-amber)' }}>4 open alerts</strong>
        <span className="mx-1.5" aria-hidden>·</span>
        <strong style={{ color: 'var(--mc-warn-amber)' }}>1 critical</strong>
        <span className="mx-1.5" aria-hidden>·</span>
        <strong style={{ color: 'var(--mc-warn-amber)' }}>4 operational zones</strong>
        <span className="mx-1.5" aria-hidden>·</span>
        <strong style={{ color: 'var(--mc-warn-amber)' }}>Top: Retrieval degraded</strong>
      </p>
      <SecondaryButton
        onClick={onViewAlerts}
        className="shrink-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mc-accent)] focus-visible:ring-offset-1"
      >
        View alerts
      </SecondaryButton>
    </div>
  )
}

function AllClearAlertStrip() {
  return (
    <div className="mc-alert-strip mc-alert-strip--clear" role="status">
      <span className="mc-alert-icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10.5L8.5 15L16 6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </span>
      <p className="mc-alert-text">
        <strong>All systems clear</strong>
        <span className="mx-1.5" aria-hidden>·</span>
        <strong>0 critical</strong>
        <span className="mx-1.5" aria-hidden>·</span>
        <strong>4 operational zones healthy</strong>
        <span className="mx-1.5" aria-hidden>·</span>
        <strong>Last incident: 2d ago</strong>
      </p>
      <button type="button" className="mc-cta mc-cta--ambient">
        View 7-day report
      </button>
    </div>
  )
}

function IncidentBlock({ warnGradId }: { warnGradId: string }) {
  return (
    <div className="mc-hero-incident">
      <div className="mc-incident-meta">
        <span className="mc-incident-num">01</span>
        <span className="mc-incident-kicker">Critical incident</span>
        <span className="mc-incident-loc">USW-7 · Production fleet</span>
      </div>

      <h3 className="mc-incident-title">Order Processing Agent — policy breach</h3>

      <div className="mc-incident-grid">
        <ul className="mc-incident-facts">
          <li>
            <span className="mc-incident-facts__k">Symptom</span>
            <span>Off-topic responses at <strong>3 warnings/min</strong></span>
          </li>
          <li>
            <span className="mc-incident-facts__k">Policy</span>
            <span>
              Domain must stay within assignment{' '}
              <PolicyChipWithImpact policyRef="POL-AGT-DOMAIN-REM-03" />
            </span>
          </li>
          <li>
            <span className="mc-incident-facts__k">Apps</span>
            <span>Order Processing, Checkout Assist <em className="not-italic" style={{ color: 'var(--slack-msg-muted)' }}>(read-only)</em></span>
          </li>
        </ul>

        <div className="mc-incident-visual">
          <span className="mc-incident-visual__label">Warnings · last 60s</span>
          <span className="mc-incident-visual__value">3</span>
          <WarningsSparkline gradId={warnGradId} />
        </div>
      </div>

      <div className="mc-incident-impact">
        <div className="mc-incident-impact__cell">
          <span className="mc-incident-impact__v">~420</span>
          <span className="mc-incident-impact__l">Users / hr exposed</span>
        </div>
        <div className="mc-incident-impact__cell">
          <span className="mc-incident-impact__v" style={{ color: 'var(--mc-critical)' }}>$180k</span>
          <span className="mc-incident-impact__l">Revenue at risk / hr</span>
        </div>
        <div className="mc-incident-impact__cell">
          <span className="mc-incident-impact__v">USW-7</span>
          <span className="mc-incident-impact__l">Cluster</span>
        </div>
      </div>
    </div>
  )
}

function AllClearHighlight() {
  // Recent governance log shown in steady state — last 5 actions
  const log = [
    { time: '2h ago', text: 'Permissions eval suite passed (412 cases)', verdict: 'OK' as const },
    { time: '6h ago', text: 'Domain restriction policy v3.2 → v3.3 rolled out · 6 agents', verdict: 'AUTO' as const },
    { time: '11h ago', text: 'Auto-remediated 3 borderline interactions in Loyalty cohort', verdict: 'AUTO' as const },
    { time: '1d ago', text: 'Order Processing Agent — policy breach contained', verdict: 'OK' as const },
    { time: '2d ago', text: 'Quarterly governance review approved', verdict: 'OK' as const },
  ]
  return (
    <div>
      <div className="mc-clear-highlight">
        <div>
          <div className="mc-clear-meta">
            <span className="mc-clear-num">01</span>
            <span className="mc-clear-kicker">All clear</span>
            <span className="mc-clear-loc">North America fleet · 6 clusters</span>
          </div>
          <h3 className="mc-clear-title">Fleet healthy — operating within policy</h3>
          <p className="mc-clear-sub">
            No active incidents. 0 critical alerts in the last 24h. Permissions
            eval suite ran 18m ago and passed across all monitored policies.
          </p>
        </div>
        <div className="mc-clear-stat" aria-label="Compliance pass rate">
          <span className="mc-clear-stat__v">99.4%</span>
          <span className="mc-clear-stat__l">Policy compliance · 24h</span>
        </div>
      </div>
      <div className="mc-clear-log" aria-label="Recent governance activity">
        <div className="mc-clear-log__head">
          <span>Recent governance activity</span>
          <button type="button" className="mc-cta mc-cta--ambient">View audit log →</button>
        </div>
        <ul className="mc-clear-log__list">
          {log.map((row, i) => (
            <li key={i} className="mc-clear-log__row">
              <span className="mc-clear-log__time">{row.time}</span>
              <span>{row.text}</span>
              <span
                className={`mc-clear-log__verdict mc-clear-log__verdict--${row.verdict === 'OK' ? 'ok' : 'auto'}`}
              >
                {row.verdict}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * Light-mode control tower for Agentic Mission Control (demo).
 * Uses design tokens from slack.css (--mc-* / --slack-*) and tiered surfaces.
 *
 * Once `investigated` is true, swaps to the InvestigationCanvas which renders
 * the live Service Graph (or Evals overlay during retrain) driven by `currentStepId`.
 *
 * Homepage is state-aware via `getFleetStateFromUrl()`. The default is
 * `active_incident`; reviewers can switch to the steady state via `?fleet=all_clear`.
 */
export function MissionControlTowerPanel({
  onInvestigate,
  currentStepId,
  forceInvestigated = false,
}: {
  onInvestigate?: () => void
  currentStepId?: string
  /**
   * When the surrounding shell knows investigation has already begun (e.g.
   * dual viewport is open), pass `true` so the panel renders the canvas
   * regardless of its own local state. This survives remounts when the
   * viewport switches from single → dual.
   */
  forceInvestigated?: boolean
}) {
  const liveIncidentRef = useRef<HTMLDivElement>(null)
  const [agentHubOpen, setAgentHubOpen] = useState(false)
  const [investigatedLocal, setInvestigatedLocal] = useState(false)
  const [obsScope, setObsScope] = useState<TimeScope>('1D')
  const [fleetState, setFleetState] = useState<FleetState>(getFleetStateFromUrl())
  const gradIdBase = useId().replace(/:/g, '_')
  const warnGradId = `mcwg_${gradIdBase}`
  const isAllClear = fleetState === 'all_clear'
  const investigated = investigatedLocal || forceInvestigated

  // Re-read fleet state on URL changes (back/forward, demo nav)
  useEffect(() => {
    const onPop = () => setFleetState(getFleetStateFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const scrollToIncident = useCallback(() => {
    liveIncidentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleInvestigate = useCallback(() => {
    setAgentHubOpen(false)
    setInvestigatedLocal(true)
    onInvestigate?.()
  }, [onInvestigate])

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
            {isAllClear ? 'Fleet status — all clear' : 'Incident response'}
          </h2>
          <div className="mc-hero-segment">
            {isAllClear ? <AllClearAlertStrip /> : <IncidentAlertStrip onViewAlerts={scrollToIncident} />}
          </div>

          <div className="mc-hero-segment mc-hero-segment--map">
            <AgentFleetMap onSelectProblem={() => setAgentHubOpen(true)} />
          </div>

          <div className="mc-hero-segment">
            <div ref={liveIncidentRef}>
              {isAllClear ? (
                <AllClearHighlight />
              ) : (
                <IncidentBlock warnGradId={warnGradId} />
              )}
            </div>
          </div>

          <FleetStatsGrid />

          <ObservabilityKpiStrip
            idBase={gradIdBase}
            scope={obsScope}
            onScopeChange={setObsScope}
            fleetState={fleetState}
          />

          <div className="mc-galileo-pair">
            <ProtectionCard />
            <EvaluationCard gradId={`mceg_${gradIdBase}`} />
          </div>

          <div className="mc-hero-segment">
            <PermissionsEvalCard />
          </div>
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
