import type { SlackBlockTemplateDefinition } from '@/slackbot-templates/types'

export const timeOffApprovalV1Template: SlackBlockTemplateDefinition = {
  id: 'bk_time_off_approval',
  version: '1.0.0',
  name: 'Time off approval',
  description: 'Manager approval card for a paid time-off request.',
  persona: 'supervisor',
  storyTags: ['approval', 'time_off', 'block_kit'],
  channel: 'slack',
  variables: [],
  actions: [
    { actionId: 'approve_request', label: 'Approve', description: 'Approve the time-off request.' },
    { actionId: 'deny_request', label: 'Deny', description: 'Deny the time-off request.' },
  ],
  blocksTemplate: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'You have a new request:\n*<google.com|Fred Enriquez - Time Off request>*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Type:*\nPaid time off\n*When:*\nAug 10-Aug 13\n*Hours:* 16.0 (2 days)\n*Remaining balance:* 32.0 hours (4 days)\n*Comments:* "Family in town, going camping!"',
      },
      accessory: {
        type: 'image',
        image_url: 'https://api.slack.com/img/blocks/bkb_template_images/approvalsNewDevice.png',
        alt_text: 'computer thumbnail',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', emoji: true, text: 'Approve' },
          style: 'primary',
          action_id: 'approve_request',
          value: 'approve_request',
        },
        {
          type: 'button',
          text: { type: 'plain_text', emoji: true, text: 'Deny' },
          style: 'danger',
          action_id: 'deny_request',
          value: 'deny_request',
        },
      ],
    },
  ],
}
