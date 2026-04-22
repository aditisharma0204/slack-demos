/**
 * EvalsPanel — animated evaluation panel shown during the retrain phase.
 *
 * Displays the 4 test categories (State Machine, Input Validation, Conversational
 * Flow, Stress Testing) with live counters that progress through phase 'retraining'
 * and settle into a final pass rate when phase becomes 'retrain-complete'.
 */

import { useEffect, useState } from 'react'

import type { ServicePhase } from './ServiceGraphCanvas'

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
  const isRetraining = phase === 'retraining'
  const isComplete = phase === 'retrain-complete'

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
  const totalFailed = rows.reduce((s, r) => s + r.failed, 0)
  const totalPassed = totalDone - totalFailed
  const overallProgress = totalDone / TOTAL_TESTS
  const livePassRate = totalDone > 0 ? (totalPassed / totalDone) * 100 : 0

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

      <header
        className="px-4 pt-3 pb-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--slack-border)', backgroundColor: 'var(--slack-pane-bg)' }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold m-0" style={{ color: 'var(--slack-text)' }}>
              Running Evals · Order Processing Agent
            </h3>
            <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--slack-msg-muted)' }}>
              Retrain pipeline — gold eval suite + 72h production feedback
            </p>
          </div>
          <PassRateBadge
            isRetraining={isRetraining}
            isComplete={isComplete}
            livePassRate={livePassRate}
            baseline={BASELINE_PASS_RATE}
          />
        </div>
        <div className="mt-2.5">
          <ProgressBar progress={overallProgress} done={totalDone} total={TOTAL_TESTS} />
        </div>
      </header>

      {(isRetraining || isComplete) && (
        <CoverageCards overallProgress={overallProgress} isComplete={isComplete} />
      )}

      <div className="flex-1 min-h-0 overflow-auto px-4 py-3 space-y-2" style={{ backgroundColor: '#fafafa' }}>
        {TESTS.map((test, idx) => (
          <EvalRow key={test.id} test={test} state={rows[idx]} />
        ))}

        {isComplete && <CompletionSummary totalPassed={totalPassed} totalFailed={totalFailed} />}
      </div>
    </div>
  )
}

function PassRateBadge({
  isRetraining,
  isComplete,
  livePassRate,
  baseline,
}: {
  isRetraining: boolean
  isComplete: boolean
  livePassRate: number
  baseline: number
}) {
  if (isComplete) {
    return (
      <div className="text-right">
        <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--slack-msg-muted)' }}>
          Pass rate
        </div>
        <div className="text-base font-extrabold" style={{ color: 'var(--mc-success)' }}>
          98.4%
          <span className="text-[10px] font-semibold ml-1" style={{ color: 'var(--slack-msg-muted)' }}>
            (was {baseline.toFixed(1)}%)
          </span>
        </div>
      </div>
    )
  }
  return (
    <div className="text-right">
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--slack-msg-muted)' }}>
        Pass rate {isRetraining ? '· climbing' : ''}
      </div>
      <div className="text-base font-extrabold" style={{ color: 'var(--mc-accent)' }}>
        {(isRetraining && livePassRate > 0 ? livePassRate : baseline).toFixed(1)}%
      </div>
    </div>
  )
}

function ProgressBar({ progress, done, total }: { progress: number; done: number; total: number }) {
  const pct = Math.round(progress * 100)
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: '#e8e8e8' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 100 ? 'var(--mc-success)' : 'var(--mc-accent)',
            transition: 'width 0.3s ease, background-color 0.3s ease',
          }}
        />
      </div>
      <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--slack-msg-muted)' }}>
        {done}/{total}
      </span>
    </div>
  )
}

