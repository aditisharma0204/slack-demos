import type { StepTypeDefinition } from '@/types'

export const appMessageStepType: StepTypeDefinition = {
  id: 'app_message',
  name: 'App Sends Message',
  description: 'Bot posts a message with text or Block Kit blocks',
  whenToUse: 'Use when the bot replies with info, buttons, or a form',
  fields: [
    {
      id: 'text',
      type: 'text',
      label: 'Plain text (optional if using blocks)',
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
      label: 'Which app/bot?',
      required: false,
    },
  ],
  validAfter: ['user_message', 'user_action', 'surface', 'modal_submit', 'app_message', 'bot_typing'],
}
