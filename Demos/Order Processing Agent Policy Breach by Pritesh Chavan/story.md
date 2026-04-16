# Order Processing Agent — policy breach (Slack demo story)

## Short summary

An IT director sees a critical policy breach on the Order Processing Agent in a DM with **Agentic Mission Control**, opens the in-Slack **Mission Control** tower (split view), reviews remediation options, stops traffic to limit exposure, runs capture and retrain, deploys the fixed agent, then checks the App Home digest to confirm the fleet is healthy again.

## Personas involved

| Persona | Role in the story |
|--------|-------------------|
| **Jordan Rivera** — IT Director (primary operator) | Owns operational risk; reads the alert, chooses remediation, confirms destructive actions, validates resolution. |
| **Agentic Mission Control** (Slack app / bot) | Surfaces governance signals, explains policy context, guides remediation steps, posts status updates. |
| **Order Processing Agent** (production AI workload) | Subject of the incident; traffic is stopped, retrained, and redeployed. |
| **TrustOps / platform team** (implied) | Owns the Mission Control deployment; not named on-screen but sets up tooling. |

## Demo story

1. **Alert arrives** — In a **DM with Agentic Mission Control**, the app posts a **CRITICAL** message: Order Processing Agent is answering off-topic questions at 3 warnings/min, with a **policy breach** reference (domain must stay within assignment).
2. **Director reads impact** — The card shows users exposed/hr, apps affected, revenue impact, and cluster (USW-7) so the decision is framed as operational risk, not only technical detail.
3. **Deep dive** — The director clicks **Open Mission Control**. The **Agentic Mission Control** app opens in the left pane (control tower); the conversation continues on the right.
4. **Investigate via topology** — The director clicks a red dot on the fleet map, which opens the **Agent hubs & coverage** topology view. They click **Agent USW-7** to see the agent list, then click **Investigate** on the Order Processing Agent. The canvas switches to investigation mode and the bot replies with a three-step plan: capture failing interactions as eval cases, retrain against the updated suite, deploy the fixed agent to production.
5. **Limit blast radius** — The director clicks **Stop traffic**. A confirmation appears explaining that requests will halt and reroute to the fallback cluster; they confirm.
6. **Traffic stopped** — The bot confirms 0% traffic to the agent and reroute to fallback — immediate risk reduction.
7. **Fix the model** — The director clicks **Capture & retrain**. The bot shows progress: saving three flagged sessions as eval cases, then retraining with production feedback.
8. **Quality gate** — The bot reports retrain complete with eval pass rate 98.4% (up from 91.2%) and states there are zero policy violations on the test slice.
9. **Go live** — The director clicks **Deploy to production**, confirms, and sees deploying then live with a revision ID on US production.
10. **Closure** — The bot confirms 100% traffic restored, the retrained agent is live, and monitoring continues for new violations; the DM thread remains the audit trail.
11. **Executive-style check** — The director views the **App Home — Fleet digest** in the same DM (conversation reset for digest clarity) with Mission Control still visible in the split layout.
