/**
 * EvalsPanel — animated evaluation panel shown during the retrain phase.
 *
 * Displays the 4 test categories (State Machine, Input Validation, Conversational
 * Flow, Stress Testing) with live counters that progress through phase 'retraining'
 * and settle into a final pass rate when phase becomes 'retrain-complete'.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { PrimaryButton, SecondaryButton, TextLinkButton } from '@/components/ui/DesignSystemButtons'

import type { ServicePhase } from './ServiceGraphCanvas'

/**
 * Review decision for a flagged case.
 * - 'pending': not yet reviewed (red row, Review CTA visible)
 * - 'accepted': reviewer overrides the flag — agent's response was correct
 *               (row turns green, pass rate climbs to 100%)
 * - 'kept': reviewer acknowledges the flag as a known issue
 *           (row settles to a neutral warm state, pass rate stays at 98.4%)
 */
type ReviewDecision = 'pending' | 'accepted' | 'kept'

/**
 * Synthetic detail for the single flagged conversational-flow case.
 * The reviewer needs enough context to decide without leaving the canvas:
 * the prompt, the expected behavior, what the agent actually said, and the
 * policy slice that flagged it.
 */
const FLAGGED_CASE = {
  id: 'CF-031',
  prompt: 'I want to swap my order for a different size — same price, just M instead of L.',
  expected:
    'Confirm the swap is in-policy (same SKU family, same price), reserve the new size, and hand off to fulfillment for the relabel.',
  actual:
    'Acknowledged the request and offered a 10% loyalty credit towards a future order before completing the swap.',
  policySlice: 'POL-AGT-DOMAIN-REM-03 · off-topic upsell during in-flight order edit',
  capturedFrom: 'Production session · 2 days ago',
}

type TestCategory = {
  id: string
  label: string
  total: number
  /** Failures in the BEFORE-retrain run (drives the 91.2% baseline). */
  baselineFailures: number
}

const TESTS: TestCategory[] = [
  { id: 'state-machine', label: 'State Machine Testing', total: 24, baselineFailures: 2 },
  { id: 'input-validation', label: 'Input Validation Testing', total: 18, baselineFailures: 3 },
  { id: 'conversational-flow', label: 'Conversational Flow Testing', total: 32, baselineFailures: 5 },
  { id: 'stress', label: 'Stress Testing', total: 12, baselineFailures: 1 },
]

const TOTAL_TESTS = TESTS.reduce((s, t) => s + t.total, 0)
const TOTAL_FAILURES = TESTS.reduce((s, t) => s + t.baselineFailures, 0)
const BASELINE_PASS_RATE = ((TOTAL_TESTS - TOTAL_FAILURES) / TOTAL_TESTS) * 100 // 91.2%

/**
 * Coverage cards: high-level breakdown of the eval SUITE by Galileo-style
 * dimension (Safety / Quality / Agentic). Independent from the per-row
 * categories below — these cards summarize the test library, the rows show
 * the run progress. Totals add to 86 to match the full suite.
 */
type CoverageCategory = {
  id: string
  label: string
  total: number
  /** Final failure count once retrain completes (drives 98.4% summary). */
  finalFailed: number
}

const COVERAGE: CoverageCategory[] = [
  { id: 'safety', label: 'Safety & Compliance', total: 32, finalFailed: 0 },
  { id: 'quality', label: 'Response Quality', total: 28, finalFailed: 0 },
  { id: 'agentic', label: 'Agentic Behavior', total: 26, finalFailed: 1 },
]

type RowState = {
  done: number
  failed: number
  status: 'queued' | 'running' | 'passed' | 'failed'
}

function initialRows(): RowState[] {
  return TESTS.map(() => ({ done: 0, failed: 0, status: 'queued' }))
}

function completedRows(): RowState[] {
  // Final post-retrain state: everything passes except 1 noise failure in conversational flow.
  return TESTS.map((t) => ({
    done: t.total,
    failed: t.id === 'conversational-flow' ? 1 : 0,
    status: t.id === 'conversational-flow' ? 'failed' : 'passed',
  }))
}

