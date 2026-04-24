/**
 * Shared buttons that use design tokens from src/styles/slack.css.
 * Use these everywhere so changes to the Foundation Design System apply project-wide.
 *
 * Default primary actions (`PrimaryButton`, `DestructivePrimaryButton`, `PrimaryLinkLarge`):
 * 36px height, 13px text, px-3 py-2, rounded-lg. Use `PrimaryButtonLarge` / `SecondaryButtonLarge` /
 * `DisabledButtonLarge` when a flow needs the 44px row. Text-only links: `TextLinkButton` + slack.css
 * `link-button--*` modifiers.
 */

import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

export type TextLinkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Primary (green), secondary (body), or disabled appearance. */
  variant?: 'primary' | 'secondary' | 'disabled'
  /** Default 13px semibold; large matches 15px primary/secondary solid buttons. */
  size?: 'default' | 'large'
}

/** Default primary (and matching destructive) control: 36px × 13px, px-3, rounded-lg. */
const primaryDefaultLayoutClass =
  'inline-flex items-center justify-center flex-shrink-0 px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition hover:opacity-90'

export function PrimaryButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${primaryDefaultLayoutClass} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-default-bg)',
        color: 'var(--slack-btn-default-text)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
        border: 'none',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/** Default-size negative action — same footprint/layout as PrimaryButton with red styling. */
export function NegativeButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${primaryDefaultLayoutClass} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-danger-bg)',
        color: 'var(--slack-btn-danger-text)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
        border: 'none',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Filled red destructive action. Same footprint as PrimaryButton / SecondaryButton
 * so Cancel / Delete pairs in modals align cleanly.
 */
export function DestructivePrimaryButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${primaryDefaultLayoutClass} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-danger-bg)',
        color: 'var(--slack-btn-danger-text)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
        border: 'none',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/** Larger primary when a step or flow explicitly needs more prominence (e.g. OAuth allow). */
export function PrimaryButtonLarge({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center flex-shrink-0 px-4 py-2 rounded-lg text-[15px] font-semibold whitespace-nowrap transition hover:opacity-90 ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-default-bg)',
        color: 'var(--slack-btn-default-text)',
        height: 44,
        fontSize: '15px',
        fontWeight: 600,
        border: 'none',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/** Large negative action — same footprint/layout as PrimaryButtonLarge with red styling. */
export function NegativeButtonLarge({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center flex-shrink-0 px-4 py-2 rounded-lg text-[15px] font-semibold whitespace-nowrap transition hover:opacity-90 ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-danger-bg)',
        color: 'var(--slack-btn-danger-text)',
        height: 44,
        fontSize: '15px',
        fontWeight: 600,
        border: 'none',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/** Large secondary — pairs with PrimaryButtonLarge (44px / 15px / px-4 / rounded-lg). */
export function SecondaryButtonLarge({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center flex-shrink-0 px-4 py-2 rounded-lg border text-[15px] font-semibold whitespace-nowrap transition hover:bg-[var(--slack-btn-hover-bg)] ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-bg)',
        color: 'var(--slack-text)',
        height: 44,
        fontSize: '15px',
        fontWeight: 600,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--slack-btn-border)',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/** Large disabled — same footprint as PrimaryButtonLarge. */
export function DisabledButtonLarge({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled
      className={`inline-flex items-center justify-center flex-shrink-0 px-4 py-2 rounded-lg text-[15px] font-semibold whitespace-nowrap opacity-50 cursor-not-allowed ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-hover-bg)',
        color: 'var(--slack-msg-muted)',
        height: 44,
        fontSize: '15px',
        fontWeight: 600,
        border: 'none',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Outline (secondary) variant of PrimaryButton — green text + green border on
 * a transparent / white fill. Use when a primary action sits next to a peer
 * action of equal weight and a solid PrimaryButton would feel too loud (e.g.
 * "Investigate" alongside "Stop traffic" in an incident card). Same 36px /
 * 13px footprint as PrimaryButton + SecondaryButton so they line up.
 */
export function SecondaryPrimaryButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center flex-shrink-0 px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition hover:bg-[color-mix(in_srgb,var(--slack-btn-default-bg)_8%,white)] ${className}`.trim()}
      style={{
        backgroundColor: 'transparent',
        color: 'var(--slack-btn-default-bg)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--slack-btn-default-bg)',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Outline (secondary) variant of NegativeButton — red text + red border on a
 * transparent / white fill. Use for destructive actions that should still be
 * one click away but don't deserve a solid red wall (e.g. "Stop traffic" in
 * the agent hub modal where the primary investigative path is the safer default).
 * Same 36px / 13px footprint as PrimaryButton + SecondaryButton.
 */
export function DestructiveSecondaryButton({
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center flex-shrink-0 px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition hover:bg-[color-mix(in_srgb,var(--slack-btn-danger-bg)_8%,white)] ${className}`.trim()}
      style={{
        backgroundColor: 'transparent',
        color: 'var(--slack-btn-danger-bg)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--slack-btn-danger-bg)',
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
      className={`inline-flex items-center justify-center flex-shrink-0 px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap opacity-50 cursor-not-allowed ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-hover-bg)',
        color: 'var(--slack-msg-muted)',
        fontSize: '13px',
        height: 36,
        fontWeight: 600,
        border: 'none',
      }}
      disabled
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Underlined text-only control (no fill). Uses `link-button` + modifiers in slack.css.
 * Pair with PrimaryButton / SecondaryButton / DisabledButton for default size, or large solids.
 */
export function TextLinkButton({
  variant = 'primary',
  size = 'default',
  className = '',
  disabled,
  children,
  ...props
}: TextLinkButtonProps) {
  const isDisabled = Boolean(disabled) || variant === 'disabled'
  const variantClass = isDisabled
    ? 'link-button--disabled'
    : variant === 'secondary'
      ? 'link-button--secondary'
      : 'link-button--primary'
  const sizeClass = size === 'large' ? 'link-button--large' : 'text-[13px] font-semibold leading-relaxed'
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`link-button ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

/** Primary CTA link — same footprint as PrimaryButton (default primary sizing). */
export function PrimaryLinkLarge({ className = '', children, ...props }: LinkProps) {
  return (
    <Link
      data-button-type="primary"
      className={`${primaryDefaultLayoutClass} ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-default-bg)',
        color: 'var(--slack-btn-default-text)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
        border: 'none',
      }}
      {...props}
    >
      {children}
    </Link>
  )
}

/** Secondary outline link — same footprint as SecondaryButton, for navigation. */
export function SecondaryLinkLarge({ className = '', children, ...props }: LinkProps) {
  return (
    <Link
      data-button-type="secondary"
      className={`inline-flex items-center justify-center flex-shrink-0 px-3 py-2 rounded-lg border text-[13px] font-semibold whitespace-nowrap transition hover:bg-[var(--slack-btn-hover-bg)] ${className}`.trim()}
      style={{
        backgroundColor: 'var(--slack-btn-bg)',
        color: 'var(--slack-text)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--slack-btn-border)',
        height: 36,
        fontSize: '13px',
        fontWeight: 600,
      }}
      {...props}
    >
      {children}
    </Link>
  )
}
