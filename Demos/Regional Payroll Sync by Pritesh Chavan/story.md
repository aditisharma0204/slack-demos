# Regional Payroll Sync

## One-line summary

An automated AI system detects a regional payroll synchronization error after a single employee report, allowing an HR agent to resolve 76 discrepancies simultaneously and issue off-cycle payments through a proactive, cross-system workflow.

## Who is in the story

- **Julia Anderson** — Employee in the London office.
- **Employee Agent** — The AI-driven interface for intake, triage, and background orchestration (Slackbot in this demo).
- **Jason** — HR Fulfiller responsible for resolving cases via the HR Fulfiller Console (represented here as the fulfiller channel in Slack).

## Flow

1. Julia Anderson opens her Slack.
2. **Julia:** She says: "Hey, I just checked my payslip and it looks like I'm missing £2,500. Can you log an incident for me?"
3. The bot parses the message, identifies the "Payroll Discrepancy" intent, and pulls Julia's ID from her profile.
4. **Employee Agent:** The bot creates Case #8842, sets priority to "High," and routes it to the UK Regional queue.
5. Jason logs into the HR Fulfiller Console.
6. **Jason:** He sees Case #8842 assigned to him with the original Slack thread linked for context.
7. **Employee Agent:** The bot performs an automated cross-system audit between Workday and ADP.
8. **Jason:** A "Proactive Assistance" panel surfaces a red alert: "Employee received a 4.5% raise in HRIS on Jan 1st; Payroll system is still processing at the 2023 rate."
9. **Jason:** He clicks "View Mismatch."
10. **Employee Agent:** The bot analyzes incoming tickets across Slack, Email, and Portal from the last 2 hours to find patterns.
11. **Resolution (demo extension):** Jason runs a batch fix and approves an off-cycle payment file so all 76 affected employees (including Julia) are corrected together.
12. **Julia:** Receives a concise DM confirming her case is tied to the regional fix and when to expect the correction.
