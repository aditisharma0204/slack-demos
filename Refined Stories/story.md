# Employee Relocation Resolution

**Created by:** Pritesh Chavan

## Overview

Julia Anderson (employee in London) asks Slackbot about relocating to a New York role. Slackbot validates her eligibility and creates a relocation case that Jason (HR BP) claims and orchestrates through a multi-step process including tax analysis, visa coordination, vendor communication, and package approval. Julia accepts her offer; Jason captures knowledge for future cases. Sarah (Julia’s manager) receives a calendar invite for the moving survey.

---

## Personas

| Name | Designation | Role | Type |
|------|-------------|------|------|
| Julia Anderson | Employee | Requests relocation to New York, receives offer and visa instructions | user |
| Jason | HR Business Partner | Manages relocation case in #hr-relocation-leads | user |
| Sarah Chen | Manager | Julia’s manager; receives calendar invite for home survey | user |
| Slackbot | App | Validates eligibility, orchestrates case, drafts communications | app |

---

## Story Steps

1. **Julia opens DM with Slackbot** — Julia navigates to her direct message with Slackbot to start.

2. **Julia sends message** — *"I'm interested in the Senior Manager role in New York. What does the relocation process look like?"*

3. **Slackbot typing indicator** — Brief pause while Slackbot analyzes her profile.

4. **Slackbot replies** — *"Hi Julia! I can help. I've analyzed your profile: you are eligible for the 'Executive Move' package based on your tenure (3 years) and performance rating (Exceeds Expectations). Would you like me to start an application for you?"* [ Yes, start my application ] [ Tell me more about the package ]

5. **Julia clicks** — [ Yes, start my application ]

6. **Slackbot replies** — *"Perfect! I've created Case #9912 and notified the HR relocation team. You'll hear from them within 1 business day. In the meantime, here's what to expect..."* (Slackbot displays a brief timeline card showing 12-week estimated process.)

7. **Switch to Jason's view** — The story moves to the channel #hr-relocation-leads.

8. **Slackbot posts in #hr-relocation-leads** — New Relocation Request: Case #9912. Employee: Julia Anderson. Route: London (LHR) → New York (JFK). Tier: Executive Move. AI Assessment: eligibility met, preliminary budget $45,000, performance Exceeds Expectations; flagged: cross-border tax nexus & L-1 visa required. [ Claim Case ] [ View Full Assessment ]

9. **Jason clicks** — [ Claim Case ]

10. **Slackbot replies in thread** — *"Jason, I've initialized the London → New York Executive Relocation paved path. Here's your current checklist:"* 12-Step Relocation Service Plan with items 1–3 completed, 4–5 with actions [ Review Tax Alert ] [ Notify Moving Co ], and 6–12 listed.

11. **Jason clicks** — [ Review Tax Alert ]

12. **Slackbot replies in thread** — Tax & Immigration Insight card: Issue — New York state nexus, double-taxation risk; AI recommendation: adjust move date to October 1st, 2026 to minimize tax exposure by £8,200; L-1 eligible, 4–6 weeks. [ Accept October 1st ] [ Keep July 15th ] [ Consult Tax Team ]

13. **Jason clicks** — [ Accept October 1st ]

14. **Slackbot replies in thread** — *"Move date updated to October 1st, 2026. I've recalculated the budget and notified Julia of the timing. Proceeding to vendor coordination..."*

15. **Jason clicks** — [ Notify Moving Co ]

16. **Slackbot typing indicator** — *"Contacting Global Movers via API..."* (short pause.)

17. **Slackbot replies in thread** — *"Global Movers has been notified. They've scheduled a virtual home survey for Julia on Thursday, March 6th at 2pm GMT. Should I add this to Julia's calendar and invite her manager Sarah Chen?"* [ Yes, add to calendars ] [ Change time ]

18. **Jason clicks button** — [ Yes, add to calendars ]

19. **Slackbot replies in thread** — *"Done! Calendar invites sent to Julia and Sarah. Global Movers will email Julia the Zoom link within 24 hours."* Checklist auto-updates: step 5 completed, step 6 [ Generate Housing Quote ].

