# Files to restore if the app breaks (blank screen or JSON/validator errors)

If the app shows a **blank screen**, **"invalid JSON at position -1"**, or **"does not provide an export named 'validateModalOpen'"**, one or more of these files may have been emptied or reverted.

## 1. Persona JSON (must be valid JSON, not empty)

- **`Demos/Employee Relocation Resolution by Pritesh Chavan/jason.json`**  
  Must contain: `personaId`, `title`, `description`, `stepIds`, and optional `overrides`. Never leave this file empty.

- **`Demos/Employee Relocation Resolution by Pritesh Chavan/julia.json`**  
  Same structure as above. Never leave this file empty.

**How to restore in Cursor:** Right-click the file in the explorer → **Open Timeline** (or **Local History**) → pick an older version from when the app was working, then restore.

## 2. Modal validator (must export two functions)

- **`src/extensions/validators/modalValidator.ts`**  
  Must export `validateModalOpen` and `validateModalSubmit`. If this file is empty, the app will not load.

**How to restore in Cursor:** Right-click the file → **Open Timeline** → restore a version that contains those two exported functions.

---

## Quick reference: “good” state

- **jason.json** and **julia.json**: See `sarah.json` in the same demo folder for structure; each must have at least `personaId` and `stepIds`.
- **modalValidator.ts**: Must export `validateModalOpen` and `validateModalSubmit` (used by `src/extensions/validators/index.ts`).

After restoring, save the file and refresh the browser (or restart the dev server if needed).
