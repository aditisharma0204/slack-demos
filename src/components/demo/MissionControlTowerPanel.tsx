import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import L, { type LatLngBoundsExpression, type LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { ChatHeader } from '@/components/chat/ChatHeader'
import { InvestigationCanvas } from '@/components/demo/InvestigationCanvas'
import { PermissionsEvalCard } from '@/components/governance/PermissionsEvalCard'
import { TimeScopeToggle, type TimeScope } from '@/components/governance/TimeScopeToggle'
import {
  DestructivePrimaryButton,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui/DesignSystemButtons'
import { getFleetStateFromUrl, type FleetState } from '@/data/governance/missionControlState'

type FleetSiteSeverity = 'critical' | 'warning'

type FleetSite = {
  id: string
  lat: number
  lng: number
  ok: boolean
  label: string
  /**
   * For non-OK sites: 'critical' = red epicenter, 'warning' = amber echo.
   * Defaults to 'critical' when omitted to preserve existing call sites.
   */
  severity?: FleetSiteSeverity
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Curated US metro coordinates for healthy fleet sites. Pinned to actual
// cities so every dot lands on land — the previous random lat/lng generator
// was scattering pins into the Atlantic, Gulf, and Pacific. Listed roughly
// west-to-east; the seeded RNG below shuffles + samples this list so the
// layout is deterministic across reloads.
const US_METRO_SITES: { city: string; lat: number; lng: number }[] = [
  { city: 'Portland, OR', lat: 45.52, lng: -122.68 },
  { city: 'Eugene, OR', lat: 44.05, lng: -123.09 },
  { city: 'Sacramento, CA', lat: 38.58, lng: -121.49 },
  { city: 'San Jose, CA', lat: 37.34, lng: -121.89 },
  { city: 'Fresno, CA', lat: 36.74, lng: -119.78 },
  { city: 'Los Angeles, CA', lat: 34.05, lng: -118.24 },
  { city: 'San Diego, CA', lat: 32.72, lng: -117.16 },
  { city: 'Reno, NV', lat: 39.53, lng: -119.81 },
  { city: 'Las Vegas, NV', lat: 36.17, lng: -115.14 },
  { city: 'Phoenix, AZ', lat: 33.45, lng: -112.07 },
  { city: 'Tucson, AZ', lat: 32.22, lng: -110.97 },
  { city: 'Boise, ID', lat: 43.62, lng: -116.21 },
  { city: 'Salt Lake City, UT', lat: 40.76, lng: -111.89 },
  { city: 'Albuquerque, NM', lat: 35.08, lng: -106.65 },
  { city: 'Billings, MT', lat: 45.78, lng: -108.5 },
  { city: 'Cheyenne, WY', lat: 41.14, lng: -104.82 },
  { city: 'Denver, CO', lat: 39.74, lng: -104.99 },
  { city: 'El Paso, TX', lat: 31.76, lng: -106.49 },
  { city: 'San Antonio, TX', lat: 29.42, lng: -98.49 },
  { city: 'Austin, TX', lat: 30.27, lng: -97.74 },
  { city: 'Houston, TX', lat: 29.76, lng: -95.37 },
  { city: 'Dallas, TX', lat: 32.78, lng: -96.8 },
  { city: 'Oklahoma City, OK', lat: 35.47, lng: -97.52 },
  { city: 'Wichita, KS', lat: 37.69, lng: -97.34 },
  { city: 'Omaha, NE', lat: 41.26, lng: -95.93 },
  { city: 'Minneapolis, MN', lat: 44.98, lng: -93.27 },
  { city: 'Madison, WI', lat: 43.07, lng: -89.4 },
  { city: 'Milwaukee, WI', lat: 43.04, lng: -87.91 },
  { city: 'Chicago, IL', lat: 41.88, lng: -87.63 },
  { city: 'St. Louis, MO', lat: 38.63, lng: -90.2 },
  { city: 'Memphis, TN', lat: 35.15, lng: -90.05 },
  { city: 'Nashville, TN', lat: 36.16, lng: -86.78 },
  { city: 'New Orleans, LA', lat: 29.95, lng: -90.07 },
  { city: 'Indianapolis, IN', lat: 39.77, lng: -86.16 },
  { city: 'Cincinnati, OH', lat: 39.1, lng: -84.51 },
  { city: 'Columbus, OH', lat: 39.96, lng: -82.99 },
  { city: 'Cleveland, OH', lat: 41.5, lng: -81.69 },
  { city: 'Detroit, MI', lat: 42.33, lng: -83.05 },
  { city: 'Pittsburgh, PA', lat: 40.44, lng: -79.99 },
  { city: 'Buffalo, NY', lat: 42.89, lng: -78.88 },
  { city: 'Atlanta, GA', lat: 33.75, lng: -84.39 },
  { city: 'Charlotte, NC', lat: 35.23, lng: -80.84 },
  { city: 'Raleigh, NC', lat: 35.78, lng: -78.64 },
  { city: 'Richmond, VA', lat: 37.54, lng: -77.43 },
  { city: 'Washington, DC', lat: 38.91, lng: -77.04 },
  { city: 'Philadelphia, PA', lat: 39.95, lng: -75.17 },
  { city: 'Boston, MA', lat: 42.36, lng: -71.06 },
  { city: 'Hartford, CT', lat: 41.76, lng: -72.69 },
  { city: 'Albany, NY', lat: 42.65, lng: -73.76 },
  { city: 'Jacksonville, FL', lat: 30.33, lng: -81.66 },
  { city: 'Orlando, FL', lat: 28.54, lng: -81.38 },
  { city: 'Tampa, FL', lat: 27.95, lng: -82.46 },
]

function buildNorthAmericaFleetSites(): FleetSite[] {
  // Geography matches the modal narrative: USW-7 = US West hub. We anchor the
  // red epicenter in San Francisco rather than Seattle so the focal point of
  // the map sits visually inside the US silhouette instead of the top-left
  // corner — operators don't have to crane their eye into the chrome.
  // Keep these IDs in sync with the AgentHubModal copy ("Agent USW-7 · US
  // West hub") — map and modal must read as one story.
  //
  // Story state: a single critical breach with no cascading warning sites.
  // The fleet legend still surfaces "Warning" as a category so operators
  // recognize the schema, but no warning dots render in this state.
  const reds: FleetSite[] = [
    {
      id: 'critical-west',
      lat: 37.77,
      lng: -122.42,
      ok: false,
      severity: 'critical',
      label: 'USW-7 · Order Processing breach (epicenter)',
    },
  ]

  // Avoid placing healthy pins on top of the critical epicenter (within
  // ~150km). Otherwise the red blast-radius halo swallows a green dot and
  // the operator sees a momentary "is that ok or not" flicker.
  const tooCloseToCritical = (s: { lat: number; lng: number }) =>
    reds.some(
      (r) => Math.abs(r.lat - s.lat) < 1.5 && Math.abs(r.lng - s.lng) < 1.5,
    )

  // Deterministic shuffle of the curated metro list so the green dots scatter
  // across regions instead of clumping in list order, while staying stable
  // across reloads.
  const rand = mulberry32(0x9e3779b1)
  const pool = US_METRO_SITES.filter((s) => !tooCloseToCritical(s))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  const greens: FleetSite[] = pool.map((s, i) => ({
    id: `ok-${i}`,
    lat: s.lat,
    lng: s.lng,
    ok: true,
    label: `Healthy agent · ${s.city}`,
  }))

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

function FleetStatsGrid({ fleetState = 'active_incident' }: { fleetState?: FleetState }) {
  const isAllClear = fleetState === 'all_clear'
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
          {/* Severity ladder — vocabulary mirrors the fleet map legend
              (Healthy / Warning / Critical). Counts swap with fleet state
              so the card never lies (e.g. "Critical 1" while the map and
              alert strip say all-clear). Zero-count rows are filtered out
              so the user never reads "Warning 0" as a category that
              doesn't exist in the current state. */}
          {(
            isAllClear
              ? ([
                  { label: 'Healthy', count: 43, color: 'var(--mc-success)' },
                  { label: 'Critical', count: 0, color: 'var(--mc-critical)' },
                  { label: 'Warning', count: 0, color: 'var(--mc-warn-amber)' },
                ] as const)
              : ([
                  { label: 'Healthy', count: 42, color: 'var(--mc-success)' },
                  { label: 'Critical', count: 1, color: 'var(--mc-critical)' },
                  { label: 'Warning', count: 0, color: 'var(--mc-warn-amber)' },
                ] as const)
          )
            .filter((row) => row.count > 0)
            .map((row) => (
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
      <header className="mc-section-head">
        <h3 className="mc-section-head__title" id="mc-galileo-obs-heading">
          Agent performance
        </h3>
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

function ProtectionCard({ fleetState = 'active_incident' }: { fleetState?: FleetState }) {
  // The Safety ruleset is the live signal of the Order Processing Agent's
  // policy breach — it should read critical while the incident is open and
  // settle to warn (background noise) once we've deployed the retrained build.
  // Headline count drops slightly because fewer blocks fire after retrain.
  const isAllClear = fleetState === 'all_clear'
  const rulesets = [
    {
      name: 'Ruleset 1 · Quality',
      checks: ['Adherence', 'Completeness'],
      triggered: isAllClear ? 6 : 12,
      tone: 'warn' as KpiTone,
    },
    {
      name: 'Ruleset 2 · Safety',
      checks: ['Prompt Injections', 'PII'],
      triggered: isAllClear ? 1 : 4,
      tone: (isAllClear ? 'warn' : 'critical') as KpiTone,
    },
  ]
  const headlineBlocked = isAllClear ? 9 : 16
  return (
    <section className="mc-galileo-card" aria-labelledby="mc-galileo-protect-heading">
      <header className="mc-section-head">
        <h3 className="mc-section-head__title" id="mc-galileo-protect-heading">
          Real-time protection
        </h3>
        <span className="mc-section-head__meta">Last 24 hours</span>
      </header>
      <div className="mc-galileo-card-headline">
        <span className="mc-galileo-card-headline__v">{headlineBlocked}</span>
        <span className="mc-galileo-card-headline__l">risks blocked</span>
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
      <header className="mc-section-head">
        <h3 className="mc-section-head__title" id="mc-galileo-eval-heading">
          Quality evals
        </h3>
        <span className="mc-section-head__meta">Updated 12m ago</span>
      </header>
      <div className="mc-galileo-card-headline">
        <span className="mc-galileo-card-headline__v" style={{ color: 'var(--mc-success)' }}>98.4%</span>
        <span className="mc-galileo-card-headline__l">passing across 124 cases</span>
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
  fleetState = 'active_incident',
}: {
  onSelectProblem: (site: FleetSite) => void
  fleetState?: FleetState
}) {
  // In all-clear, every previously-red site reads as healthy. We map onto the
  // same coordinate set so the visual density of the fleet stays identical —
  // just no red pins.
  const isAllClear = fleetState === 'all_clear'
  const sites = isAllClear ? FLEET_SITES.map((s) => ({ ...s, ok: true })) : FLEET_SITES
  const criticalSites = sites.filter((s) => !s.ok)

  const mapCaption = isAllClear
    ? 'Scroll to zoom · drag to pan'
    : 'Scroll to zoom · drag to pan · click a red pin for incident details'
  const mapAriaLabel = isAllClear
    ? 'North America fleet map. Scroll to zoom, drag to pan. All sites operating within policy.'
    : 'North America fleet map. Scroll to zoom, drag to pan. Click a red pin to open incident details.'

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
        aria-label={mapAriaLabel}
      >
        <MapResizeInvalidator />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <ZoomControl position="bottomright" />
        {sites.map((s) => {
          if (s.ok) {
            return (
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
            )
          }

          // Critical = red epicenter; warning = amber echo.
          const isCritical = (s.severity ?? 'critical') === 'critical'
          const corePin = isCritical ? '#c0132f' : '#d97706'
          const severityMod = isCritical ? 'mc-map-pin--critical' : 'mc-map-pin--warning'
          const pinSize = isCritical ? 18 : 14

          // We were rendering the critical pin + halos as three SVG
          // CircleMarkers and animating `transform: scale()` via CSS
          // keyframes. That doesn't animate reliably on SVG paths inside
          // Leaflet's overlay pane (transform-box: fill-box behaves
          // unpredictably + Leaflet's `setStyle` strips `className` on
          // every re-render). Switched to a divIcon HTML overlay where
          // the pin and its two pulsing halo rings are plain DOM nodes;
          // CSS animations on regular HTML elements are bulletproof.
          const html = `
            <div class="mc-map-pin ${severityMod}" style="--pin-color: ${corePin}; width: ${pinSize}px; height: ${pinSize}px;">
              <span class="mc-map-pin__halo mc-map-pin__halo--outer" aria-hidden></span>
              <span class="mc-map-pin__halo mc-map-pin__halo--mid" aria-hidden></span>
              <span class="mc-map-pin__dot" aria-hidden></span>
            </div>
          `
          const icon = L.divIcon({
            html,
            className: 'mc-map-pin-wrapper',
            iconSize: [pinSize, pinSize],
            iconAnchor: [pinSize / 2, pinSize / 2],
          })

          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={icon}
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
            </Marker>
          )
        })}
      </MapContainer>

      <div className="mc-map-floating-chrome">
        <div className="mc-map-floating-title">
          <p className="mc-type-overline m-0" style={{ color: 'var(--mc-muted-strong)' }}>
            North America fleet
          </p>
          <p className="mc-type-caption m-0 mt-0.5">{mapCaption}</p>
        </div>
        <div className="mc-map-floating-legend" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: 'var(--mc-success)' }} />
            Healthy
          </span>
          {!isAllClear && (
            <>
              <span className="opacity-35">|</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: '#d97706' }} />
                Warning
              </span>
              <span className="opacity-35">|</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: 'var(--mc-critical)' }} />
                Critical
              </span>
            </>
          )}
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

type Usw7AgentStatus = 'ok' | 'warning' | 'critical'

type Usw7AgentEntry = {
  name: string
  sub: string
  status: Usw7AgentStatus
  statusLabel: string
  actionLabel?: string
}

// Story state — narrative split between fleet-zoom and cluster-zoom:
//
//   • At fleet zoom (map / IncidentAlertStrip / FleetStatsGrid) the story
//     is "one critical epicenter" — a single red site in San Francisco,
//     no amber dots. The cascade is part of the same incident, so we
//     don't double-count it at the fleet level.
//
//   • At cluster zoom (AgentUSW7Detail modal) the story is "what's the
//     spread inside this incident" — 1 critical + 2 cascading warnings +
//     3 healthy agents. Drilling in reveals the impact, not the map.
//
// The CTA on the critical agent is "Investigate" (not "Stop traffic");
// stopping traffic is an action taken from inside the Mission Control
// Agent conversation, not the surface-level fleet card.
const USW7_AGENTS: readonly Usw7AgentEntry[] = [
  { name: 'Order Processing Agent', sub: 'US production \u00b7 Retail', status: 'critical', statusLabel: 'Policy breach detected', actionLabel: 'Investigate' },
  { name: 'LLM Routing Agent', sub: 'Primary + fallback', status: 'warning', statusLabel: 'Elevated latency' },
  { name: 'Evaluator Agent', sub: 'Golden sets \u00b7 RAG', status: 'warning', statusLabel: 'Drift detected' },
  { name: 'Response Orchestrator Agent', sub: 'Synthesis + policy', status: 'ok', statusLabel: 'Healthy' },
  { name: 'Compliance Agent', sub: 'Policy enforcement', status: 'ok', statusLabel: 'Healthy' },
  { name: 'Knowledge Base Agent', sub: 'Vector store \u00b7 Retrieval', status: 'ok', statusLabel: 'Healthy' },
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

/**
 * Hand-tuned downstream-impact copy per dependent agent. Written for an IT
 * director — what they *feel* (slow customers, unreliable scores), not what
 * an SRE measures (p95, drift detector). Lifted out of `AgentUSW7Detail` so
 * it can be reused / iterated without touching the modal layout.
 */
const USW7_IMPACT_COPY: Record<string, { headline: string; detail: string }> = {
  'LLM Routing Agent': {
    headline: 'Customer requests are slower',
    detail:
      'These will recover on their own once Order Processing Agent is fixed. No separate action is needed for them.',
  },
  'Evaluator Agent': {
    headline: 'Quality scores are unreliable',
    detail:
      'These will recover on their own once Order Processing Agent is fixed. No separate action is needed for them.',
  },
}

/**
 * Thin horizontal divider — matches Figma "💻 Divider List Entity" — used to
 * partition the four sections inside the inset card body. Kept local because
 * the only consumer is `AgentUSW7Detail`.
 */
function ModalCardDivider() {
  return (
    <div
      className="w-full"
      style={{ height: 1, backgroundColor: 'rgba(94,93,96,0.13)' }}
      aria-hidden
    />
  )
}

/**
 * AgentUSW7Detail — direct port of Figma `Web / Templates / Modal Template`
 * (node 463:18357). Width, padding, type weights, divider treatment and the
 * "single inset neutral card with four sections" structure all come from the
 * Figma. Copy is sourced from the Figma where it diverged from earlier code.
 *
 * Section order inside the inset card (top → bottom):
 *   1. Identity     — "Policy Breach Detected" / agent name / environment
 *   2. Decision     — three-column metric grid (customers / revenue / trend)
 *   3. Impact       — heading + body line + cascading-agent rows
 *   4. Healthy      — three "Working as expected" rows
 *
 * Footer is a real footer band, NOT inline buttons inside the card.
 * Investigate is the filled primary (recommended action); Stop Traffic is the
 * outline secondary (available, but not the default path).
 */

type Usw7Agent = Usw7AgentEntry

type DecisionMetric = { label: string; value: string; sub: string }

const USW7_DECISION_METRICS: DecisionMetric[] = [
  { label: 'Customer Affected', value: '420', sub: 'per hour' },
  { label: 'Revenue At Risk', value: '$180K', sub: 'per hour exposure' },
  { label: 'Trend', value: 'Low', sub: '+12 Warnings/min' },
]

function AgentUSW7Detail({
  onInvestigate,
  onClose,
}: {
  onInvestigate: () => void
  onClose: () => void
}) {
  const critical = USW7_AGENTS.find((a) => a.status === 'critical')
  const warnings = USW7_AGENTS.filter((a) => a.status === 'warning')
  const healthy = USW7_AGENTS.filter((a) => a.status === 'ok')
  const criticalCount = USW7_AGENTS.filter((a) => a.status === 'critical').length
  const warningCount = warnings.length

  return (
    <div
      className="w-full max-w-[520px] rounded-lg flex flex-col max-h-[90vh] overflow-hidden"
      style={{
        backgroundColor: 'var(--slack-pane-bg)',
        border: '1px solid var(--slack-border)',
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.1)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="usw7-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      {/* === Header (Modal Title Bar) ===================================== */}
      <header className="px-7 py-5 flex items-start justify-between gap-3 flex-shrink-0">
        <div className="min-w-0 flex flex-col gap-2">
          <h2
            id="usw7-modal-title"
            className="text-[22px] font-extrabold leading-[30px] m-0 tracking-tight"
            style={{ color: 'var(--slack-text)' }}
          >
            Agent USW-7
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[13px] font-bold leading-[18px] whitespace-nowrap"
              style={{ color: 'var(--mc-muted-strong)' }}
            >
              US West hub &middot; 6 agents
            </span>
            {criticalCount > 0 && (
              <SeverityChip
                count={criticalCount}
                label="Critical"
                color="var(--mc-critical)"
              />
            )}
            {warningCount > 0 && (
              <SeverityChip
                count={warningCount}
                label="Warning"
                color="var(--mc-warn-amber-strong)"
              />
            )}
          </div>
        </div>
        <ModalCloseButton onClick={onClose} />
      </header>

      {/* === Body — single inset neutral card holds all sections ========== */}
      <div className="px-7 pb-2 overflow-auto flex-1 min-h-0">
        <div
          className="rounded-lg flex flex-col gap-2 p-4"
          style={{ backgroundColor: 'var(--mc-tier2-bg)' }}
        >
          {/* — 1. Identity ——————————————————————————————————————————————— */}
          {critical && (
            <div className="flex flex-col">
              <div
                className="text-[12px] font-bold leading-[18px]"
                style={{ color: 'var(--mc-critical)' }}
              >
                Policy Breach Detected
              </div>
              <div className="py-[3px]">
                <div
                  className="text-[15px] font-extrabold leading-[22px]"
                  style={{ color: 'var(--slack-text)' }}
                >
                  {critical.name}
                </div>
              </div>
              <div
                className="text-[12px] leading-[18px]"
                style={{ color: 'var(--slack-msg-muted)' }}
              >
                US Production
              </div>
            </div>
          )}

          <ModalCardDivider />

          {/* — 2. Decision metrics ———————————————————————————————————————— */}
          <div className="grid grid-cols-3 gap-8 items-start">
            {USW7_DECISION_METRICS.map((m) => (
              <div key={m.label} className="min-w-0 flex flex-col">
                <div
                  className="text-[12px] font-bold leading-[18px]"
                  style={{ color: 'var(--slack-msg-muted)' }}
                >
                  {m.label}
                </div>
                <div
                  className="text-[22px] font-extrabold leading-[30px] tabular-nums"
                  style={{ color: 'var(--mc-critical)' }}
                >
                  {m.value}
                </div>
                <div
                  className="text-[12px] font-bold leading-[18px]"
                  style={{ color: 'var(--slack-msg-muted)' }}
                >
                  {m.sub}
                </div>
              </div>
            ))}
          </div>

          {/* — 3. Impact + cascading agents (only when there ARE cascades) — */}
          {warnings.length > 0 && (
            <>
              <ModalCardDivider />
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <div className="py-[3px]">
                    <div
                      className="text-[15px] font-extrabold leading-[22px]"
                      style={{ color: 'var(--slack-text)' }}
                    >
                      Impact
                    </div>
                  </div>
                  <p
                    className="text-[13px] font-bold leading-[18px] m-0"
                    style={{ color: 'var(--slack-msg-muted)' }}
                  >
                    {warnings.length === 1
                      ? 'One other agent is affected.'
                      : `${warnings.length} other agents are affected.`}{' '}
                    These will recover on their own once Order Processing
                    Agent is fixed. No separate action is needed for them.
                    Stopping traffic also pauses these agents.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {warnings.map((agent) => (
                    <CascadeAgentRow
                      key={agent.name}
                      agent={agent}
                      status={USW7_IMPACT_COPY[agent.name]?.headline ?? agent.statusLabel}
                      detail={USW7_IMPACT_COPY[agent.name]?.detail ?? agent.sub}
                      statusColor="var(--mc-warn-amber-strong)"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <ModalCardDivider />

          {/* — 4. Healthy agents ——————————————————————————————————————————— */}
          <div className="flex flex-col gap-2">
            {healthy.map((agent) => (
              <CascadeAgentRow
                key={agent.name}
                agent={agent}
                status="Working as expected"
                detail={agent.sub}
                statusColor="var(--mc-success)"
              />
            ))}
          </div>
        </div>
      </div>

      {/* === Footer — primary actions ===================================== */}
      <footer
        className="px-7 py-6 flex items-center justify-end gap-3 flex-shrink-0"
        style={{ backgroundColor: 'var(--slack-pane-bg)' }}
      >
        {/* Stop Traffic is intentionally the de-emphasized outline action.
            The user already opened a detail modal — they're investigating.
            Stopping traffic is the rarer, deliberate alternative. */}
        <SecondaryButton
          onClick={() => {
            /* UI-only kill switch on this surface; the wired containment
               flow lives inside the Mission Control Agent thread. */
          }}
        >
          Stop Traffic
        </SecondaryButton>
        <PrimaryButton onClick={onInvestigate}>Investigate</PrimaryButton>
      </footer>
    </div>
  )
}

/**
 * Header severity chip — outlined pill (border + text in the same color, no
 * fill) per the Figma `Badge` component. Single height, single padding, single
 * font ramp; severity tone is the only thing that varies.
 */
function SeverityChip({
  count,
  label,
  color,
}: {
  count: number
  label: string
  color: string
}) {
  return (
    <span
      className="inline-flex items-center h-[18px] px-2 gap-1 rounded-[10px] text-[13px] font-bold leading-[18px] whitespace-nowrap"
      style={{ border: `1px solid ${color}`, color }}
    >
      <span>{count}</span>
      <span>{label}</span>
    </span>
  )
}

/**
 * Cascade agent row — used both for warning agents (right side text in amber)
 * and healthy agents (right side text in green). Single primitive so the row
 * rhythm stays identical regardless of severity.
 */
function CascadeAgentRow({
  agent,
  status,
  detail,
  statusColor,
}: {
  agent: Usw7Agent
  status: string
  detail: string
  statusColor: string
}) {
  return (
    <div className="flex flex-col">
      <div className="py-[3px] flex items-baseline gap-1.5">
        <span
          className="flex-1 min-w-0 text-[13px] font-bold leading-[18px]"
          style={{ color: 'var(--slack-text)' }}
        >
          {agent.name}
        </span>
        <span
          className="shrink-0 text-[12px] font-bold leading-[18px] whitespace-nowrap"
          style={{ color: statusColor }}
        >
          {status}
        </span>
      </div>
      <p
        className="text-[13px] leading-[18px] m-0"
        style={{ color: 'var(--slack-msg-muted)' }}
      >
        {detail}
      </p>
    </div>
  )
}

type AgentHubModalView = 'topology' | 'usw7-detail'

function AgentHubModal({
  onInvestigate,
  onClose,
  initialView = 'topology',
}: {
  onInvestigate: () => void
  onClose: () => void
  initialView?: AgentHubModalView
}) {
  const [view, setView] = useState<AgentHubModalView>(initialView)

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

function IncidentAlertStrip({ onViewAffectedAgents }: { onViewAffectedAgents: () => void }) {
  return (
    <div className="mc-alert-strip mc-alert-strip--critical" role="status" aria-label="Critical incident: Domain restriction policy breach on Order Processing Agent">
      <span className="mc-alert-icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2.5L17.5 16.25H2.5L10 2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="none" />
          <path d="M10 7.5V11.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="10" cy="13.75" r="0.75" fill="currentColor" />
        </svg>
      </span>
      <div className="mc-alert-content">
        <div className="mc-alert-headline">
          <span className="mc-alert-severity-chip">Critical</span>
          <span className="mc-alert-title">Domain restriction policy breach</span>
        </div>
        <div className="mc-alert-meta">
          <span className="mc-alert-meta-strong">Order Processing Agent</span>
          <span aria-hidden>·</span>
          <span>US production · Retail</span>
          <span aria-hidden>·</span>
          <span>started 8 min ago</span>
        </div>
      </div>
      <DestructivePrimaryButton
        onClick={onViewAffectedAgents}
        className="shrink-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mc-critical)] focus-visible:ring-offset-1"
      >
        View affected agents
      </DestructivePrimaryButton>
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
  forceFleetState,
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
  /**
   * When the surrounding shell wants to pin the homepage to a specific fleet
   * state (e.g. closure steps showing all-clear), pass it here. Overrides the
   * URL-driven `getFleetStateFromUrl()` lookup. Useful for the closure pan-out
   * after a deploy completes.
   */
  forceFleetState?: FleetState
}) {
  const [agentHubOpen, setAgentHubOpen] = useState(false)
  const [agentHubView, setAgentHubView] = useState<AgentHubModalView>('topology')
  const [investigatedLocal, setInvestigatedLocal] = useState(false)
  const [obsScope, setObsScope] = useState<TimeScope>('1D')
  const [fleetStateLocal, setFleetStateLocal] = useState<FleetState>(getFleetStateFromUrl())
  const fleetState = forceFleetState ?? fleetStateLocal
  const gradIdBase = useId().replace(/:/g, '_')
  const isAllClear = fleetState === 'all_clear'
  const investigated = investigatedLocal || forceInvestigated

  // Re-read fleet state on URL changes (back/forward, demo nav)
  useEffect(() => {
    const onPop = () => setFleetStateLocal(getFleetStateFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
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
            {isAllClear ? (
              <AllClearAlertStrip />
            ) : (
              <IncidentAlertStrip
                onViewAffectedAgents={() => {
                  setAgentHubView('usw7-detail')
                  setAgentHubOpen(true)
                }}
              />
            )}
          </div>

          <div className="mc-hero-segment mc-hero-segment--map">
            <AgentFleetMap
              onSelectProblem={() => {
                setAgentHubView('topology')
                setAgentHubOpen(true)
              }}
              fleetState={fleetState}
            />
          </div>

          {isAllClear && (
            <div className="mc-hero-segment">
              <AllClearHighlight />
            </div>
          )}

          <FleetStatsGrid fleetState={fleetState} />

          <ObservabilityKpiStrip
            idBase={gradIdBase}
            scope={obsScope}
            onScopeChange={setObsScope}
            fleetState={fleetState}
          />

          <div className="mc-galileo-pair">
            <ProtectionCard fleetState={fleetState} />
            <EvaluationCard gradId={`mceg_${gradIdBase}`} />
          </div>

          <div className="mc-hero-segment">
            <PermissionsEvalCard fleetState={fleetState} />
          </div>
        </section>
      )}

      {agentHubOpen && (
        <AgentHubModal
          onInvestigate={handleInvestigate}
          onClose={() => setAgentHubOpen(false)}
          initialView={agentHubView}
        />
      )}
    </div>
  )
}
