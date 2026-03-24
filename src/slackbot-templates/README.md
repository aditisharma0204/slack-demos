# Slackbot Block Kit Templates

This module adds a reusable, versioned template system for Slack Block Kit payloads.

## What is included

- Template registry with versioned definitions (`registry.ts`)
- Variable schema contracts and validation (`types.ts`, `renderTemplate.ts`)
- Runtime renderer for placeholder replacement (`renderTemplate.ts`)
- Action value contract helpers (`actions.ts`)
- First production template: `meeting_conflict@1.0.0`

## Runtime flow

1. Select template by id/version.
2. Validate incoming variables against template schema.
3. Render placeholders (`{{path.to.value}}`) into final `blocks`.
4. Send resulting payload to Slack APIs.

## Example

```ts
import { renderSlackTemplate } from '@/slackbot-templates'

const result = renderSlackTemplate('meeting_conflict', {
  headerText: 'Looks like you have a scheduling conflict with this event:',
  // ... all required variables
})

if (result.ok && result.payload) {
  // chat.postMessage({ channel, ...result.payload })
}
```

## Action contracts

Use the helper when setting `button.value`:

```ts
import { buildTemplateActionValue } from '@/slackbot-templates'

const value = buildTemplateActionValue({
  templateId: 'meeting_conflict',
  actionId: 'choose_time_1',
  optionId: 'today_1630',
  entityId: 'calendar_event_123',
  version: '1.0.0',
})
```

At interaction handling time:

```ts
import { parseTemplateActionValue, validateTemplateAction } from '@/slackbot-templates'

const parsed = parseTemplateActionValue(action.value)
if (!parsed) return
if (!validateTemplateAction(parsed.templateId, parsed.actionId, parsed.version)) return
```
