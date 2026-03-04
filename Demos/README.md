# Demos

Each demo lives in its own folder named **`<Title> by <Created By>`**.

## Folder Structure

```
Demos/
├── Paternity Leave Request by John Doe/
│   ├── story.md      # Refined story in Markdown (human-readable)
│   ├── demo.json     # Shared config: personas, steps, workspace
│   ├── alex.json     # Persona-specific config (Alex's prototype)
│   └── sarah.json    # Persona-specific config (Sarah's prototype)
└── ...
```

## Routes

- **`/demo/:storyId`** — Landing page: pick a persona to experience the demo
- **`/demo/:storyId/:personaId`** — Persona-specific prototype (e.g. `/demo/paternity-leave-request-by-john-doe/alex`)

## Persona Files

Only **user** personas get their own prototype. **App** personas (e.g. Slackbot) assist user personas and do not have a separate prototype.

Each persona file (e.g. `alex.json`) contains:

- `personaId` — Matches the persona id in demo.json
- `title` — Display name for the persona card
- `description` — Short description
- `stepIds` — Ordered list of step IDs this persona experiences. **Important:** If a step is a `user_action` (e.g. Approve/Reject), include the next step in `stepIds` when it is an `app_message`, so Slackbot’s reply is shown after the action.
- `overrides` — Optional: introInstructions, channels, dms, workspaceName, theme

## How to Add a New Demo

1. Create a folder: `Demos/<Title> by <Created By>/`
2. Add `story.md` (human-readable story)
3. Add `demo.json` (personas, steps, workspace)
4. Add `<personaId>.json` for each user persona with stepIds and overrides
5. The demo appears on the home page and at `/demo/<id>`
