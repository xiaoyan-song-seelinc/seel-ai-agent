# Gap Fix TODO

- [ ] 1. Rewrite mock-data.ts: SOP Rule model (policy/exceptions/escalation), remove EscalationRule, ApprovalRequest, BadCaseReport, CAPABILITY_SUMMARY
- [ ] 2. Rewrite zendesk-data.ts: remove approval state, simplify to handling/escalated
- [ ] 3. Update ZendeskApp page: remove Approve/Deny UI, only handling + escalated
- [ ] 4. Update PlaybookPage: SOP Rule cards with policy/exceptions/escalation display
- [ ] 5. Update ConversationPage: two-part proposal format, add "modify then accept" button
- [ ] 6. Restore 3-phase conversational Onboarding from 78801dc into Messages Setup tab
- [ ] 7. Update AgentPage: remove independent escalation rules section
- [ ] 8. Clean up residual references to removed types
