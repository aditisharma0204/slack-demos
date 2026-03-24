export const meetingConflictFixture = {
  headerText: 'Looks like you have a scheduling conflict with this event:',
  eventTitle: 'Iris / Zelda 1-1',
  eventWindow: 'Tuesday, January 21 4:00-4:30pm',
  eventLocation: 'Building 2 - Havarti Cheese (3)',
  guestCountLabel: '2 guests',
  conflictLabel: 'Conflicts with Team Huddle: 4:15-4:30pm',
  proposalLabel: 'Propose a new time:',
  moreTimesLabel: 'Show more times',
  eventUrl: 'https://example.com/events/iris-zelda-1-1',
  moreTimesUrl: 'https://example.com/events/iris-zelda-1-1/alternatives',
  options: [
    {
      id: 'today_1630',
      timeLabel: 'Today - 4:30-5pm',
      availabilityLabel: 'Everyone is available: @iris, @zelda',
    },
    {
      id: 'tomorrow_1600',
      timeLabel: 'Tomorrow - 4-4:30pm',
      availabilityLabel: 'Everyone is available: @iris, @zelda',
    },
    {
      id: 'tomorrow_1800',
      timeLabel: 'Tomorrow - 6-6:30pm',
      availabilityLabel: "Some people aren't available: @iris, ~@zelda~",
    },
  ],
}
