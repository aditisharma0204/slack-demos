import type { StepTypeDefinition } from '@/types'

export const modalSubmitStepType: StepTypeDefinition = {
  id: 'modal_submit',
  name: 'User Submits Modal',
  description: 'User completes and submits the modal form',
  whenToUse: 'Use when user fills the modal and clicks Submit',
  fields: [
    {
      id: 'values',
      type: 'text',
      label: 'Submitted values (e.g. start: 2025-03-15, end: 2025-03-22)',
      required: false,
    },
  ],
  validAfter: ['modal_open'],
}
