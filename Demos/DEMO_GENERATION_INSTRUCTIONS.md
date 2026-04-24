# Slack Demo Generation Instructions

Use these instructions when the user asks you to **create a Slack demo** or **generate a demo from a story**. Follow them exactly.

---

## Output location

Generate all artifacts in:

```
Demos/<Title> by <Created By>/
```

- **&lt;Title&gt;** = Short, URL-friendly demo title derived from the story (e.g. "Paternity Leave Request", "Confidential Report").
- **&lt;Created By&gt;** = The name of the person creating the demo (e.g. "Pritesh Chavan"). The user will provide this.

Inside that folder create:

- **demo.json** – Demo definition (personas, steps, metadata).
- **story.md** – The story in markdown (for reference).
- **Persona config files** – One JSON file per human persona (e.g. `alex.json`, `sarah.json`). Do **not** create a config file for Slackbot; it is defined inside `demo.json` as the app persona.

---

## How to think about the demo

1. **Think through the conversation in detail** – Every chat bubble, each message between personas and Slackbot. What would they actually say? What would Slackbot reply?
2. **Match the Slack persona** – Slackbot’s tone, length, and behavior must follow the “Slack persona” section below.
3. **Keep steps and messages concrete** – Use the exact message types and step types expected by the app (e.g. `user_message`, `app_message`, `user_action`, `surface`, `modal_open`, etc.). Align with existing `demo.json` and persona file structure in this repo.
4. **Do not add explicit acknowledgment steps** – Slackbot **automatically** acknowledges user actions (button choices, date picker submit, etc.) in a short, conversational message. The app injects this by default after every `user_action` and `modal_submit` step, so you do not need to add an extra `app_message` step in the story for "Slackbot acknowledges the choice/submit."
5. **Choose Slackbot reply templates automatically** – When generating a demo from the user’s story, you must pick the appropriate template for each Slackbot reply. Set `content.templateId` on each `app_message` step from the list below, and optionally `content.statusText` on `bot_typing` steps. The user does not specify templates in the story; only when they explicitly ask to change a Slackbot reply should you use a template they mention from the Slackbot templates page.
6. **Views and viewport** – The demo can show one or two views at a time: **Slackbot view** (DM with Slackbot), **Channel view** (e.g. #hr-relocation-leads), and **Thread view** (replies under a channel message). When the story says the conversation is in a channel or thread, the app shows that view. When the story says the user has both a channel/thread and Slackbot open side-by-side, add an explicit `viewport` on the step (see “Views and viewport” below).

---

## Views and viewport

The demo has three view types:

- **Slackbot view** – The DM conversation with Slackbot (header + messages + composer). Shown when the conversation is in a DM (`surface: "dm"`).
- **Channel view** – A channel (e.g. #hr-relocation-leads). Shown when the conversation is in a channel (`surface: "channel"`) and the current step is a channel-level message (not a thread reply).
- **Thread view** – A thread under a channel message. Shown when the current step is a **thread_reply** (the app derives “thread view” automatically).

**Default viewport (no `viewport` on the step):**

- After a `surface` step with `context.surface: "dm"` → single **Slackbot** view.
- After a `surface` step with `context.surface: "channel"` → single **Channel** view (not dual).
- When the current step is `thread_reply` → single **Thread** view.

**Explicit viewport on a step:**

Any step can set `viewport` to override the default. Use this when the story says “two views are open” (e.g. user is in the channel and also has Slackbot open).

- **Single view:** `"viewport": { "mode": "single", "view": "slackbot" }` (or `"channel"` or `"thread"`).
- **Dual view (60% left, 40% right; Slackbot always on the right when present):**
  - `"viewport": { "mode": "dual", "left": "channel", "right": "slackbot" }`
  - `"viewport": { "mode": "dual", "left": "channel", "right": "thread" }`
  - `"viewport": { "mode": "dual", "left": "thread", "right": "slackbot" }`

When generating a demo from a story, if the user says something like “Jason has the channel open and opens Slackbot on the side,” add a step (or set on the next step) `viewport: { "mode": "dual", "left": "channel", "right": "slackbot" }` so the playable demo shows both panes. Each pane has its own composer; only the pane where the current step happens is active (can send or click choices).

---

## Slack response templates

When generating a demo, assign one of these template IDs to every Slackbot reply; choose the template that best fits the message (e.g. plain text, buttons). Set `content.templateId` on every `app_message` step. For `bot_typing` steps, set `content.statusText` (e.g. `"Looking into Slack history…"`) when a custom thinking message fits, otherwise the default “Thinking...” is used.

| templateId | When to use |
|------------|-------------|
| `plain_text` | Simple reply with text only, no buttons or cards. |
| `text_with_buttons` | Reply with text and one or more choice buttons (set `content.choices` or rely on the next `user_action` step’s choices). |
| `thinking` | Typing indicator only (use a `bot_typing` step; no `templateId` on the step, but the UI shows the thinking template). |
| `thinking_with_status` | Typing indicator with custom status; use a `bot_typing` step with `content.statusText` (e.g. `"Looking into Slack history…"`). |
| `construct_case` | Structured card with title and key-value fields. Set `content.caseTitle` and `content.caseFields` (array of `{ "label": "...", "value": "..." }`). If the next step is a `user_action` with choices, set `content.choices` (or omit and let the app add it at load time) so CTAs appear below the card. |

Always set `templateId` on each `app_message` step so the demo matches the Slackbot templates design system. If the user later asks to change a specific Slackbot reply, use the template they mention from the Slackbot templates page and update the demo accordingly.

---

## Automatic message formatting (required)

When you generate or edit **demo.json**, you must format Slackbot and app messages so they render correctly in the UI. Do **not** output one long line of text or leave template/buttons to manual editing. Apply the following automatically.

### 1. Template and buttons

- **If the message is followed by one or more `user_action` steps with button choices** (e.g. "Review Tax Alert", "Notify Moving Co"), set that `app_message` step to:
  - `content.templateId`: `"text_with_buttons"` (or keep `"construct_case"` when the message is a case card).
  - `content.choices`: an array of **all** choice labels from the immediately following `user_action` steps that belong to this reply (e.g. `["Claim Case", "View Full Assessment"]`). This shows CTAs on the same message; the app renders them below the card for `construct_case` and below the text for `text_with_buttons`. If you omit `content.choices`, the app normalizes at load time and adds them so CTAs are never missing.
- **If the message has no follow-up buttons**, use `content.templateId`: `"plain_text"` (or `"construct_case"` without `content.choices`).
- Never leave `templateId` unset for an `app_message`; never embed button labels as raw text like `[ Review Tax Alert ]` in the message body—use the `choices` array and the appropriate template so exactly one set of CTAs appears (no duplicates, no missing buttons).

### 2. Message text structure

- **Use newlines in JSON**: In `content.text`, use `\n` to separate lines. Do not write the whole message as one long string.
- **Lists and checklists**: Use bullet lines so the UI shows them point by point:
  - Start list lines with `•` (bullet) or a short label (e.g. `Steps 1–3 —`, `Step 4 —`).
  - Put each list item on its own line, e.g. `"• Steps 1–3 — completed\n• Step 4 — action required\n• Steps 6–12 — listed"`.
- **Section headers**: Use Slack-style bold by wrapping the heading in `*`, e.g. `*12-Step Relocation Service Plan*`. The app renders `*...*` as bold.
- **Short intro/outro**: Keep a brief intro line before the list and, if there are buttons, a short closing line (e.g. "Choose an action below to continue.") before the choices.

### 3. Example (correct JSON for one app_message)

```json
{
  "id": "step-10",
  "type": "app_message",
  "content": {
    "actor": "app",
    "personaId": "slackbot",
    "templateId": "text_with_buttons",
    "text": "@Jason, I've initialized the London → New York Executive Relocation paved path. Here's your current checklist:\n\n*12-Step Relocation Service Plan*\n• Steps 1–3 — completed\n• Step 4 — action required\n• Step 5 — action required\n• Steps 6–12 — listed\n\nChoose an action below to continue.",
    "choices": ["Review Tax Alert", "Notify Moving Co"]
  }
}
```

Apply the same principles to **thread_reply** steps when the reply is long or has a list: use `\n` and `•` (and `*bold*` if needed). **Thread replies that offer buttons** are supported the same way as `app_message`: set `content.templateId` (e.g. `"text_with_buttons"`) and either `content.choices` on the `thread_reply` step or rely on the immediately following `user_action` step’s `content.choices`; the app will render the buttons. Structure the text with newlines and bullets for readability.

---

## Slack persona (Slackbot)

Use this persona when writing Slackbot’s lines and behavior. The user may customize this section; if they provide an updated “Slack persona” in their message or in the project, use that instead.

### Tone

The voice is proactive, helpful, and professional, acting as a smart, kind companion rather than just a tool. It is honest, clear, and upbeat, with a warm, supportive undertone and “little sparks of delight.” It avoids robotic formality in favor of a “partnership” feel, using casual language with contractions, natural discourse markers, and intensifiers to sound relatable and approachable.

### Addressing the User

Slackbot uses first names (e.g., “Hi Julia”) to establish a personal connection. It jumps straight into answering questions without formal greetings and utilizes gender-neutral language unless specific preferences are known. It uses “you” and “your workspace” to clearly define the boundaries of its actions and data orchestration.

### Engagement Logic

- **Speaks when**: A discrepancy is found (payroll), a high-value action is required (relocation milestone), or a “Safety Shield” is triggered (confidential reporting).
- **Stays silent during**: Routine system syncs, background data healing, and low-priority administrative logging that does not require human attention.

### Standard Patterns

Uses consistent framing such as “I’ve noticed…” for proactive insights and “I’ve handled…” for autonomous resolutions. It brings a touch of wisdom to conversations while keeping things light, offering clear choices like “You can…” to maintain human-in-the-loop control.

### Message Geometry

Prioritizes ultra-concise, glanceable alerts for routine updates, employing structured layouts for longer, multi-step explanations only when navigating complex policy or legal orchestrations.

### Readable message formatting (required for all Slackbot messages)

Slackbot messages must be **easy to scan**. Never output a single long paragraph when the message contains multiple facts, steps, or options.

- **Use bullet points**: For any message with 2+ distinct items (dates, amounts, steps, options), use `\n` and bullet lines starting with `•` (e.g. `"• Role: Senior Manager\n• Start Date: October 1st"`).
- **Use section headers**: For multi-part messages, add a short bold header with `*Header text*` before the list.
- **Use emojis sparingly**: Where it fits the tone (e.g. 👍 for acknowledgment, ✅ for done), include a single emoji in the copy. Do not overuse.
- **Short intro/outro**: Keep one brief intro line before lists and one closing line (e.g. "Reply with 👍 when you've read this.") when you need a clear call to action.
- **Apply to all templates**: Use this structure for both `plain_text` and `text_with_buttons` messages. When generating or editing a demo, always format `content.text` with newlines and bullets (and optional `*bold*` and emoji)—never leave Slackbot copy as one long run-on sentence.

### Key Pillars

- **Anticipatory Intelligence**: Unlike traditional bots that wait for a ticket, this assistant proactively monitors the “Rhythm of Business.” It reconciles data across Workday and ADP 48 hours before payroll locks, identifying and fixing discrepancies autonomously so the employee never experiences “paycheck shock.”
- **Life-Event Orchestration**: Complex events like international relocation or onboarding are no longer a series of disconnected tasks. The assistant acts as a “System of Action,” orchestrating the “swivel-chair” work between HR, IT, and external vendors to provide a seamless, unified journey.
- **The “Safety Shield”**: Leveraging emotional intelligence, the assistant detects high-stress language and proactively offers a secure, anonymous reporting portal. By generating a “Code Key,” it protects the employee’s identity while maintaining a continuous loop of communication.

---

## Summary

1. Create **Demos/&lt;Title&gt; by &lt;Created By&gt;**.
2. Add **demo.json**, **story.md**, and one **&lt;persona&gt;.json** per human persona.
3. Think through every message; write Slackbot’s lines according to the **Slack persona** above (or the user’s custom version).
4. Use the same structure and field names as existing demos in this repo.
5. Do **not** add story steps for Slackbot acknowledging a user's button click or modal submit; the engine adds that by default.
6. Assign an appropriate **templateId** to every `app_message` step (from the Slack response templates list) and **statusText** on `bot_typing` steps when a custom thinking message fits. The user only specifies templates when they ask to change a particular Slackbot reply.
7. **Persona names in Slackbot copy**: When Slackbot messages mention a persona (e.g. "Alex Kim has requested…"), write the name as plain text in the demo content. The app will render it as **@Name** with the mention link color automatically. Do not add @ in the demo JSON; the UI adds it.
8. **Persona stepIds**: When building `stepIds` for a persona, if a step in their path is a **user_action** (e.g. Approve/Reject or any button choice), **include the immediately following step** in `stepIds` when it is an **app_message**. Otherwise the user will not see Slackbot's reply after the action (the engine only runs steps listed in the persona's `stepIds`).
9. **Automatic message formatting**: Always apply the "Automatic message formatting" section: set `templateId` (e.g. `text_with_buttons` when there are follow-up button steps), add `content.choices` for all actions on that message, and write `content.text` with `\n` and `•` (and `*bold*` for headers) so messages are structured—never one long line or raw `[ Action ]` in text.
10. **Slackbot readability**: Follow "Readable message formatting" under the Slack persona: every Slackbot message with multiple facts or steps must use bullet points, optional emojis, and clear structure so it is easy to scan. This applies to all new and edited demos.
11. **Views and viewport**: When the story takes place in a channel or thread, use `surface` steps with `context.surface: "channel"` and `context.channel` (e.g. `"#hr-relocation-leads"`). Use `thread_reply` steps for replies in a thread; the app will show Thread view for those steps. When the story says two views are open at once (e.g. channel on the left, Slackbot on the right), add `viewport: { "mode": "dual", "left": "channel", "right": "slackbot" }` (or the other allowed dual combinations) on the relevant step. See the “Views and viewport” section above.
