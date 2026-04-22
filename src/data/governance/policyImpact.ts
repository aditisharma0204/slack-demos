/**
 * Policy → Cohort → Interaction model for the governance demo.
 *
 * This is the shared source of truth that feeds:
 *   - The PolicyImpactGraph (Mission Control investigation tab)
 *   - The PolicyChip + PolicyImpactCard (Mission Control + Slack chat)
 *   - The PermissionsEvalCard (Mission Control homepage, evals row)
 *
 * All values are synthetic and authored to match the Order Processing Agent
 * incident narrative used elsewhere in the demo.
 */

export type CohortId = string
export type PolicyId = string
export type AgentId = string

export type Severity = 'critical' | 'warn' | 'success'
export type InteractionVerdict = 'violated' | 'borderline' | 'ok'

export interface Cohort {
  id: CohortId
  label: string
  scope: string
  exposedPerHour: number
  severity: Severity
}

export interface Policy {
  id: PolicyId
  ref: string
  title: string
  text: string
  owner: string
  version: string
  lastUpdated: string
}

export interface AgentRef {
  id: AgentId
  name: string
  cluster: string
  status: Severity
}

export interface UserInteraction {
  id: string
  cohortId: CohortId
  agentId: AgentId
  policyId: PolicyId
  verdict: InteractionVerdict
  severity: Severity
  snippetRedacted: string
  ts: string
}

// ─── Synthetic fixture data ─────────────────────────────────────────────────

export const POLICIES: Policy[] = [
  {
    id: 'pol_dom_rem_03',
    ref: 'POL-AGT-DOMAIN-REM-03',
    title: 'Agent domain restriction',
    text: 'Agents must only respond to questions within their assigned domain. Off-topic responses constitute a policy violation and must be either declined or routed to a fallback responder.',
    owner: 'Acme Risk · AI Governance',
    version: 'v3.2',
    lastUpdated: '2026-03-04',
  },
  {
    id: 'pol_pii_handling_07',
    ref: 'POL-AGT-PII-HND-07',
    title: 'PII handling in responses',
    text: 'Agents must not echo personally identifying information back to the user in plain text. PII must be masked unless an authenticated session explicitly requests it.',
    owner: 'Acme Risk · Privacy',
    version: 'v2.0',
    lastUpdated: '2026-02-18',
  },
]

export const COHORTS: Cohort[] = [
  {
    id: 'usw7_retail_loggedin',
    label: 'Retail · logged-in',
    scope: 'USW-7 · Retail · authenticated session',
    exposedPerHour: 280,
    severity: 'critical',
  },
  {
    id: 'usw7_guest_checkout',
    label: 'Guest checkout',
    scope: 'USW-7 · Retail · unauthenticated checkout',
    exposedPerHour: 95,
    severity: 'warn',
  },
  {
    id: 'usw7_loyalty',
    label: 'Loyalty members',
    scope: 'USW-7 · Loyalty tier · authenticated',
    exposedPerHour: 45,
    severity: 'warn',
  },
]

export const AGENTS: AgentRef[] = [
  {
    id: 'agt_order_processing',
    name: 'Order Processing Agent',
    cluster: 'USW-7',
    status: 'critical',
  },
  {
    id: 'agt_checkout_assist',
    name: 'Checkout Assist',
    cluster: 'USW-7',
    status: 'warn',
  },
]

export const INTERACTIONS: UserInteraction[] = [
  {
    id: 'int_001',
    cohortId: 'usw7_retail_loggedin',
    agentId: 'agt_order_processing',
    policyId: 'pol_dom_rem_03',
    verdict: 'violated',
    severity: 'critical',
    snippetRedacted: 'User [u_██412] asked about a competitor product; agent answered with comparison table.',
    ts: '2026-04-22T13:24:11Z',
  },
  {
    id: 'int_002',
    cohortId: 'usw7_retail_loggedin',
    agentId: 'agt_order_processing',
    policyId: 'pol_dom_rem_03',
    verdict: 'violated',
    severity: 'critical',
    snippetRedacted: 'User [u_██901] requested travel itinerary advice; agent produced a 3-day plan.',
    ts: '2026-04-22T13:21:48Z',
  },
  {
    id: 'int_003',
    cohortId: 'usw7_guest_checkout',
    agentId: 'agt_order_processing',
    policyId: 'pol_dom_rem_03',
    verdict: 'borderline',
    severity: 'warn',
    snippetRedacted: 'Guest [g_██77] asked for tax advice on order; agent gave generic guidance.',
    ts: '2026-04-22T13:18:02Z',
  },
  {
    id: 'int_004',
    cohortId: 'usw7_loyalty',
    agentId: 'agt_checkout_assist',
    policyId: 'pol_dom_rem_03',
    verdict: 'borderline',
    severity: 'warn',
    snippetRedacted: 'Member [m_██33] asked about restaurants near pickup location; agent listed 5.',
    ts: '2026-04-22T13:09:54Z',
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getPolicy(policyId: PolicyId): Policy | undefined {
  return POLICIES.find((p) => p.id === policyId)
}

export function getPolicyByRef(ref: string): Policy | undefined {
  return POLICIES.find((p) => p.ref === ref)
}

export function getCohort(cohortId: CohortId): Cohort | undefined {
  return COHORTS.find((c) => c.id === cohortId)
}

export function getAgent(agentId: AgentId): AgentRef | undefined {
  return AGENTS.find((a) => a.id === agentId)
}

export interface PolicyImpact {
  policy: Policy
  cohorts: { cohort: Cohort; count: number }[]
  agents: { agent: AgentRef; count: number }[]
  recentInteractions: UserInteraction[]
  totalViolations: number
}

/**
 * Aggregate every recorded interaction against a policy into a single shape
 * usable by both the graph and the chip-expansion card.
 */
export function getImpactForPolicy(policyId: PolicyId): PolicyImpact | undefined {
  const policy = getPolicy(policyId)
  if (!policy) return undefined
  const ints = INTERACTIONS.filter((i) => i.policyId === policyId)
  const cohortCounts = new Map<CohortId, number>()
  const agentCounts = new Map<AgentId, number>()
  for (const i of ints) {
    cohortCounts.set(i.cohortId, (cohortCounts.get(i.cohortId) ?? 0) + 1)
    agentCounts.set(i.agentId, (agentCounts.get(i.agentId) ?? 0) + 1)
  }
  const cohorts = Array.from(cohortCounts.entries())
    .map(([cohortId, count]) => {
      const cohort = getCohort(cohortId)
      return cohort ? { cohort, count } : null
    })
    .filter((x): x is { cohort: Cohort; count: number } => x !== null)
  const agents = Array.from(agentCounts.entries())
    .map(([agentId, count]) => {
      const agent = getAgent(agentId)
      return agent ? { agent, count } : null
    })
    .filter((x): x is { agent: AgentRef; count: number } => x !== null)
  const recentInteractions = [...ints].sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 5)
  const totalViolations = ints.filter((i) => i.verdict === 'violated').length
  return { policy, cohorts, agents, recentInteractions, totalViolations }
}
