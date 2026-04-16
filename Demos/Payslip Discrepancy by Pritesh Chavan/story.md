# Payslip Discrepancy (Regional Payroll Sync)

## Story

Julia Anderson (London Office) sends a direct message to the **HR Service Bot** in Slack: *"Hey, I just checked my payslip and it looks like I'm missing £2,500. Can you log an incident for me?"*

An automated AI system detects a **regional payroll synchronization error** after this single employee report. The signal from Julia’s case is correlated with Workday and ADP data for the EMEA GBP pay cycle, revealing a batch sync fault—not an isolated typo.

An **HR payroll agent** uses the same assistant in **#hr-payroll-operations** to run a **batch reconciler**, resolve **76 discrepancies** in one action, and **queue off-cycle payments** through a proactive, cross-system workflow.

## Outcome

- One employee report triggers a scoped investigation.
- The bot explains what it checked and logs a traceable incident for the employee.
- Operations sees a structured case card with impact, root cause, and recommended remediation.
- The agent approves an off-cycle correction file; the employee receives a clear, personal resolution message in DM.

## Personas

| Persona | Role |
|--------|------|
| Julia Anderson | Employee, London — reports missing pay and confirms incident logging |
| Priya Nair | HR Payroll Operations — runs reconciler and approves batch correction |
| HR Service Bot (Slackbot) | Proactive orchestration across HRIS and payroll; concise, trustworthy voice |
