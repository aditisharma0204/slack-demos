import type { StepTypeDefinition } from '@/types'

export const userMessageStepType: StepTypeDefinition = {
  id: 'user_message',
  name: 'User Sends Message',
  description: 'User types a message or slash command',
  whenToUse: 'Use when an employee or manager types something',
  fields: [
    {
      id: 'text',
      type: 'text',
      label: 'What does the user say?',
      required: true,
    },
    {
      id: 'isSlashCommand',
      type: 'dropdown',
      label: 'Is it a slash command?',
      options: [
        { value: 'false', label: 'No' },
        { value: 'true', label: 'Yes' },
      ],
      default: 'false',
    },
    {
      id: 'personaId',
      type: 'personaPicker',
      label: 'Who sends?',
      required: false,
    },
  ],
  validAfter: undefined,
}
