# Story Building Guide

Build your **story** (the narrative) first; the **demo** (the runnable Slack conversation) is generated from it. This guide shows one full example, why it works, and simple Do's and Don'ts so you get the demo you expect.

---

## What is a “story”?

A **story** is a short, human-readable description of:
- **Who** is in the conversation (personas: e.g. employee, manager, Slackbot)
- **What** happens step by step (user messages, bot replies, buttons, modals, who sees what)

You write the story; the system (or you) turns it into `demo.json` and persona configs so the app can play it back as a Slack-style demo.

---

## Example: Paternity Leave Request

### 1. Overview (one paragraph)

> An employee (Alex) requests paternity leave through Slackbot. The bot explains policy, collects leave dates via a form, and sends the request to his manager (Sarah) for approval. Once Sarah approves, Alex gets confirmation in the same thread.

**Why this helps:** A single overview keeps the demo focused and makes it obvious what “done” looks like.

---

### 2. Personas (who is in the story)

| Name       | Designation | Role                                      | Type  |
|-----------|-------------|-------------------------------------------|-------|
| Alex Kim  | Employee    | Submitting paternity leave request        | user  |
| Sarah Chen| Manager     | Approves leave requests for her team     | user  |
| Slackbot  | App         | Processes leave requests, sends to manager| app   |

**Why this helps:** Every message in the demo is attributed to a persona. Defining them upfront avoids mix-ups (e.g. Slackbot saying something as “Alex”).

---

### 3. Story steps (what happens, in order)

1. **Alex opens DM with Slackbot** — He goes to his direct message with Slackbot to start.
2. **Alex sends a message** — *"I want to apply for paternity leave"*
3. **Slackbot replies with policy** — Explains policy (2 weeks paid, manager approval) and asks him to choose dates; offers a button to open the date picker.
4. **Alex clicks "Choose dates"** — Opens the date picker modal.
5. **Modal opens** — Date picker for leave period.
6. **Alex submits dates** — Selects March 15–22 and submits.
7. **Switch to Sarah’s view** — Sarah’s DM. Slackbot: *"Alex Kim has requested paternity leave from March 15 to March 22. Please approve or reject."*
8. **Sarah approves** — Clicks Approve.
9. **Slackbot confirms to Sarah** — *"I've let Alex know you've approved his leave."*
10. **Switch back to Alex’s view** — Back to Alex’s DM with Slackbot.
11. **Slackbot confirms to Alex** — *"Your paternity leave has been approved by Sarah. You're all set for March 15–22!"*

**Why this helps:**  
- **One thing per step** makes it easy to map each step to a single demo step (`user_message`, `app_message`, `user_action`, `modal_open`, `modal_submit`, `surface`).  
- **Explicit “switch to X’s view”** ensures the right persona sees the right messages (and that persona configs get the right `stepIds`).  
- **Concrete lines** (“I want to apply…”, “Alex Kim has requested…”) become the actual message content in the demo, so the playback matches the story.

---

### 4. What the story becomes in the demo

- **demo.json**: one ordered list of steps (e.g. `surface` → `user_message` → `bot_typing` → `app_message` → `user_action` → `modal_open` → `modal_submit` → `surface` → …).
- **Persona configs** (e.g. `alex.json`, `sarah.json`): for each **user** persona, an ordered list of **step IDs** that persona “sees.”  
  - Alex: steps for his DM (open, his message, bot reply, button click, modal, submit) + switch back + bot confirmation.  
  - Sarah: switch to her DM + bot message + her Approve + bot confirmation to her.

**Why stepIds matter:** The player only runs steps that are in the current persona’s `stepIds`. So the story’s “Switch to Sarah” and “Switch back to Alex” directly drive which steps each persona’s view includes.

---

## Why story-first?

| If you…              | You get… |
|----------------------|----------|
| Write the story first with clear steps and personas | A demo that matches the narrative and shows the right messages to the right person. |
| Skip the story and edit only demo.json / stepIds    | Easy to miss a step, show a message to the wrong persona, or forget Slackbot’s reply after a button click. |

The story is the contract: “this is the conversation we want to show.” The demo is the implementation of that contract.

---

## Do’s and Don’ts

### Do

- **Do** write one clear **overview** sentence or paragraph so the demo has a single goal.
- **Do** list every **persona** (name, role, type: user vs app) before writing steps.
- **Do** write **one action or event per step** (e.g. “Alex sends message” then “Slackbot replies” as two steps).
- **Do** include **explicit “Switch to X’s view”** when the conversation moves from one person’s screen to another.
- **Do** use **exact or near-exact wording** for messages so the generated demo text matches what you expect.
- **Do** think in **conversation order**: first thing said, then reply, then next action, etc.
- **Do** ensure each **user** persona has a **stepIds** list that includes every step they see, and **include the step right after a button/modal submit** when it’s Slackbot’s reply (so the reply is shown).

### Don’t

- **Don’t** add extra steps just for “Slackbot acknowledges the button click” or “Slackbot acknowledges modal submit”—the app adds a short acknowledgment automatically after `user_action` and `modal_submit`.
- **Don’t** mix personas in one step (e.g. “Alex and Sarah both send messages”); split into one step per sender.
- **Don’t** skip the “switch view” steps when the demo moves between people; without them, stepIds and who sees what get out of sync.
- **Don’t** leave message text vague (e.g. “Slackbot says something about policy”); write the actual line so the demo doesn’t need to guess.
- **Don’t** give the **app** persona (Slackbot) its own persona config file; it’s defined in `demo.json` only. Only **user** personas get `<personaId>.json` with `stepIds`.

---

## Quick checklist before you generate the demo

- [ ] Overview is one clear scenario.
- [ ] All personas are listed with name, role, and type (user/app).
- [ ] Steps are in conversation order, one event per step.
- [ ] View switches are explicit when the “camera” moves to another persona.
- [ ] Message text is concrete (what users and Slackbot actually say).
- [ ] No duplicate “Slackbot acknowledges” steps for button/modal submits.
- [ ] Each user persona’s `stepIds` includes every step they see, including the Slackbot reply step right after their button or modal submit.

Using this pattern keeps your story and demo aligned so users see exactly the conversation you designed.