20. **Switch to Sarah's view** — The story moves to Sarah’s DM with Slackbot.

21. **Slackbot notifies Sarah** — Slackbot sends Sarah a message in DM: a calendar invite has been added for Julia’s relocation home survey (Thursday, March 6th at 2pm GMT) as Julia’s manager.

22. **Switch back to Jason's view** — Return to #hr-relocation-leads thread.

23. **Slackbot replies in thread** — *"I've opened Immigration Case #VISA-NY-882 with our external law firm (Fragomen). I've automatically uploaded Julia's passport copy and employment records from Workday. Next action needed: Julia must complete Form DS-160. Should I send her the link with instructions?"* [ Send instructions to Julia ] [ Wait for lawyer review ]

24. **Jason clicks** — [ Send instructions to Julia ]

25. **Switch to Julia's view** — The story moves to Julia’s DM with Slackbot.

26. **Slackbot sends Julia** — Next Step: L-1 Visa Application. Instructions: complete Form DS-160, upload passport photo if needed. Timeline 4–6 weeks; target move date October 1st, 2026. Julia can react with 👍 to this message (as in Slack).

27. **Julia reacts with 👍** — Julia adds a thumbs-up reaction to Slackbot’s message (same as in Slack).

28. **Switch back to Jason's view** — Return to #hr-relocation-leads thread.

29. **Slackbot replies in thread** — *"Julia has acknowledged the visa instructions. Moving forward with Steps 6–8..."* (Brief loading, then:) Steps 6–8 completed (temporary housing, COLA, lump sum). *"Jason, I've drafted Julia's full relocation package. Ready for your review and approval."* [ Review Offer Package ]

30. **Jason clicks** — [ Review Offer Package ]

31. **Modal opens** — Review Relocation Offer: Julia Anderson. Case #9912, London → New York, Move Date Oct 1, 2026. Compensation & benefits summary; total package $45,000; tax & compliance notes. [ Approve & Send to Julia ] [ Edit Package Details ] [ Cancel ]

32. **Jason submits modal** — [ Approve & Send to Julia ]

33. **Slackbot replies in thread** — *"Offer approved! Sending personalized offer letter to Julia now..."*

34. **Switch to Julia's view** — The story moves to Julia’s DM with Slackbot.

35. **Slackbot sends Julia** — Your New York Relocation Offer is Ready. Role: Senior Manager, Product Marketing; Start Date October 1st, 2026. Package summary (salary, bonus, moving & visa support). View Full Offer Letter; New York Office Guide. [ I Accept This Offer ] [ I Have Questions ]

36. **Julia clicks** — [ I Accept This Offer ]

37. **Slackbot replies** — *"Congratulations, Julia! Your acceptance has been recorded. Jason and your new team in New York have been notified. I'll keep you updated on your visa progress and moving timeline. Welcome to the next chapter!"*

38. **Switch back to Jason's view** — Return to #hr-relocation-leads thread.

39. **Slackbot replies in thread** — *"Julia has accepted her offer! Case #9912 moving to Logistics & Departure Coordination phase."*

40. **Slackbot replies in thread** — Knowledge Nudge: 5th London → New York relocation this month with L-1; visa processing times increased 3 weeks to 4–6 weeks. *"Should I update the knowledge article 'UK to US Visa Processing Times (2026)' to reflect this trend?"* [ Yes, Update Article ] [ Dismiss ]

41. **Jason clicks** — [ Yes, Update Article ]

42. **Slackbot replies in thread** — *"Done! I've updated the article and notified the #hr-immigration-team channel of the change. This will help future cases set more accurate expectations."*

43. **Slackbot replies in thread** — Relocation Trend Alert: London → New York requests up 15% this month vs January; driver: NYC product team expansion. Recommendation: consider "Fast Track LHR-JFK" template. [ Create Template ] [ View Full Report ] [ Dismiss ]

44. **Jason clicks** — [ Dismiss ]

---

## Workspace

- **Workspace name:** Acme Inc
