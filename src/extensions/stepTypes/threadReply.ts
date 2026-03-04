import type { StepTypeDefinition } from '@/types'

export const threadReplyStepType: StepTypeDefinition = {
  id: 'thread_reply',
  name: 'Thread Reply',
  description: 'App or user replies in a thread under a message',
  whenToUse: 'Use when the conversation continues in a thread',
  fields: [
    {
      id: 'actor',
      type: 'dropdown',
      label: 'Who replies?',
      required: true,
      options: [
        { value: 'user', label: 'User' },
        { value: 'app', label: 'App' },
      ],
    },
    {
      id: 'text',
      type: 'text',
      label: 'Reply text',
      required: false,
    },
    {
      id: 'blocks',
      type: 'blockPicker',
      label: 'Block template (optional)',
      required: false,
    },
    {
      id: 'personaId',
      type: 'personaPicker',
      label: 'Persona (if user)',
      required: false,
    },
  ],
  validAfter: ['app_message', 'user_message'],
}
