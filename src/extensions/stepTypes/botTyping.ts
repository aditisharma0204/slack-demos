import type { StepTypeDefinition } from '@/types'

export const botTypingStepType: StepTypeDefinition = {
  id: 'bot_typing',
  name: 'Bot Typing',
  description: 'Shows typing indicator before bot reply',
  whenToUse: 'Use before a bot reply to show "Thinking" animation',
  fields: [
    {
      id: 'duration',
      type: 'text',
      label: 'Duration in seconds (optional, e.g. 1.5)',
      required: false,
    },
  ],
  validAfter: ['user_message', 'user_action', 'app_message'],
}
