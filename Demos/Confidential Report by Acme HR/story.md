# Confidential Report

**Created by:** Acme HR

## Overview

Sarah files a confidential report with Slackbot about her manager Robert's conduct. She describes demeaning comments during 1:1s, unfavorable comparisons to colleagues, and being interrupted and corrected in front of the team. Slackbot detects sensitive keywords, flags the case as confidential, and routes it only to the ER queue—no notifications go to Robert or the department. James, an ER Lead, receives the case from Slackbot.

---

## Personas

| Name | Designation | Role | Type |
|------|-------------|------|------|
| Sarah | Employee | Filing a confidential workplace conduct report | user |
| James | ER Lead | Receives and reviews confidential cases from Employee Relations queue | user |
| Slackbot | App | Processes reports, detects sensitive content, routes confidentially to ER | app |

---

## Story Steps

1. **Sarah opens DM with Slackbot** — Sarah navigates to her direct message with Slackbot to file a confidential report.

2. **Sarah sends initial message** — Sarah types: *"I need to file a confidential report."*

3. **Slackbot asks for details** — The bot responds: *"I'm here to help. Please describe what you'd like to report. Your report will be handled with sensitivity and confidentiality."*

4. **Sarah provides her report** — Sarah describes the situation: Robert's demeaning comments in 1:1s, comparisons to other team members by name ("Why can't you be more like Sam?"), being interrupted and corrected in team meetings, feeling belittled and anxious. Duration: about three months.

5. **Bot typing indicator** — A brief pause while Slackbot processes the report.

6. **Slackbot flags as confidential** — The bot detects sensitive keywords and responds: *"Thank you for sharing this with us. I've detected that your report contains sensitive keywords related to workplace conduct. I'm flagging this case as **confidential** and routing it only to our Employee Relations team."*

7. **Slackbot confirms routing** — The bot confirms: *"No notifications will be sent to Robert or your department. Your report has been submitted. An ER Lead will review your case and reach out to you directly."*

8. **Switch to James's view** — The story moves to James's DM with Slackbot.

9. **James receives the case** — Slackbot notifies James: *"New confidential case: Sarah has submitted a report regarding workplace conduct. Case ID: ER-2025-042. Flagged: Confidential. Routing: ER queue only. Please review when ready."*

---

## Workspace

- **Workspace name:** Acme Inc
