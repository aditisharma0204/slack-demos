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

The app is a static SPA: **Heroku builds once on deploy** (`heroku-postbuild` → `npm run build`), then **`npm start`** serves `dist/` with `serve -s` (SPA fallback for `/demo/...` routes).

### One-time setup

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and log in: `heroku login`
2. From this directory (`slack-demos/`), ensure the app is a git repo and you are on the branch you want to deploy (e.g. `main`).
3. Create the app (pick a unique name, or omit the name and Heroku assigns one):

   ```bash
   heroku create your-slack-demos-name
   ```

4. **Important:** So that Vite and TypeScript install on Heroku (they live in `devDependencies`), set:

   ```bash
   heroku config:set NPM_CONFIG_PRODUCTION=false
   ```

   (`app.json` sets this for flows that read it, e.g. some “Deploy to Heroku” setups; setting it on the app avoids failed builds.)

5. Deploy:

   ```bash
   git push heroku main
   ```

   If your default branch is not `main`, use that branch name instead.

6. Open the site: `heroku open`

### After deploy

- Public URL: `https://<your-app-name>.herokuapp.com` (Heroku may show a longer hostname in the dashboard—use the **Web URL** shown there; it is what visitors should open.)
- **Share demo** on the home page copies `https://<that-same-host>/demo/<demo-id>?shared=1`. That is the same behavior as local: recipients do not get **Back** to your full demo list or a **Demos** link in the prototype. No Heroku-only setting is required—the browser’s current origin is used automatically when you share from the deployed site.
- Optional: if your public URL is always a **custom domain** (not the host shown in the address bar at build time), set a build-time config var so copied links use it:

  ```bash
  heroku config:set VITE_SHARE_BASE_URL=https://demos.yourcompany.com
  git push heroku main
  ```

`dist/` stays in `.gitignore`; Heroku always builds a fresh `dist/` on push.

### If the build fails on Heroku

- Confirm `NPM_CONFIG_PRODUCTION=false` (`heroku config:get NPM_CONFIG_PRODUCTION`).
- Check logs: `heroku logs --tail`
- Confirm `engines` in `package.json` matches a [supported Node version](https://devcenter.heroku.com/articles/nodejs-support#supported-runtimes) on your stack.

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
