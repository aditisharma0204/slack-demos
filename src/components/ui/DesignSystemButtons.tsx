/**
 * Shared buttons that use design tokens from src/styles/slack.css.
 * Use these everywhere so changes to the Foundation Design System apply project-wide.
 */

import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

const baseClass = 'rounded text-sm font-semibold transition hover:opacity-90'

export function PrimaryButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`px-4 py-2 ${baseClass} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-default-bg)',
        color: 'var(--slack-btn-default-text)',
        height: 44,
        fontSize: '15px',
        fontWeight: 600,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function PrimaryButtonLarge({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`px-6 py-3 ${baseClass} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-default-bg)',
        color: 'var(--slack-btn-default-text)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/** Compact secondary style used for chat message choices and case card actions (Claim Case, etc.). */
export function SecondaryButton({
  className = '',
  border = true,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { border?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center flex-shrink-0 px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition hover:bg-[var(--slack-btn-hover-bg)] ${border ? 'border' : ''} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-bg)',
        color: 'var(--slack-text)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
        ...(border
          ? { borderWidth: 1, borderStyle: 'solid' as const, borderColor: 'var(--slack-btn-border)' }
          : { borderWidth: 0, borderStyle: 'none', borderColor: 'transparent' }),
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function DisabledButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`px-4 py-2 rounded text-sm font-medium opacity-50 cursor-not-allowed ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-hover-bg)',
        color: 'var(--slack-msg-muted)',
        fontSize: '13px',
        height: 36,
      }}
      disabled
      {...props}
    >
      {children}
    </button>
  )
}

/** Primary CTA link — same styles as PrimaryButtonLarge, for navigation. */
export function PrimaryLinkLarge({ className = '', children, ...props }: LinkProps) {
  return (
    <Link
      data-button-type="primary"
      className={`inline-flex items-center justify-center px-6 py-3 ${baseClass} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-default-bg)',
        color: 'var(--slack-btn-default-text)',
        height: 44,
        fontSize: '15px',
        fontWeight: 600,
      }}
      {...props}
    >
      {children}
    </Link>
  )
}

/** Secondary link — border style, for navigation. */
export function SecondaryLinkLarge({ className = '', children, ...props }: LinkProps) {
  return (
    <Link
      data-button-type="secondary"
      className={`inline-flex items-center justify-center px-6 py-3 border-2 ${baseClass} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-bg)',
        color: 'var(--slack-text)',
        borderStyle: 'solid',
        borderColor: 'var(--slack-btn-secondary-border)',
        height: 44,
        fontSize: '15px',
        fontWeight: 600,
      }}
      {...props}
    >
      {children}
    </Link>
  )
}
