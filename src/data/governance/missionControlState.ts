/**
 * Fleet state for the Agentic Mission Control surface.
 *
 * The homepage renders different content depending on the current fleet state.
 * v1 supports two states end-to-end (`active_incident` and `all_clear`); the
 * other states are reserved for future expansion (watching / containment in
 * flight / cooling down post-incident).
 *
 * For the demo, the state is sticky for the life of the page and can be
 * overridden via the `?fleet=` query param so reviewers can flip between
 * homepages without touching code.
 */

export type FleetState =
  | 'all_clear'
  | 'watching'
  | 'active_incident'
  | 'containment'
  | 'cooling_down'

export const FLEET_STATES: readonly FleetState[] = [
  'all_clear',
  'watching',
  'active_incident',
  'containment',
  'cooling_down',
] as const

export const DEFAULT_FLEET_STATE: FleetState = 'active_incident'

/**
 * Read the desired fleet state from the URL (`?fleet=all_clear`).
 * Falls back to the demo default when missing or invalid.
 */
export function getFleetStateFromUrl(): FleetState {
  if (typeof window === 'undefined') return DEFAULT_FLEET_STATE
  const param = new URLSearchParams(window.location.search).get('fleet')
  if (param && (FLEET_STATES as readonly string[]).includes(param)) {
    return param as FleetState
  }
  return DEFAULT_FLEET_STATE
}

/** Display label for a state — used in dev affordances and audit captions. */
export function fleetStateLabel(state: FleetState): string {
  switch (state) {
    case 'all_clear':
      return 'All clear'
    case 'watching':
      return 'Watching'
    case 'active_incident':
      return 'Active incident'
    case 'containment':
      return 'Containment in flight'
    case 'cooling_down':
      return 'Cooling down'
  }
}
