import { useState } from 'react'

interface DatePickerModalProps {
  /** Initial start date (YYYY-MM-DD) from demo step if any */
  defaultStart?: string
  /** Initial end date (YYYY-MM-DD) from demo step if any */
  defaultEnd?: string
  onSubmit: () => void
  onCancel?: () => void
}

export function DatePickerModal({
  defaultStart = '2025-03-15',
  defaultEnd = '2025-03-22',
  onSubmit,
  onCancel,
}: DatePickerModalProps) {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="date-picker-title"
    >
      <div
        className="w-full max-w-md rounded-lg shadow-xl flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--slack-pane-bg, #ffffff)',
          border: '1px solid var(--slack-border, #ddd)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--slack-border, #ddd)' }}
        >
          <h2
            id="date-picker-title"
            className="text-lg font-bold"
            style={{ color: 'var(--slack-text, #1d1c1d)' }}
          >
            Choose leave dates
          </h2>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-9 h-9 flex items-center justify-center rounded-md transition-colors hover:bg-[#f5f5f5]"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.4697 3.46962C15.7626 3.17673 16.2373 3.17673 16.5302 3.46962C16.8231 3.76252 16.8231 4.23728 16.5302 4.53017L11.0605 9.9999L16.5302 15.4696C16.8231 15.7625 16.8231 16.2373 16.5302 16.5302C16.2373 16.8231 15.7626 16.8231 15.4697 16.5302L9.99994 11.0604L4.53022 16.5302C4.23732 16.8231 3.76256 16.8231 3.46967 16.5302C3.17678 16.2373 3.17678 15.7625 3.46967 15.4696L8.9394 9.9999L3.46967 4.53017C3.1768 4.23728 3.17679 3.76251 3.46967 3.46962C3.76256 3.17677 4.23733 3.17677 4.53022 3.46962L9.99994 8.93935L15.4697 3.46962Z"
                  fill="currentColor"
                  fillOpacity="0.7"
                />
              </svg>
            </button>
          )}
        </header>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 p-5">
          <div className="space-y-4 flex-1">
            <div>
              <label
                htmlFor="leave-start"
                className="block text-sm font-semibold mb-1"
                style={{ color: 'var(--slack-text, #1d1c1d)' }}
              >
                Start date
              </label>
              <input
                id="leave-start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded border px-3 py-2 text-[15px]"
                style={{
                  borderColor: 'var(--slack-border, #ddd)',
                  color: 'var(--slack-text, #1d1c1d)',
                  backgroundColor: '#fff',
                }}
              />
            </div>
            <div>
              <label
                htmlFor="leave-end"
                className="block text-sm font-semibold mb-1"
                style={{ color: 'var(--slack-text, #1d1c1d)' }}
              >
                End date
              </label>
              <input
                id="leave-end"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded border px-3 py-2 text-[15px]"
                style={{
                  borderColor: 'var(--slack-border, #ddd)',
                  color: 'var(--slack-text, #1d1c1d)',
                  backgroundColor: '#fff',
                }}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 mt-4 border-t flex-shrink-0" style={{ borderColor: 'var(--slack-border, #ddd)' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded text-[15px] font-semibold transition hover:opacity-90"
                style={{
                  backgroundColor: 'var(--slack-msg-hover, #f5f5f5)',
                  color: 'var(--slack-text, #1d1c1d)',
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded text-[15px] font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: 'var(--slack-send-btn, #148567)',
                color: '#fff',
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
