# Prototype Restructure TODO

## Data Layer (mock-data.ts)
- [ ] Add escalation ticket data for Rep (ticket title, reason, status badge, zendesk link)
- [ ] Add Rep config model (mode, identity, actions — moved from SettingsPage)
- [ ] Keep existing SOP Rules, Topics, Actions, Performance data

## Navigation & Routing (App.tsx + DashboardLayout)
- [ ] Left sidebar: Shopify-style global nav
- [ ] AI Support internal tabs: Communication / Playbook / Performance
- [ ] Remove /agent, /settings routes; Add /integrations route
- [ ] Keep /zendesk route for testing

## Communication Page (replaces ConversationPage)
- [ ] Left panel: Team Lead (top) + "Reps" section with Rep1
- [ ] Team Lead: existing topic-based conversation
- [ ] Rep1: escalation cards (title + reason + status + Open in Zendesk)
- [ ] Rep1 badge: red dot with count of needs_attention items
- [ ] Statuses: needs_attention / in_progress / resolved (silent)
- [ ] Rep header: Configure button → right panel switches to config
- [ ] Yellow banner (top, non-dismissible): integration setup needed
- [ ] Welcome dialog (first visit): brief intro + Get Started
- [ ] Team Lead first msg: Playbook (upload doc / try demo with sales return)
- [ ] NO "type manually" or "skip" options

## Rep Config Panel
- [ ] Mode / Identity / Actions+Guardrails
- [ ] Triggered by Configure button on Rep header

## Integrations Page
- [ ] Zendesk card: Seel Sidebar App (Connected) + AI Support Access (Setup needed)
- [ ] AI Support Access: checklist with help doc links
- [ ] Other platforms: Coming Soon + Talk to us

## Playbook Page
- [ ] Keep: SOP Rules + Knowledge + Conflicts only

## Cleanup
- [ ] Delete SettingsPage.tsx, AgentPage.tsx
- [ ] Remove obsolete routes
- [ ] 0 TS errors
