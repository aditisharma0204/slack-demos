# Slack Demo UI - Icon Specification

Upload icons to this `public/assets` folder. Icons will be served at `/assets/<filename>`. Use the specifications below for consistency with Slack's design guidelines and the reference image.

---

## General Requirements

| Property | Specification |
|----------|---------------|
| **Format** | SVG (preferred) or PNG |
| **Size** | Provide at 24×24px and 20×20px where noted |
| **Color** | Use currentColor where possible so icons inherit text color |
| **Style** | Outline/stroke style, 1.5–2px stroke weight |
| **Viewport** | 24×24 or 20×20 viewBox |

---

## Icons Required

### 1. Workspace / App Icon
| Name | File | Size | Description |
|------|------|------|-------------|
| Workspace logo | `workspace-logo.svg` | 36×36px | Yellow/orange square with purple dot (Slack-style). Used in sidebar header. |

### 2. Top Bar Icons
| Name | File | Size | Description |
|------|------|------|-------------|
| Search | `icon-search.svg` | 20×20px | Magnifying glass. Used in search bar. |
| Help | `icon-help.svg` | 20×20px | Question mark in circle. Used for help button. |

### 3. Sidebar Navigation Icons
| Name | File | Size | Description |
|------|------|------|-------------|
| Home | `icon-home.svg` | 20×20px | House outline. Used for Home nav. |
| Direct messages | `icon-dm.svg` | 20×20px | Speech bubble / chat outline. Used for DMs. |
| Apps | `icon-apps.svg` | 20×20px | Grid of 4 squares (2×2). Used for Apps. |
| Agents | `icon-agents.svg` | 20×20px | Multiple people / team icon. Used for Agents. |
| More | `icon-more.svg` | 20×20px | Three horizontal dots. Used for More. |
| Add / Plus | `icon-plus.svg` | 20×20px | Plus sign. Used for adding channels/DMs. |
| Chevron down | `icon-chevron-down.svg` | 16×16px | Downward-pointing chevron. Used for dropdowns. |

### 4. Message Area Icons
| Name | File | Size | Description |
|------|------|------|-------------|
| Add attachment | `icon-add.svg` | 20×20px | Plus in circle. Used in message input. |
| Format (Aa) | Text | — | Use "Aa" text, not icon. |
| Emoji | `icon-emoji.svg` | 20×20px | Smiley face outline. |
| Mention | Text | — | Use "@" text, not icon. |
| Paperclip | `icon-paperclip.svg` | 20×20px | Paperclip. Used for file attachment. |
| Send | `icon-send.svg` | 20×20px | Paper plane / send arrow. |
| Microphone | `icon-mic.svg` | 20×20px | Microphone. Used for voice message. |

### 5. Channel / Message Icons
| Name | File | Size | Description |
|------|------|------|-------------|
| Hashtag | Text | — | Use "#" character. |
| Thread reply | `icon-thread.svg` | 14×14px | Reply/thread bubble. Used under messages. |
| Pin | `icon-pin.svg` | 16×16px | Pin/pushpin. |
| Bookmark | `icon-bookmark.svg` | 16×16px | Bookmark outline. |

### 6. Slackbot Avatar
| Name | File | Size | Description |
|------|------|------|-------------|
| Slackbot avatar | `slackbot-avatar.svg` | 32×32px, 96×96px | Slack's gradient logo: #e01e5a (red), #ecb22e (yellow), #36a64f (green). Can be a gradient circle with "S" or the Slack hashtag symbol. |

### 7. Demo Navigation (Bottom Bar)
| Name | File | Size | Description |
|------|------|------|-------------|
| Back arrow | `icon-back.svg` | 16×16px | Left-pointing arrow. Used for "← Back". |
| Next arrow | `icon-next.svg` | 16×16px | Right-pointing arrow. Used for "Next →". |

---

## Slack Color Reference (for icons)

| Color | Hex | Usage |
|-------|-----|-------|
| Sidebar purple | #3F0E40 | Sidebar, top bar, footer |
| White | #ffffff | Text on dark backgrounds |
| Muted white | rgba(255,255,255,0.75) | Secondary sidebar text |
| Yellow accent | #ecb22e | Workspace icon |
| Red | #e01e5a | Slackbot gradient, badges |
| Green | #36a64f | Slackbot gradient, online indicator |
| Text dark | #1d1c1d | Primary text on light backgrounds |
| Muted gray | #616061 | Secondary text |

---

## File Naming Convention

- Use lowercase with hyphens: `icon-search.svg`, `icon-home.svg`
- Prefix with `icon-` for generic icons
- Use descriptive names: `slackbot-avatar.svg`, `workspace-logo.svg`

---

## Usage in Code

Icons are referenced from `/assets/` when placed in `public/assets/`:

```tsx
<img src="/assets/icon-search.svg" alt="Search" />
```

---

## Notes

- If an icon is not provided, the app will fall back to inline SVG (current behavior).
- Icons should match Slack's visual style: clean, minimal, consistent stroke weight.
- Reference: [Slack Design](https://slack.design/) and the provided Slack UI reference image.
