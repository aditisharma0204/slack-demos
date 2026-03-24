import type { SlackBlockTemplateDefinition } from '@/slackbot-templates/types'

export const deviceRequestApprovalV1Template: SlackBlockTemplateDefinition = {
  id: 'bk_device_request_approval',
  version: '1.0.0',
  name: 'Device request approval',
  description: 'Manager approval card for a new device request.',
  persona: 'supervisor',
  storyTags: ['approval', 'device_request', 'block_kit'],
  channel: 'slack',
  variables: [],
  actions: [
    { actionId: 'approve_request', label: 'Approve', description: 'Approve the request.' },
    { actionId: 'deny_request', label: 'Deny', description: 'Deny the request.' },
  ],
  blocksTemplate: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'You have a new request:\n*<fakeLink.toEmployeeProfile.com|Fred Enriquez - New device request>*',
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: '*Type:*\nComputer (laptop)' },
        { type: 'mrkdwn', text: '*When:*\nSubmitted Aut 10' },
        { type: 'mrkdwn', text: '*Last Update:*\nMar 10, 2015 (3 years, 5 months)' },
        { type: 'mrkdwn', text: "*Reason:*\nAll vowel keys aren't working." },
        { type: 'mrkdwn', text: '*Specs:*\n"Cheetah Pro 15" - Fast, really fast"' },
      ],
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
