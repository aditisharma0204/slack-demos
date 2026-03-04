import type { StepTypeDefinition } from '@/types'

export const surfaceStepType: StepTypeDefinition = {
  id: 'surface',
  name: 'Switch Surface',
  description: 'Switch to a different channel, DM, or App Home',
  whenToUse: 'Use when the story moves to a different conversation or view',
  fields: [
    {
      id: 'surface',
      type: 'dropdown',
      label: 'Surface',
      required: true,
      options: [
        { value: 'channel', label: 'Channel' },
        { value: 'dm', label: 'Direct Message' },
        { value: 'app_home', label: 'App Home' },
      ],
    },
    {
      id: 'channel',
      type: 'text',
      label: 'Channel name (e.g. #general)',
      required: false,
    },
    {
      id: 'with',
      type: 'text',
      label: 'DM with (e.g. Slackbot, Manager)',
      required: false,
    },
  ],
  validAfter: undefined,
}
