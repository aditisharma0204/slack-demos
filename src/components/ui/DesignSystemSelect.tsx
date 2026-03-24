import type { SelectHTMLAttributes } from 'react'

export const designSystemSelectBaseClassName =
  'rounded px-2 py-2 text-sm border outline-none mx-0 bg-[var(--slack-input-bg)] text-[var(--slack-text)] border-[var(--slack-input-border)]'

type DesignSystemSelectProps = SelectHTMLAttributes<HTMLSelectElement>

/** Canonical select control for Foundation + template previews. */
export function DesignSystemSelect({ className = '', children, ...props }: DesignSystemSelectProps) {
  return (
    <select
      className={`${designSystemSelectBaseClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  )
}

type SelectAccessoryPreviewProps = {
  label: string
  className?: string
}

/** Non-interactive select-style trigger for Block Kit accessory previews. */
export function SelectAccessoryPreview({ label, className = '' }: SelectAccessoryPreviewProps) {
  return (
    <div
      className={`inline-flex items-center justify-between flex-shrink-0 h-9 min-w-[122px] ${designSystemSelectBaseClassName} font-medium whitespace-nowrap ${className}`.trim()}
      aria-hidden="true"
    >
      <span>{label}</span>
      <span aria-hidden="true" className="ml-2 text-[12px]" style={{ color: '#616061' }}>
        ▾
      </span>
    </div>
  )
}
