# Slack Prototype System

A React-based system for creating click-through Slack app demos. Build stories step-by-step with a visual builder, define personas, and share prototypes with stakeholders.

## Features

- **Visual Story Builder** — Add steps without writing JSON
- **Step Type Reference** — All step types with descriptions and when to use each
- **Personas** — Define personas (name, designation, role); content auto-generated per persona
- **Click-Through Prototype** — Deploy and navigate with ← → arrow keys or click anywhere
- **Intro Screen** — Prototype name (`Title_by_Created by`), keyboard instructions
- **Extensible** — Add custom step types and validators via `extensions/`

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Heroku

1. Build: `npm run build`
2. Create app: `heroku create your-demo-name`
3. Deploy: `git push heroku main`

The Procfile runs `npm run build` then `npm run start`. Add `dist` to `.gitignore` so Heroku builds fresh.

The app will be available at `https://your-app.herokuapp.com`

## Navigation (Deployed Demo)

- **→ (Right arrow)** or **Click anywhere** — Next step
- **← (Left arrow)** — Previous step

## Adding New Demos (Text-First Workflow)

You don't need to write JSON. Tell the story in plain text, then ask for the demo:

1. **Describe your story** — Title, Created By, personas (name, designation, role, type), and steps (what happens in order).
2. **Ask for the demo** — Point to your story and say: *"This is my story. Get me the demo."*
3. **Output** — The AI creates `Demos/<Title> by <Created By>/` with:
   - `story.md` — Refined story in Markdown
   - `demo.json` — Demo config for the prototype

The demo appears on the home page and at `/demo/<id>`. See `Demos/README.md` for details.

## Project Structure

```
slack-demos/
├── Demos/                    # All demos (story.md + demo.json per folder)
│   └── <Title> by <Created By>/
├── src/
│   ├── components/           # SlackLayout, SlackMessage, MessageView, etc.
│   ├── builder/              # StoryBuilder, PersonaEditor, StepList
│   ├── reference/            # StepTypeReference
│   ├── engine/               # StoryEngine, ContentGenerator
│   ├── extensions/           # stepTypeRegistry, validatorRegistry, stepTypes, validators
│   ├── stories/              # Loads demos from Demos/
│   └── blocks/               # Block Kit JSON templates
└── ...
```

## Adding a Custom Step Type

1. Create `src/extensions/stepTypes/my-type.ts` with a `StepTypeDefinition`
2. Register in `src/extensions/stepTypes/index.ts`

## Adding a Custom Validator

1. Create `src/extensions/validators/my-validator.ts` with a `ValidatorFn`
2. Register in `src/extensions/validators/index.ts`

## Step Types

| Type | Description |
|------|-------------|
| surface | Switch to channel, DM, or App Home |
| user_message | User sends text or slash command |
| app_message | Bot posts message with text or blocks |
| user_action | User clicks button (opens modal) |
| modal_open | Modal appears |
| modal_submit | User submits modal |
| thread_reply | Reply in thread |
| bot_typing | Typing indicator before bot reply |