export function EvalsPanel({ phase }: { phase: ServicePhase }) {
  const [rows, setRows] = useState<RowState[]>(() =>
    phase === 'retrain-complete' ? completedRows() : initialRows()
  )
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>('pending')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const isRetraining = phase === 'retraining'
  const isComplete = phase === 'retrain-complete'

  // Reset the review state whenever we leave / re-enter the retrain-complete phase
  // so the demo restarts clean if the reviewer steps backward through the flow.
  useEffect(() => {
    if (!isComplete) {
      setReviewDecision('pending')
      setReviewModalOpen(false)
    }
  }, [isComplete])

  const handleOpenReview = useCallback(() => setReviewModalOpen(true), [])
  const handleCloseReview = useCallback(() => setReviewModalOpen(false), [])
  const handleAccept = useCallback(() => {
    setReviewDecision('accepted')
    setReviewModalOpen(false)
  }, [])
  const handleKeep = useCallback(() => {
    setReviewDecision('kept')
    setReviewModalOpen(false)
  }, [])
  const handleUndo = useCallback(() => setReviewDecision('pending'), [])

  useEffect(() => {
    if (!isRetraining) {
      setRows(isComplete ? completedRows() : initialRows())
      return
    }

    setRows(initialRows())

    // Rough scheduling: first row starts immediately; each subsequent row starts ~600ms later.
    // Each row "ticks" every ~80ms until it finishes.
    const timers: number[] = []

    TESTS.forEach((test, idx) => {
      const startDelay = idx * 600
      const tickInterval = 80

      const startTimer = window.setTimeout(() => {
        setRows((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], status: 'running' }
          return next
        })

        let done = 0
        const interval = window.setInterval(() => {
          done += 1
          setRows((prev) => {
            const next = [...prev]
            const row = next[idx]
            if (done >= test.total) {
              window.clearInterval(interval)
              const failed = test.id === 'conversational-flow' ? 1 : 0
              next[idx] = {
                done: test.total,
                failed,
                status: failed > 0 ? 'failed' : 'passed',
              }
            } else {
              next[idx] = { ...row, done }
            }
            return next
          })
        }, tickInterval)
        timers.push(interval as unknown as number)
      }, startDelay)
      timers.push(startTimer)
    })

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      timers.forEach((t) => window.clearInterval(t))
    }
  }, [isRetraining, isComplete])

  const totalDone = rows.reduce((s, r) => s + r.done, 0)
  const rawTotalFailed = rows.reduce((s, r) => s + r.failed, 0)
  // Once the reviewer accepts the flagged response, the override removes it
  // from the failure count for the run summary (it's still kept in the audit
  // trail — see `reviewDecision` for the surface state).
  const totalFailed = isComplete && reviewDecision === 'accepted' ? 0 : rawTotalFailed
  const totalPassed = totalDone - totalFailed
  const overallProgress = totalDone / TOTAL_TESTS
  const livePassRate = totalDone > 0 ? (totalPassed / totalDone) * 100 : 0

  // Pre-retrain delta (98.4% is the post-retrain headline figure baked into
  // the demo). Surface as +Xpp so improvement reads as the value, not a
  // parenthetical "was X%".
  const finalDeltaPp = 98.4 - BASELINE_PASS_RATE

  return (
    <div className="ep-root flex flex-col h-full overflow-hidden">
      <style>{`
        @keyframes ep-spin { to { transform: rotate(360deg); } }
        .ep-spinner { animation: ep-spin 0.9s linear infinite; }
        @keyframes ep-row-in {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ep-row-active { animation: ep-row-in 0.25s ease-out; }
      `}</style>

      {/* Title removed — the InvestigationCanvas chrome (page title +
          ServiceGraphStatusStrip) already names the agent and current
          state, so a second "Order Processing Agent — Investigation" header
          inside this panel was pure duplication. The inset card below leads
          with its own "Running Evals" headline + status. */}
      <div className="flex-1 min-h-0 overflow-auto px-7 pt-3 pb-3">
        <div
          className="rounded-lg p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--slack-msg-hover)' }}
        >
          {/* Eyebrow + headline + service graph badge + meta */}
          <div className="flex flex-col gap-1">
            <span
              className="text-[12px] font-bold leading-[18px]"
              style={{ color: 'var(--mc-critical)' }}
            >
              Policy Breach Detected
            </span>
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-[15px] font-extrabold leading-[22px]"
                style={{ color: 'var(--slack-text)' }}
              >
                Running Evals
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-[10px] border text-[12px] font-bold leading-[18px] whitespace-nowrap"
                style={{
                  color: 'var(--mc-accent)',
                  borderColor: 'var(--mc-accent)',
                }}
              >
                Service Graph USW-7
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-[12px] leading-[18px] min-w-0"
                style={{ color: 'var(--slack-msg-muted)' }}
              >
                Retrain pipeline &mdash; gold eval suite + 72h production feedback
              </span>
              {isComplete ? (
                <span
                  className="text-[12px] font-bold tabular-nums whitespace-nowrap shrink-0"
                  style={{ color: 'var(--mc-success)' }}
                  title={`Baseline ${BASELINE_PASS_RATE.toFixed(1)}%`}
                >
                  98.4% &nbsp;+{finalDeltaPp.toFixed(1)}pp
                </span>
              ) : isRetraining && totalDone > 0 ? (
                <span
                  className="text-[12px] font-mono tabular-nums whitespace-nowrap shrink-0"
                  style={{ color: 'var(--slack-msg-muted)' }}
                >
                  {(livePassRate || 0).toFixed(1)}%
                </span>
              ) : null}
            </div>
          </div>

          {/* Solid 4px progress bar — green when complete, accent blue while
              running. Figma shows the post-complete state (full green); the
              animated mid-run state still works. */}
          <div
            className="h-1 rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--mc-tier2-border)' }}
          >
            <div
              className="h-full rounded-lg"
              style={{
                width: `${Math.round(overallProgress * 100)}%`,
                backgroundColor: overallProgress >= 1 ? 'var(--mc-success)' : 'var(--mc-accent)',
                transition: 'width 0.3s ease, background-color 0.3s ease',
              }}
            />
          </div>

          {/* Coverage — three column figures, no card chrome. Color of the
              number carries the signal (success vs. flagged). During the
              live run, numbers tick up in primary text. */}
          <div className="flex flex-col gap-2">
            <span
              className="text-[13px] font-bold leading-[18px]"
              style={{ color: 'var(--slack-text)' }}
            >
              Eval suite coverage
            </span>
            <div className="grid grid-cols-3 gap-4">
              {COVERAGE.map((c) => {
                const passing = isComplete
                  ? c.total - c.finalFailed
                  : Math.min(c.total, Math.round(c.total * overallProgress))
                const isFlagged = isComplete && c.finalFailed > 0
                const figureColor = isComplete
                  ? isFlagged
                    ? 'var(--mc-critical)'
                    : 'var(--mc-success)'
                  : 'var(--slack-text)'
                return (
                  <div key={c.id} className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className="text-[13px] font-bold leading-[18px] truncate"
                      style={{ color: 'var(--slack-msg-muted)' }}
                    >
                      {c.label}
                    </span>
                    <span
                      className="text-[18px] font-extrabold leading-[24px] tabular-nums"
                      style={{ color: figureColor, transition: 'color 0.3s ease' }}
                    >
                      {passing}/{c.total}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="h-px w-full" style={{ backgroundColor: 'var(--slack-border)' }} />

          {/* Test rows — minimal two-line layout per Figma (label + status
              right; count line below). */}
          <div className="flex flex-col gap-1">
            {TESTS.map((test, idx) => {
              const isFlaggedRow = test.id === 'conversational-flow'
              return (
                <TestRow
                  key={test.id}
                  test={test}
                  state={rows[idx]}
                  reviewDecision={isFlaggedRow ? reviewDecision : 'pending'}
                />
              )
            })}
          </div>

          {isComplete && (
            <div className="flex flex-col gap-0.5 mt-1">
              <span
                className="text-[15px] font-extrabold leading-[22px]"
                style={{ color: 'var(--slack-text)' }}
              >
                Quality Gate
              </span>
              <p
                className="text-[13px] font-bold leading-[18px] m-0"
                style={{ color: 'var(--slack-msg-muted)' }}
              >
                {qualityGateBody(totalPassed, totalFailed, reviewDecision)}
              </p>
              <p
                className="text-[12px] font-bold leading-[18px] m-0"
                style={{ color: 'var(--slack-msg-muted)' }}
              >
                {reviewDecision === 'pending'
                  ? 'Resolve the flagged case to unlock deploy'
                  : 'Ready to deploy'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer band — single right-aligned action.
            • pending  → outline "Review" opens the flagged-case modal
            • resolved → small audit acknowledgement + Undo text link
          During the live run there's no footer (the panel auto-fills). */}
      {isComplete && reviewDecision === 'pending' && (
        <footer className="px-7 py-5 flex items-center justify-end gap-3 flex-shrink-0">
          <SecondaryButton onClick={handleOpenReview}>Review</SecondaryButton>
        </footer>
      )}
      {isComplete && reviewDecision !== 'pending' && (
        <footer className="px-7 py-5 flex items-center justify-end gap-3 flex-shrink-0">
          <span className="text-[12px]" style={{ color: 'var(--slack-msg-muted)' }}>
            {reviewDecision === 'accepted'
              ? 'Reviewed and accepted by you'
              : 'Flag acknowledged for next training round'}
          </span>
          <TextLinkButton variant="secondary" onClick={handleUndo} className="text-[12px]">
            Undo
          </TextLinkButton>
        </footer>
      )}

      {reviewModalOpen && (
        <FlaggedCaseReviewModal
          onClose={handleCloseReview}
          onAccept={handleAccept}
          onKeep={handleKeep}
        />
      )}
    </div>
  )
}

/** Quality Gate body line — describes the run outcome with reviewer state. */
function qualityGateBody(
  passed: number,
  failed: number,
  decision: ReviewDecision
): string {
  if (decision === 'accepted') {
    return `${passed} passed · 1 reviewed and accepted by you · 0 violations on the held-out test slice`
  }
  if (decision === 'kept') {
    return `${passed} passed · ${failed} flag acknowledged for next training round · 0 violations on the held-out test slice`
  }
  return `${passed} passed · ${failed} flagged for review · 0 violations on the held-out test slice`
}

/**
 * TestRow — minimal two-line row per Figma: label + status on top, count
 * line below. Status text + matching glyph (check / spinner / red text)
 * carries the signal; no row backgrounds.
 *
 * State map:
 *   • queued                → muted "Queued" + 0/total
 *   • running               → blue "Running…" + spinner + done/total
 *   • passed                → green "Pass" + check + done/total
 *   • failed (pending)      → red "Review" (text only) + passed/total — flagged
 *   • failed (accepted)     → green "Pass" + check + done/total — overridden
 *   • failed (kept)         → muted "Acknowledged" + passed/total — to retrain
 */
function TestRow({
  test,
  state,
  reviewDecision,
}: {
  test: TestCategory
  state: RowState
  reviewDecision: ReviewDecision
}) {
  const isQueued = state.status === 'queued'
  const isRunning = state.status === 'running'
  const isPassed = state.status === 'passed'
  const isFailed = state.status === 'failed'
  const isReviewedAccepted = isFailed && reviewDecision === 'accepted'
  const isReviewedKept = isFailed && reviewDecision === 'kept'
  const isPendingReview = isFailed && reviewDecision === 'pending'

  let statusText = ''
  let statusColor = 'var(--mc-success)'
  let glyph: 'check' | 'spinner' | 'none' = 'none'

  if (isQueued) {
    statusText = 'Queued'
    statusColor = 'var(--slack-msg-muted)'
  } else if (isRunning) {
    statusText = 'Running…'
    statusColor = 'var(--mc-accent)'
    glyph = 'spinner'
  } else if (isPassed || isReviewedAccepted) {
    statusText = 'Pass'
    statusColor = 'var(--mc-success)'
    glyph = 'check'
  } else if (isPendingReview) {
    statusText = 'Review'
    statusColor = 'var(--mc-critical)'
  } else if (isReviewedKept) {
    statusText = 'Acknowledged'
    statusColor = 'var(--slack-msg-muted)'
  }

  const passedCount = state.done - state.failed
  let countLine = `${state.done}/${test.total}`
  if (isPendingReview) {
    countLine = `${passedCount}/${test.total} — 1 flagged for review`
  } else if (isReviewedAccepted) {
    countLine = `${state.done}/${test.total} — 1 reviewed and accepted by you`
  } else if (isReviewedKept) {
    countLine = `${passedCount}/${test.total} — 1 acknowledged`
  } else if (isQueued) {
    countLine = `0/${test.total}`
  }

  return (
    <div
      className={`flex flex-col gap-0.5 py-0.5 ${
        isRunning || isPassed || isFailed ? 'ep-row-active' : ''
      }`}
      style={{ opacity: isQueued ? 0.55 : 1, transition: 'opacity 0.3s ease' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex-1 text-[13px] font-bold leading-[18px] min-w-0 truncate"
          style={{ color: 'var(--slack-text)' }}
        >
          {test.label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="text-[12px] font-bold leading-[18px]"
            style={{ color: statusColor, transition: 'color 0.3s ease' }}
          >
            {statusText}
          </span>
          {glyph === 'check' && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <circle cx="6" cy="6" r="5.5" fill="var(--mc-success)" />
              <path
                d="M3.5 6.2L5.2 7.8L8.5 4.5"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
          {glyph === 'spinner' && (
            <svg
              className="ep-spinner"
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <circle cx="8" cy="8" r="6" stroke="var(--mc-accent)" strokeWidth="2" strokeOpacity="0.25" />
              <path
                d="M14 8a6 6 0 0 1-6 6"
                stroke="var(--mc-accent)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="text-[13px] leading-[18px]" style={{ color: 'var(--slack-msg-muted)' }}>
        {countLine}
      </div>
    </div>
  )
}

/**
 * FlaggedCaseReviewModal — overlay that lets the reviewer act on the single
 * flagged conversational-flow case without leaving the canvas.
 *
 * The two terminal actions are deliberately framed in operator language:
 *  • "Accept response" overrides the flag (the agent was correct here).
 *  • "Keep flag" acknowledges the failure and ships it to the next training
 *     round without overriding the eval signal.
 */
function FlaggedCaseReviewModal({
  onClose,
  onAccept,
  onKeep,
}: {
  onClose: () => void
  onAccept: () => void
  onKeep: () => void
}) {
  // Esc closes the modal — same convention as the agent hub modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
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
      <div
        className="w-full rounded-lg shadow-2xl flex flex-col overflow-hidden"
        style={{
          maxWidth: 520,
          maxHeight: '88vh',
          backgroundColor: 'var(--slack-pane-bg)',
          border: '1px solid rgba(29, 28, 29, 0.13)',
          boxShadow: '0 18px 48px rgba(0, 0, 0, 0.1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flagged-case-review-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar — title + meta line + close X (no border per Figma; the
            inset card below provides the visual break). */}
        <header className="px-7 py-5 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h2
                id="flagged-case-review-title"
                className="text-[15px] font-extrabold leading-[22px] m-0"
                style={{ color: 'var(--slack-text)' }}
              >
                Review Conversational Flow Flag
              </h2>
              <p
                className="text-[13px] font-bold leading-[18px] m-0 mt-1 flex items-center gap-2"
                style={{ color: 'var(--slack-msg-muted)' }}
              >
                <span>Production session</span>
                <span aria-hidden>·</span>
                <span>Flagged Case {FLAGGED_CASE.id}</span>
              </p>
            </div>
            {/* The Slack content-area selector in slack.css paints every raw
                <button> green by default, so we need to explicitly null out
                the background here (inline beats the cascade). Hover state is
                handled inline on the button to override the same selector. */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 size-9 rounded flex items-center justify-center transition-colors"
              style={{
                color: 'var(--slack-text)',
                backgroundColor: 'transparent',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(29, 28, 29, 0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Inset content card — wraps the three input-styled fields plus the
            decision context paragraph. Single visual container so the modal
            reads as one focused decision surface. */}
        <div className="px-7 pb-2 overflow-auto flex-1 min-h-0">
          <div
            className="rounded-lg p-4 flex flex-col gap-2"
            style={{ backgroundColor: 'var(--slack-msg-hover)' }}
          >
            <CaseField label="User Prompt" tone="neutral">
              {FLAGGED_CASE.prompt}
            </CaseField>
            <CaseField label="Expected Behavior" tone="neutral">
              {FLAGGED_CASE.expected}
            </CaseField>
            <CaseField label="Agent Response" tone="critical">
              {FLAGGED_CASE.actual}
            </CaseField>

            <div className="h-px w-full my-1" style={{ backgroundColor: 'var(--slack-border)' }} />

            <p
              className="text-[13px] leading-[18px] m-0"
              style={{ color: 'var(--slack-msg-muted)' }}
            >
              Accepting the response will override the flag in the run summary and bump the
              pass rate to 100% for this build. Keeping the flag preserves the eval signal
              and queues the case for the next training round.
            </p>
          </div>
        </div>

        {/* Footer — right-aligned action pair. Cancel removed (the X handles
            dismiss). Keep flag = outline secondary; Accept Response = primary
            green. */}
        <footer className="flex items-center justify-end gap-3 px-7 py-5 flex-shrink-0">
          <SecondaryButton onClick={onKeep}>Keep flag</SecondaryButton>
          <PrimaryButton onClick={onAccept}>Accept Response</PrimaryButton>
        </footer>
      </div>
    </div>
  )
}

/**
 * CaseField — labelled input-styled box per Figma. Label sits above; the
 * value sits inside a white-bg, gray-bordered box that mirrors a disabled
 * read-only input. The `critical` tone repaints the box red for the
 * Agent Response field so the breach is visually obvious.
 */
function CaseField({
  label,
  tone,
  children,
}: {
  label: string
  tone: 'neutral' | 'critical'
  children: ReactNode
}) {
  const isCritical = tone === 'critical'
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[15px] font-bold leading-[22px]"
        style={{ color: 'var(--slack-text)' }}
      >
        {label}
      </span>
      <div
        className="rounded-lg px-3 py-2 text-[15px] leading-[22px]"
        style={{
          border: `1px solid ${
            isCritical ? 'rgba(224, 30, 90, 0.3)' : 'rgba(29, 28, 29, 0.3)'
          }`,
          backgroundColor: isCritical ? '#ffe8ef' : 'var(--slack-pane-bg)',
          color: 'var(--slack-text)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
