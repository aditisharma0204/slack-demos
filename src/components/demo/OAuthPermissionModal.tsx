import type { ReactNode } from 'react'
import type { OAuthModalUsageItem } from '@/types'
import {
  ArrowLeftRight,
  ChevronDown,
  Plug,
  Sparkles,
  User,
} from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/DesignSystemButtons'

const textPrimary = '#1d1c1d'
const textMuted = '#616061'
const borderLight = 'rgba(97, 96, 97, 0.2)'
const greyPanel = '#f8f8f8'
const linkBlue = 'var(--slack-mention)'

export interface OAuthPermissionModalProps {
  /** Right-hand app in the title (e.g. Cornerstone OnDemand, Workday) */
  integrationName?: string
  /** Centered headline; default: Sign in to {integrationName} with Slack */
  modalTitle?: string
  /** Legacy: used in default usage copy when no custom items */
  appName?: string
  onAllow: () => void
  onCancel?: () => void

  accountSectionLabel?: string
  userDisplayName?: string
  userEmail?: string
  workspaceUrl?: string
  /** Small badge on avatar (e.g. Staff) */
  accountBadge?: string

  /** Single letter / short mark in the integration logo tile */
  integrationInitial?: string
  integrationLogoBg?: string
  /** Optional URL for right logo; overrides initial tile */
  integrationLogoUrl?: string

  usageHeading?: string
  /** Three lines with plug / user / sparkle icons (in order) */
  usageItems?: OAuthModalUsageItem[]

  /** Footer microcopy; segments wrapped in *asterisks* render as link style */
  legalNotice?: string

  allowButtonLabel?: string

  /** When true, renders only the modal panel (no full-screen backdrop). For design previews. */
  embedded?: boolean
}

const defaultUsageItems = (integration: string, agent: string): OAuthModalUsageItem[] => [
  {
    text: `Establish a verified connection between your existing ${integration} account and Slack.`,
  },
  {
    text: `Allow ${agent} to read your learning profile, completed courses, and active learning paths in ${integration}.`,
  },
  {
    text: `Unlock ${integration} features in Slack, like personalized course recommendations, progress context, and quick actions from chat.`,
  },
]

const defaultLegal = (integration: string) =>
  `Slack will share your name, email address, profile image, user ID, and team ID with ${integration}. *View Slack's privacy policy* By agreeing to allow Slack to share your identity, you are also agreeing to ${integration}'s *privacy agreement* and *terms of service*.`

