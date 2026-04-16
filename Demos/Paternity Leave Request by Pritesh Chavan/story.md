# Paternity Leave Request

## One-line summary

In **#team-leave**, Sarah asks who's taking leave this month. Alex says he wants leave, then opens Slackbot and applies for paternity leave. The bot collects his dates and sends the request to Sarah. When Sarah approves, Alex gets a confirmation.

## Personas

| Name      | Role     | In the story |
|-----------|----------|--------------|
| Sarah Chen | Manager | Asks in the channel; later approves in Slackbot |
| Alex Kim   | Employee | Replies in the channel; applies via Slackbot |
| Slackbot   | App     | Guides leave collection and routing |

## Steps (in order)

1. **Channel #team-leave** — Sarah asks: "Who's taking leave this month?"
2. **Same channel** — Alex replies: "I'd like to take leave."
3. **Alex opens Slackbot** — Demo shows channel and Slackbot side by side where supported.
4. **DM (Alex + Slackbot)** — Alex: "I want to apply for paternity leave."
5. **Slackbot** — Shares policy and a **Choose dates** button.
6. **Alex** — Clicks **Choose dates**; date picker opens.
7. **Alex** — Selects **March 15–22** and submits.
8. **Sarah's view** — Slackbot: "Alex has requested paternity leave March 15–22. Approve or reject?"
9. **Sarah** — Clicks **Approve**.
10. **Slackbot (to Sarah)** — Confirms Alex has been informed.
11. **Alex's view** — Slackbot: "Your leave has been approved. You're all set for March 15–22!"
