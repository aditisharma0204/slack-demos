import type { StepTypeDefinition } from '@/types'

export const modalOpenStepType: StepTypeDefinition = {
  id: 'modal_open',
  name: 'Modal Opens',
  description: 'A modal overlay appears (triggered by user action)',
  whenToUse: 'Use when user clicked something and the app shows a form (e.g. date picker)',
  fields: [
    {
      id: 'view',
      type: 'blockPicker',
      label: 'Modal template',
      required: true,
    },
  ],
  validAfter: ['user_action'],
}
