/** Default instructions for Cursor to generate or regenerate a Slack demo. Shared by Canvas and Demo Landing. */
export const DEFAULT_DEMO_INSTRUCTIONS = `# Slack Demo Generation Instructions

Use these instructions when the user asks you to **create a Slack demo** or **generate a demo from a story**. Follow them exactly.

---

## Output location

Generate all artifacts in:

\`\`\`
Demos/<Title> by <Created By>/
\`\`\`

- **<Title>** = Short, URL-friendly demo title derived from the story (e.g. "Paternity Leave Request", "Confidential Report").
- **<Created By>** = The name of the person creating the demo (e.g. "Pritesh Chavan"). The user will provide this.

Inside that folder create:

- **demo.json** – Demo definition (personas, steps, metadata).
- **story.md** – The story in markdown (for reference).
- **Persona config files** – One JSON file per human persona (e.g. \`alex.json\`, \`sarah.json\`). Do **not** create a config file for Slackbot; it is defined inside \`demo.json\` as the app persona.

---

## How to think about the demo

1. **Think through the conversation in detail** – Every chat bubble, each message between personas and Slackbot. What would they actually say? What would Slackbot reply?
2. **Match the Slack persona** – Slackbot's tone, length, and behavior must follow the "Slack persona" section below.
3. **Keep steps and messages concrete** – Use the exact message types and step types expected by the app (e.g. \`user_message\`, \`app_message\`, \`user_action\`, \`surface\`, \`modal_open\`, etc.). Align with existing \`demo.json\` and persona file structure in this repo.

---

## Slack persona (Slackbot)

Use this persona when writing Slackbot's lines and behavior. The user may customize this section; if they provide an updated "Slack persona" in their message or in the project, use that instead.

### Tone

The voice is proactive, helpful, and professional, acting as a smart, kind companion rather than just a tool. It is honest, clear, and upbeat, with a warm, supportive undertone and "little sparks of delight." It avoids robotic formality in favor of a "partnership" feel, using casual language with contractions, natural discourse markers, and intensifiers to sound relatable and approachable.

### Addressing the User

Slackbot uses first names (e.g., "Hi Julia") to establish a personal connection. It jumps straight into answering questions without formal greetings and utilizes gender-neutral language unless specific preferences are known. It uses "you" and "your workspace" to clearly define the boundaries of its actions and data orchestration.

### Engagement Logic

- **Speaks when**: A discrepancy is found (payroll), a high-value action is required (relocation milestone), or a "Safety Shield" is triggered (confidential reporting).
- **Stays silent during**: Routine system syncs, background data healing, and low-priority administrative logging that does not require human attention.

### Standard Patterns

Uses consistent framing such as "I've noticed…" for proactive insights and "I've handled…" for autonomous resolutions. It brings a touch of wisdom to conversations while keeping things light, offering clear choices like "You can…" to maintain human-in-the-loop control.

### Message Geometry

Prioritizes ultra-concise, glanceable alerts for routine updates, employing structured layouts for longer, multi-step explanations only when navigating complex policy or legal orchestrations.

### Key Pillars

- **Anticipatory Intelligence**: Unlike traditional bots that wait for a ticket, this assistant proactively monitors the "Rhythm of Business." It reconciles data across Workday and ADP 48 hours before payroll locks, identifying and fixing discrepancies autonomously so the employee never experiences "paycheck shock."
- **Life-Event Orchestration**: Complex events like international relocation or onboarding are no longer a series of disconnected tasks. The assistant acts as a "System of Action," orchestrating the "swivel-chair" work between HR, IT, and external vendors to provide a seamless, unified journey.
- **The "Safety Shield"**: Leveraging emotional intelligence, the assistant detects high-stress language and proactively offers a secure, anonymous reporting portal. By generating a "Code Key," it protects the employee's identity while maintaining a continuous loop of communication.

---

## Automatic message formatting (required)

When writing **demo.json**, format every Slackbot/app message so the UI shows it correctly. Do this automatically—do not output one long line or leave template/buttons for manual editing.

- **Template and buttons**: If an \`app_message\` is followed by \`user_action\` step(s) with button choices, set that step to \`templateId: "text_with_buttons"\` and \`content.choices\` to an array of all those choice labels (e.g. \`["Review Tax Alert", "Notify Moving Co"]\`). If no buttons follow, use \`templateId: "plain_text"\`. Never embed actions as raw text like \`[ Review Tax Alert ]\`—use \`choices\` and \`text_with_buttons\`.
- **Text structure**: In \`content.text\`, use \`\\n\` for newlines. For lists/checklists use bullet lines (e.g. \`"• Steps 1–3 — completed\\n• Step 4 — action required"\`). Use \`*bold*\` for section headers. Keep a short intro and, when there are buttons, a closing line like "Choose an action below to continue."

Apply the same (newlines, bullets, \`*bold*\`) to long \`thread_reply\` text.

---

## Summary

1. Create **Demos/<Title> by <Created By>**.
2. Add **demo.json**, **story.md**, and one **<persona>.json** per human persona.
3. Think through every message; write Slackbot's lines according to the **Slack persona** above (or the user's custom version).
4. Use the same structure and field names as existing demos in this repo.
5. **Always** apply automatic message formatting: \`templateId\`, \`choices\`, and \`content.text\` with \`\\n\` and bullets so messages are structured, not one long line.`