function renderLegalWithLinks(text: string): ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      const label = part.slice(1, -1)
      const isSlackPrivacy = /slack/i.test(label) && /privacy/i.test(label)
      const href = isSlackPrivacy ? 'https://slack.com/trust/privacy/privacy-policy' : '#'
      return (
        <a
          key={i}
          href={href}
          onClick={href === '#' ? (e) => e.preventDefault() : undefined}
          {...(href !== '#' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="font-semibold underline-offset-2 hover:underline inline"
          style={{ color: linkBlue }}
        >
          {label}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function OAuthPermissionModal({
  integrationName = 'Cornerstone OnDemand',
  modalTitle,
  appName = 'Agentforce HR',
  onAllow,
  onCancel,
  accountSectionLabel = 'Select a Slack account or workspace.',
  userDisplayName = 'Alex Rivera',
  userEmail = 'alex.rivera@acme.com',
  workspaceUrl = 'acme-inc.slack.com',
  accountBadge = 'Staff',
  integrationInitial,
  integrationLogoBg = '#5c2d91',
  integrationLogoUrl,
  usageHeading = 'Your account details will be used to:',
  usageItems,
  legalNotice,
  allowButtonLabel = 'Allow Access',
  embedded = false,
}: OAuthPermissionModalProps) {
  const title =
    modalTitle?.trim() ||
    `Sign in to ${integrationName} with Slack.`

  const items =
    usageItems?.length === 3
      ? usageItems
      : defaultUsageItems(integrationName, appName)

  const usageIcons = [
    <Plug key="p" className="w-[18px] h-[18px] shrink-0" strokeWidth={2} style={{ color: textMuted }} aria-hidden />,
    <User key="u" className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} style={{ color: textMuted }} aria-hidden />,
    <Sparkles key="s" className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} style={{ color: textMuted }} aria-hidden />,
  ]

  const initial =
    integrationInitial?.trim() ||
    (integrationName
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CS')

  const initials = userDisplayName
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const legal = legalNotice ?? defaultLegal(integrationName)
  const badge = accountBadge?.trim()

  const panel = (
      <div
        className="w-full max-w-[600px] rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${borderLight}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-2 text-center">
          <h1
            id="oauth-signin-title"
            className="text-[22px] font-black leading-snug px-2"
            style={{ color: textPrimary }}
          >
            {title}
          </h1>

          <div className="flex items-center justify-center gap-4 mt-6 mb-2">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm border"
              style={{
                backgroundColor: '#ffffff',
                borderColor: borderLight,
              }}
            >
              <img src="/assets/slack-logo.svg" alt="" className="w-9 h-9" />
            </div>
            <ArrowLeftRight className="w-6 h-6 shrink-0" strokeWidth={1.5} style={{ color: textMuted }} aria-hidden />
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden border"
              style={{
                backgroundColor: integrationLogoUrl ? '#fff' : integrationLogoBg,
                borderColor: borderLight,
              }}
            >
              {integrationLogoUrl ? (
                <img
                  src={integrationLogoUrl}
                  alt=""
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-white text-sm font-bold tracking-tight">{initial}</span>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 pb-6">
          <p
            className="text-[13px] font-bold mb-2"
            style={{ color: textPrimary }}
          >
            {accountSectionLabel}
          </p>
          <button
            type="button"
            className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition hover:bg-[#fafafa]"
            style={{
              border: '1px solid var(--slack-border)',
              backgroundColor: '#ffffff',
            }}
          >
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 rounded-md flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--slack-send-btn, #611f69)' }}
              >
                {initials}
              </div>
              {badge && (
                <span
                  className="absolute -bottom-1 -left-1 text-[9px] font-bold uppercase px-1 py-px rounded leading-none border"
                  style={{
                    backgroundColor: '#ffffff',
                    color: textPrimary,
                    borderColor: borderLight,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold leading-tight truncate" style={{ color: textPrimary }}>
                {userDisplayName}
              </p>
              <p className="text-[13px] leading-snug truncate mt-0.5" style={{ color: textMuted }}>
                {userEmail}
              </p>
              <p className="text-[13px] leading-snug truncate" style={{ color: textMuted }}>
                {workspaceUrl}
              </p>
            </div>
            <ChevronDown className="w-5 h-5 shrink-0" style={{ color: textMuted }} aria-hidden />
          </button>
        </div>

        <div className="px-8 pb-6">
          <div
            className="rounded-lg px-4 py-4"
            style={{
              backgroundColor: greyPanel,
            }}
          >
            <p className="text-[13px] font-bold mb-3" style={{ color: textPrimary }}>
              {usageHeading}
            </p>
            <ul className="space-y-3 list-none m-0 p-0">
              {items.map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="shrink-0 w-8 h-8 rounded flex items-center justify-center mt-0.5">
                    {usageIcons[idx]}
                  </span>
                  <span className="text-[14px] leading-relaxed pt-1" style={{ color: textPrimary }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-8 pb-6">
          <p className="text-[12px] leading-relaxed text-left" style={{ color: textMuted }}>
            {renderLegalWithLinks(legal)}
          </p>
        </div>

        <div
          className="flex flex-wrap gap-3 justify-center px-8 py-5 border-t"
          style={{ borderColor: borderLight }}
        >
          <SecondaryButton onClick={onCancel} className="w-fit min-w-0 px-5 py-2.5 rounded-md">
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={onAllow}
            className="w-fit min-w-0 shrink-0"
          >
            {allowButtonLabel}
          </PrimaryButton>
        </div>
      </div>
  )

  if (embedded) {
    return (
      <div
        className="w-full flex justify-center"
        role="region"
        aria-label="OAuth permission modal preview"
      >
        {panel}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-signin-title"
    >
      {panel}
    </div>
  )
}
