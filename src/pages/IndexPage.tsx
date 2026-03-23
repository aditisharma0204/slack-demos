import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import {
  PrimaryLinkLarge,
  SecondaryLinkLarge,
  SecondaryButton,
  DestructivePrimaryButton,
} from '@/components/ui/DesignSystemButtons'
import { getStories } from '@/stories'
import moreIcon from '@/assets/icons/more.svg'
import moreActionsCardIcon from '@/assets/icons/More actions.svg'
import forwardMessageIcon from '@/assets/icons/Forword message.svg'
import { getShareLinkOrigin, sharedDemoUrlSuffix } from '@/utils/sharedDemoLink'

export function IndexPage() {
  const stories = getStories()
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false)
  const [demoMenuOpenId, setDemoMenuOpenId] = useState<string | null>(null)
  const [shareCopiedToast, setShareCopiedToast] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null)
  const moreOptionsRef = useRef<HTMLDivElement>(null)
  const shareToastTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  function showShareCopiedToast() {
    if (shareToastTimeoutRef.current) {
      window.clearTimeout(shareToastTimeoutRef.current)
    }
    setShareCopiedToast(true)
    shareToastTimeoutRef.current = window.setTimeout(() => {
      setShareCopiedToast(false)
      shareToastTimeoutRef.current = null
    }, 2500)
  }

  async function handleDeleteDemo(e: React.MouseEvent, id: string, title: string) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDelete({ id, title })
  }

  async function handleShareDemo(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${getShareLinkOrigin()}/demo/${encodeURIComponent(id)}${sharedDemoUrlSuffix()}`
    try {
      await navigator.clipboard.writeText(url)
      showShareCopiedToast()
      setDemoMenuOpenId(null)
    } catch {
      // Fallback for non-secure contexts or denied permission
      try {
        const textarea = document.createElement('textarea')
        textarea.value = url
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        showShareCopiedToast()
        setDemoMenuOpenId(null)
      } catch {
        alert(`Copy this link manually:\n${url}`)
      }
    }
  }

  function closeConfirm() {
    setConfirmDelete(null)
  }

  async function confirmDeleteDemo() {
    if (!confirmDelete) return
    const { id } = confirmDelete
    setConfirmDelete(null)
    setDeletingId(id)
    try {
      const res = await fetch(`/api/demos/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.status === 204) {
        window.location.reload()
        return
      }
      if (res.status === 404) {
        alert('Demo not found.')
        return
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      alert(data.error || 'Failed to delete demo.')
    } catch {
      alert(
        'Delete is only available when running the dev server (npm run dev). Otherwise run: npm run delete-demo -- ' +
          id
      )
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(target)) {
        setMoreOptionsOpen(false)
      }
      const inDemoMenu = (target as Element).closest?.('[data-demo-card-menu]')
      if (!inDemoMenu && demoMenuOpenId !== null) {
        setDemoMenuOpenId(null)
      }
    }
    if (moreOptionsOpen || demoMenuOpenId !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [moreOptionsOpen, demoMenuOpenId])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setConfirmDelete(null)
      setDemoMenuOpenId(null)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    return () => {
      if (shareToastTimeoutRef.current) {
        window.clearTimeout(shareToastTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--slack-msg-hover)' }}>
      {/* Hero */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 text-center max-w-4xl mx-auto">
        <h1
          className="font-black text-4xl lg:text-5xl xl:text-6xl leading-tight mb-6 flex items-center justify-center gap-3"
          style={{ color: 'var(--slack-text)', fontSize: '60px' }}
        >
          <img
            src="/assets/slack-logo.svg"
            alt=""
            className="flex-shrink-0"
            style={{ width: '56px', height: '56px' }}
          />
          Slack Demos
        </h1>
        <p
          className="text-xl lg:text-2xl mb-10 max-w-2xl mx-auto"
          style={{ color: 'var(--slack-msg-muted)', lineHeight: 1.4 }}
        >
          Write your story in paragraphs. I&apos;ll create the Slack demo—chat bubbles, personas, and all.
        </p>
        <div className="flex flex-row gap-4 justify-center flex-nowrap items-center">
          <PrimaryLinkLarge to="/canvas">Create new story</PrimaryLinkLarge>
          <SecondaryLinkLarge to="/reference">Instructions</SecondaryLinkLarge>
          <div className="relative" ref={moreOptionsRef}>
            <SecondaryButton
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMoreOptionsOpen((v) => !v)
              }}
              aria-expanded={moreOptionsOpen}
              aria-haspopup="true"
              aria-label="More options"
            >
              <img src={moreIcon} alt="" className="w-5 h-5" />
            </SecondaryButton>
            {moreOptionsOpen && (
              <div
                className="absolute left-0 top-full mt-1 min-w-[180px] rounded-lg border py-1 shadow-lg z-10"
                style={{
                  backgroundColor: 'var(--slack-pane-bg)',
                  borderColor: 'var(--slack-border)',
                }}
                role="menu"
              >
                <Link
                  to="/slackbot-templates"
                  className="block w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-[var(--slack-msg-hover)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--slack-avatar-bg)] rounded-t-lg"
                  style={{ color: 'var(--slack-text)' }}
                  role="menuitem"
                  onClick={() => setMoreOptionsOpen(false)}
                >
                  Slackbot templates
                </Link>
                <Link
                  to="/design-system"
                  className="block w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-[var(--slack-msg-hover)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--slack-avatar-bg)] rounded-b-lg"
                  style={{ color: 'var(--slack-text)' }}
                  role="menuitem"
                  onClick={() => setMoreOptionsOpen(false)}
                >
                  Design system
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Demos section */}
      {stories.length > 0 && (
        <section className="flex-1 px-6 lg:px-12 pb-20">
          <div className="max-w-4xl mx-auto">
            <h2
              className="font-bold text-2xl mb-6"
              style={{ color: 'var(--slack-text)' }}
            >
              My Demos
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[...stories]
                .reverse()
                .map((s) => (
                <div
                  key={s.id}
                  className="relative flex flex-col p-6 rounded-lg transition hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--slack-pane-bg)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <div className="flex">
                    <Link
                      to={`/demo/${s.id}`}
                      className="flex flex-col focus:outline-none focus:ring-0 rounded-lg"
                    >
                      <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--slack-text)' }}>
                        {s.title}
                      </h3>
                      <span
                        className="inline-block mt-3 text-sm font-semibold"
                        style={{ color: 'var(--slack-mention)' }}
                      >
                        View demo →
                      </span>
                    </Link>
                  </div>
                  <div className="absolute top-4 right-4 z-20" data-demo-card-menu>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDemoMenuOpenId((open) => (open === s.id ? null : s.id))
                      }}
                      disabled={deletingId === s.id}
                      className="inline-flex items-center justify-center rounded border-2 font-semibold transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--slack-avatar-bg)] focus:ring-offset-2 disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--slack-btn-bg)',
                        color: 'var(--slack-text)',
                        borderColor: 'var(--slack-btn-secondary-border)',
                        padding: '8px',
                        boxSizing: 'content-box',
                      }}
                      aria-expanded={demoMenuOpenId === s.id}
                      aria-haspopup="true"
                      aria-label={`More actions for ${s.title}`}
                      title="More actions"
                    >
                      <img src={moreActionsCardIcon} alt="" className="w-[18px] h-[18px]" />
                    </button>
                    {demoMenuOpenId === s.id && (
                      <div
                        className="absolute right-0 top-full mt-1 min-w-[200px] rounded-lg border py-1 shadow-lg"
                        style={{
                          backgroundColor: 'var(--slack-pane-bg)',
                          borderColor: 'var(--slack-border)',
                        }}
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition hover:bg-[var(--slack-msg-hover)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--slack-avatar-bg)] rounded-t-lg"
                          style={{
                            color: 'var(--slack-text)',
                            background: 'unset',
                            backgroundColor: 'unset',
                            backgroundImage: 'none',
                            border: 'none',
                            borderColor: 'rgba(0, 0, 0, 0)',
                            borderImage: 'none',
                          }}
                          onClick={(e) => handleShareDemo(e, s.id)}
                        >
                          <img src={forwardMessageIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                          Share demo
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition hover:bg-[var(--slack-msg-hover)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--slack-avatar-bg)] rounded-b-lg"
                          style={{
                            color: 'var(--slack-text)',
                            background: 'unset',
                            backgroundColor: 'unset',
                            backgroundImage: 'none',
                            border: 'none',
                            borderColor: 'rgba(0, 0, 0, 0)',
                            borderImage: 'none',
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDemoMenuOpenId(null)
                            handleDeleteDemo(e, s.id, s.title)
                          }}
                          disabled={deletingId === s.id}
                        >
                          <Trash2 className="w-[18px] h-[18px] shrink-0" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer - minimal Slack-style */}
      <footer
        className="mt-auto py-6 px-6 lg:px-12 text-center"
        style={{ color: 'var(--slack-msg-muted)', fontSize: '13px' }}
      >
        <p>Create click-through Slack prototypes for demos and training.</p>
      </footer>

      {/* Page-level copy confirmation */}
      {shareCopiedToast && (
        <div
          className="fixed bottom-6 left-1/2 z-40 max-w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-lg border px-4 py-3 shadow-lg pointer-events-none"
          style={{
            backgroundColor: 'var(--slack-pane-bg)',
            borderColor: 'var(--slack-border)',
            color: 'var(--slack-text)',
          }}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-center">Link copied to clipboard</p>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          onClick={closeConfirm}
        >
          <div
            className="rounded-xl shadow-lg max-w-md w-full p-6"
            style={{
              backgroundColor: 'var(--slack-pane-bg)',
              border: '1px solid var(--slack-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-confirm-title"
              className="font-bold text-xl mb-2"
              style={{ color: 'var(--slack-text)' }}
            >
              Delete demo?
            </h2>
            <p className="text-[15px] leading-relaxed mb-1" style={{ color: 'var(--slack-text)' }}>
              Do you really want to delete &quot;{confirmDelete.title}&quot;? This will permanently
              remove this demo and all its files.
            </p>
            <p className="text-[15px] font-semibold mb-6" style={{ color: 'var(--slack-msg-muted)' }}>
              This action cannot be undone.
            </p>
            <div className="flex flex-wrap gap-3 justify-end">
              <SecondaryButton onClick={closeConfirm}>Cancel</SecondaryButton>
              <DestructivePrimaryButton onClick={confirmDeleteDemo}>Delete</DestructivePrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
