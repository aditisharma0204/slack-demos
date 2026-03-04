import type { StepTypeDefinition } from '@/types'

export const userActionStepType: StepTypeDefinition = {
  id: 'user_action',
  name: 'User Clicks Button',
  description: 'User clicks a button or selects from a menu in a message',
  whenToUse: 'Use when a user interacts with a button or menu from the app',
  fields: [
    {
      id: 'action',
      type: 'text',
      label: 'Which button/action?',
      required: true,
    },
    {
      id: 'trigger',
      type: 'dropdown',
      label: 'Trigger type',
      required: true,
      options: [
        { value: 'button', label: 'Button' },
        { value: 'shortcut', label: 'Shortcut' },
        { value: 'slash_command', label: 'Slash command' },
      ],
    },
    {
      id: 'personaId',
      type: 'personaPicker',
      label: 'Who clicks?',
      required: false,
    },
  ],
  validAfter: ['app_message'],
}
