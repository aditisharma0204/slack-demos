import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { PrimaryLinkLarge, SecondaryLinkLarge, SecondaryButton } from '@/components/ui/DesignSystemButtons'
import { getStories } from '@/stories'
import moreIcon from '@/assets/icons/more.svg'

export function IndexPage() {
  const stories = getStories()
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null)
  const moreOptionsRef = useRef<HTMLDivElement>(null)

  async function handleDeleteDemo(e: React.MouseEvent, id: string, title: string) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDelete({ id, title })
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
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setMoreOptionsOpen(false)
      }
    }
    if (moreOptionsOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [moreOptionsOpen])

  useEffect(() => {
    if (!confirmDelete) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmDelete(null)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [confirmDelete])

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
                  className="relative p-6 rounded-lg transition hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--slack-pane-bg)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <Link
                    to={`/demo/${s.id}`}
                    className="block focus:outline-none focus:ring-0 rounded-lg -m-2 p-2"
                  >
                    <h3 className="font-bold text-lg mb-1 pr-8" style={{ color: 'var(--slack-text)' }}>
                      {s.title}
                    </h3>
                    <span
                      className="inline-block mt-3 text-sm font-semibold"
                      style={{ color: 'var(--slack-mention)' }}
                    >
                      View demo →
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteDemo(e, s.id, s.title)}
                    disabled={deletingId === s.id}
                    className="absolute top-4 right-4 inline-flex items-center justify-center rounded border-2 font-semibold transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--slack-avatar-bg)] focus:ring-offset-2 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--slack-btn-bg)',
                      color: 'var(--slack-text)',
                      borderColor: 'var(--slack-btn-secondary-border)',
                      padding: '8px',
                    }}
                    aria-label={`Delete ${s.title}`}
                    title="Delete demo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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
              <button
                type="button"
                onClick={confirmDeleteDemo}
                className="rounded px-4 py-2 border-2 text-sm font-semibold transition hover:opacity-90"
                style={{
                  backgroundColor: 'var(--slack-btn-default-bg)',
                  color: 'var(--slack-btn-default-text)',
                  borderColor: 'var(--slack-btn-default-bg)',
                  height: 44,
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
