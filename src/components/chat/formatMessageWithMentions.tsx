import { Fragment, type ReactNode } from 'react'
import * as emoji from 'node-emoji'

/**
 * Converts Slack-style :shortcode: in text to Unicode emoji.
 */
function emojifyText(text: string): string {
  if (!text) return text
  return emoji.emojify(text)
}

/**
 * Renders Slack-style *bold* segments in text. Single * wraps bold.
 */
function formatBold(segment: ReactNode): ReactNode {
  if (typeof segment !== 'string') return segment
  const parts: ReactNode[] = []
  let key = 0
  const re = /\*([^*]+)\*/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(segment)) !== null) {
    if (m.index > lastIndex) parts.push(<span key={key++}>{segment.slice(lastIndex, m.index)}</span>)
    parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{m[1]}</strong>)
    lastIndex = m.index + m[0].length
  }
  if (lastIndex === 0) return segment
  if (lastIndex < segment.length) parts.push(<span key={key++}>{segment.slice(lastIndex)}</span>)
  return <>{parts}</>
}

/**
 * Formats message text by:
 * 1. Converting :emoji_shortcode: to Unicode emoji
 * 2. Replacing persona names with @Name styled as a mention.
 * 3. Rendering *bold* as <strong> (Slack-style).
 * Persona names are matched longest-first so "Alex Kim" is preferred over "Alex".
 */
export function formatMessageWithMentions(text: string, personaNames: string[]): ReactNode {
  const emojified = emojifyText(text ?? '')
  if (!emojified) return emojified
  if (!personaNames?.length) return formatBold(emojified)
  const sorted = [...personaNames].filter(Boolean).sort((a, b) => b.length - a.length)
  let parts: ReactNode[] = [emojified]
  for (const name of sorted) {
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return [part]
      const segments = part.split(name)
      const result: ReactNode[] = []
      segments.forEach((seg, i) => {
        if (i > 0) {
          result.push(
            <span key={`@${name}-${i}`} style={{ color: 'var(--slack-mention)' }}>
              @{name}
            </span>
          )
        }
        if (seg) result.push(seg)
      })
      return result
    })
  }
  return <>{parts.map((p, i) => <Fragment key={i}>{typeof p === 'string' ? formatBold(p) : p}</Fragment>)}</>
}