function CoverageCards({
  overallProgress,
  isComplete,
}: {
  overallProgress: number
  isComplete: boolean
}) {
  return (
    <div
      className="px-4 pt-2.5 pb-3 flex-shrink-0"
      style={{
        backgroundColor: 'var(--slack-pane-bg)',
        borderBottom: '1px solid var(--slack-border)',
      }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h4
          className="text-[13px] font-extrabold m-0"
          style={{ color: 'var(--slack-text)' }}
        >
          Eval suite coverage
        </h4>
        <button
          type="button"
          className="inline-flex items-center justify-center px-2.5 py-1 rounded text-[12px] font-semibold border transition hover:bg-[var(--slack-btn-hover-bg)] cursor-pointer"
          style={{
            backgroundColor: 'var(--slack-btn-bg)',
            color: 'var(--slack-text)',
            borderColor: 'var(--slack-btn-secondary-border)',
          }}
        >
          View library
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {COVERAGE.map((c) => {
          const passing = isComplete
            ? c.total - c.finalFailed
            : Math.min(c.total, Math.round(c.total * overallProgress))
          const cardStatus: 'running' | 'clean' | 'flagged' = isComplete
            ? c.finalFailed > 0
              ? 'flagged'
              : 'clean'
            : 'running'

          const borderColor =
            cardStatus === 'clean'
              ? '#b8e0ce'
              : cardStatus === 'flagged'
                ? 'var(--mc-critical-soft-border)'
                : 'var(--slack-border)'
          const bg =
            cardStatus === 'clean'
              ? '#f0faf6'
              : cardStatus === 'flagged'
                ? 'var(--mc-critical-soft-bg)'
                : 'var(--slack-pane-bg)'

          return (
            <div
              key={c.id}
              className="rounded-md px-3 py-2.5"
              style={{
                border: `1px solid ${borderColor}`,
                backgroundColor: bg,
                transition: 'border-color 0.3s ease, background-color 0.3s ease',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div
                  className="text-[13px] font-extrabold m-0 truncate"
                  style={{ color: 'var(--slack-text)' }}
                >
                  {c.label}
                </div>
                <CoverageStatusDot status={cardStatus} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[18px] font-extrabold tabular-nums leading-none"
                  style={{
                    color:
                      cardStatus === 'clean'
                        ? 'var(--mc-success)'
                        : cardStatus === 'flagged'
                          ? 'var(--mc-critical)'
                          : 'var(--slack-text)',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {passing}
                </span>
                <span
                  className="text-[13px] font-semibold tabular-nums"
                  style={{ color: 'var(--slack-msg-muted)' }}
                >
                  / {c.total}
                </span>
                <span
                  className="text-[11px] ml-auto"
                  style={{ color: 'var(--slack-msg-muted)' }}
                >
                  passing
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CoverageStatusDot({ status }: { status: 'running' | 'clean' | 'flagged' }) {
  if (status === 'clean') {
    return (
      <span
        className="inline-flex items-center justify-center size-4 rounded-full shrink-0"
        style={{ backgroundColor: 'var(--mc-success)' }}
        aria-label="All passing"
      >
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3.5 8.5L6.5 11.5L12.5 5.5"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }
  if (status === 'flagged') {
    return (
      <span
        className="inline-flex items-center justify-center size-4 rounded-full shrink-0"
        style={{ backgroundColor: 'var(--mc-critical)' }}
        aria-label="Flagged for review"
      >
        <svg width="8" height="8" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 4L12 12M12 4L4 12" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center size-4 rounded-full shrink-0"
      style={{ backgroundColor: '#eef4f8' }}
      aria-label="Running"
    >
      <svg className="ep-spinner" width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6" stroke="var(--mc-accent)" strokeWidth="2" strokeOpacity="0.25" />
        <path
          d="M14 8a6 6 0 0 1-6 6"
          stroke="var(--mc-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )
}

function EvalRow({ test, state }: { test: TestCategory; state: RowState }) {
  const isQueued = state.status === 'queued'
  const isRunning = state.status === 'running'
  const isPassed = state.status === 'passed'
  const isFailed = state.status === 'failed'

  const borderColor = isFailed
    ? 'var(--mc-critical-soft-border)'
    : isPassed
      ? '#b8e0ce'
      : isRunning
        ? '#cde3f0'
        : 'var(--slack-border)'

  const bg = isFailed
    ? 'var(--mc-critical-soft-bg)'
    : isPassed
      ? '#f0faf6'
      : isRunning
        ? '#f3f9fd'
        : 'var(--slack-pane-bg)'

  return (
    <div
      className={`rounded-md px-3 py-2.5 flex items-center gap-3 ${isRunning || isPassed || isFailed ? 'ep-row-active' : ''}`}
      style={{
        border: `1px solid ${borderColor}`,
        backgroundColor: bg,
        opacity: isQueued ? 0.55 : 1,
        transition: 'border 0.3s ease, background-color 0.3s ease, opacity 0.3s ease',
      }}
    >
      <StatusIcon status={state.status} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold m-0" style={{ color: 'var(--slack-text)' }}>
          {test.label}
        </div>
        <div className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--slack-msg-muted)' }}>
          {isQueued && 'Queued'}
          {isRunning && `Running… ${state.done}/${test.total} cases`}
          {isPassed && `${state.done}/${test.total} passed`}
          {isFailed && `${state.done - state.failed}/${test.total} passed · ${state.failed} flagged for review`}
        </div>
      </div>
      <div className="text-[11px] font-mono tabular-nums shrink-0" style={{ color: 'var(--slack-msg-muted)' }}>
        {state.done}/{test.total}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: RowState['status'] }) {
  if (status === 'queued') {
    return (
      <span
        className="inline-flex items-center justify-center size-5 rounded-full shrink-0"
        style={{ backgroundColor: '#e8e8e8' }}
      >
        <span className="size-1.5 rounded-full" style={{ backgroundColor: '#9e9e9e' }} />
      </span>
    )
  }
  if (status === 'running') {
    return (
      <span
        className="inline-flex items-center justify-center size-5 rounded-full shrink-0"
        style={{ backgroundColor: '#eef4f8' }}
      >
        <svg className="ep-spinner" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="6" stroke="var(--mc-accent)" strokeWidth="2" strokeOpacity="0.25" />
          <path
            d="M14 8a6 6 0 0 1-6 6"
            stroke="var(--mc-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
    )
  }
  if (status === 'passed') {
    return (
      <span
        className="inline-flex items-center justify-center size-5 rounded-full shrink-0"
        style={{ backgroundColor: 'var(--mc-success)' }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3.5 8.5L6.5 11.5L12.5 5.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  // failed
  return (
    <span
      className="inline-flex items-center justify-center size-5 rounded-full shrink-0"
      style={{ backgroundColor: 'var(--mc-critical)' }}
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 4L12 12M12 4L4 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function CompletionSummary({ totalPassed, totalFailed }: { totalPassed: number; totalFailed: number }) {
  return (
    <div
      className="mt-3 rounded-lg px-4 py-3"
      style={{ border: '1px solid #b8e0ce', backgroundColor: '#f0faf6' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="7" fill="var(--mc-success)" />
          <path d="M4.5 8.5L7 11L11.5 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-bold" style={{ color: 'var(--mc-success)' }}>
          Quality gate passed
        </span>
      </div>
      <p className="text-xs m-0" style={{ color: 'var(--slack-text)' }}>
        {totalPassed} passed · {totalFailed} flagged for review · 0 policy violations on the held-out test slice
      </p>
      <p className="text-[11px] m-0 mt-1" style={{ color: 'var(--slack-msg-muted)' }}>
        Ready to deploy from the chat thread on the right.
      </p>
    </div>
  )
}
