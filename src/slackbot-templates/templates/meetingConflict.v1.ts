import type { SlackBlockTemplateDefinition } from '@/slackbot-templates/types'

export const meetingConflictV1Template: SlackBlockTemplateDefinition = {
  id: 'meeting_conflict',
  version: '1.0.0',
  name: 'Meeting conflict resolution',
  description:
    'Slack-first scheduling conflict card with AI-proposed alternatives and in-flow choice actions.',
  persona: 'supervisor',
  storyTags: ['calendar_conflict', 'ai_recommendation', 'in_flow_actionability'],
  channel: 'slack',
  variables: [
    { path: 'headerText', type: 'string', required: true, description: 'Top alert sentence.' },
    { path: 'eventTitle', type: 'string', required: true, description: 'Main event title.' },
    { path: 'eventWindow', type: 'string', required: true, description: 'Date/time range text.' },
    { path: 'eventLocation', type: 'string', required: true, description: 'Location label.' },
    { path: 'guestCountLabel', type: 'string', required: true, description: 'Guest count text.' },
    { path: 'conflictLabel', type: 'string', required: true, description: 'Conflict reason text.' },
    { path: 'proposalLabel', type: 'string', required: true, description: 'New time section label.' },
    { path: 'moreTimesLabel', type: 'string', required: true, description: 'Show more times link text.' },
    { path: 'eventUrl', type: 'string', required: true, description: 'URL for event deep link.' },
    { path: 'moreTimesUrl', type: 'string', required: true, description: 'URL for full options.' },
    { path: 'options.0.id', type: 'string', required: true, description: 'Option 1 ID.' },
    { path: 'options.0.timeLabel', type: 'string', required: true, description: 'Option 1 time text.' },
    {
      path: 'options.0.availabilityLabel',
      type: 'string',
      required: true,
      description: 'Option 1 availability text.',
    },
    { path: 'options.1.id', type: 'string', required: true, description: 'Option 2 ID.' },
    { path: 'options.1.timeLabel', type: 'string', required: true, description: 'Option 2 time text.' },
    {
      path: 'options.1.availabilityLabel',
      type: 'string',
      required: true,
      description: 'Option 2 availability text.',
    },
    { path: 'options.2.id', type: 'string', required: true, description: 'Option 3 ID.' },
    { path: 'options.2.timeLabel', type: 'string', required: true, description: 'Option 3 time text.' },
    {
      path: 'options.2.availabilityLabel',
      type: 'string',
      required: true,
      description: 'Option 3 availability text.',
    },
  ],
  actions: [
    { actionId: 'choose_time_1', label: 'Choose option 1', description: 'Accept first proposal.' },
    { actionId: 'choose_time_2', label: 'Choose option 2', description: 'Accept second proposal.' },
    { actionId: 'choose_time_3', label: 'Choose option 3', description: 'Accept third proposal.' },
    { actionId: 'view_more_times', label: 'View more times', description: 'Open detailed planner.' },
  ],
  blocksTemplate: [
    {
      type: 'section',
      text: { type: 'plain_text', emoji: true, text: '{{headerText}}' },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*<{{eventUrl}}|{{eventTitle}}>*\n{{eventWindow}}\n{{eventLocation}}\n{{guestCountLabel}}',
      },
      accessory: {
        type: 'image',
        image_url: 'https://api.slack.com/img/blocks/bkb_template_images/notifications.png',
        alt_text: 'calendar thumbnail',
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'image',
          image_url: 'https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png',
          alt_text: 'notifications warning icon',
        },
        { type: 'mrkdwn', text: '*{{conflictLabel}}*' },
      ],
    },
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: '*{{proposalLabel}}*' } },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*{{options.0.timeLabel}}*\n{{options.0.availabilityLabel}}',
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', emoji: true, text: 'Choose' },
        action_id: 'choose_time_1',
        value: '{{options.0.id}}',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*{{options.1.timeLabel}}*\n{{options.1.availabilityLabel}}',
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', emoji: true, text: 'Choose' },
        action_id: 'choose_time_2',
        value: '{{options.1.id}}',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*{{options.2.timeLabel}}*\n{{options.2.availabilityLabel}}',
      },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', emoji: true, text: 'Choose' },
        action_id: 'choose_time_3',
        value: '{{options.2.id}}',
      },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*<{{moreTimesUrl}}|{{moreTimesLabel}}>*' },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', emoji: true, text: 'Open' },
        action_id: 'view_more_times',
        value: 'open_more_times',
      },
    },
  ],
}
