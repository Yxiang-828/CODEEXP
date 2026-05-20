# Quick Aid SG Fix Report - 2026-05-20

Repo: `CODEEXP`

Production alias: https://quick-aid-sg.vercel.app

Latest production deployment: https://quick-aid-71ejju540-xiangyao888-8041s-projects.vercel.app

## Verification

- `npm run lint` passed.
- `npm run build` passed. Vite still warns that the main JS chunk is large.
- Built preview smoke passed on a 390 x 844 viewport:
  citizen SOS, citizen AI drawer, citizen report, responder accept flow, ops report queue, ops dispatch fit scoring, and activity logs.
- Host AI route smoke passed locally with safe `not_configured` fallback.
- Vercel production deploy completed and aliased to `https://quick-aid-sg.vercel.app`.
- Live alias check returned HTTP 200.
- Live `/api/host/ask` returned `not_configured`, which is correct until `OPENROUTER_API_KEY` is set in Vercel.

## Fixes By Item

1. Mobile header/demo chip overlap: hid the demo role chip on narrow screens, tightened header spacing, and made the tracking pill/action dock mobile-safe.
2. Map label controls: replaced the static legend with clickable filters for disaster, hospital, AED, traffic, MRT, SOS, units, plus a label on/off toggle.
3. Citizen AI missing: added a Citizen AI workspace and bottom-dock AI entry. It calls `/api/host/ask` only when the user asks.
4. Login page: rebuilt the entry screen as a real sign-in page with separate labelled demo account cards for citizen, responder, and ops.
5. Report chain: citizen reports now route to ops only. Ops claim/verify/dismiss creates audit logs, reporter notifications, and only verified incidents publish to responders/citizens. SOS remains visible to both ops and responders.
6. Responder polygons: removed responder verification/drawing paths. Responders can only request ops to form a case around an existing verified incident.
7. Incident guidance: guidance is now incident-type specific. Traffic/crash guidance no longer tells users to walk through water. AI guidance loads only on button click.
8. Status clarity/endpoints: status pipeline now uses visible check icons and horizontal overflow. SOS completion requires responder and citizen acknowledgement before resolution.
9. SOS category + fit metrics: responder join and ops dispatch now show suggested fit percentages and reasons for each responder/mission.
10. Accept/respond flow: responder Accept SOS now assigns the SOS, moves the responder into assignment detail, sets en-route state, and writes logs/notifications.
11. Event unregister/source: volunteer events show who posted them and allow unregistering from a registered event.
12. Confusing hashtags: collapsed responder room rail now uses short labels (`MB`, `GR`, `CS`, `OF`) and removed the duplicate join-group row.
13. Open SOS vs case room: joinable missions now explains the difference, and restricted official cases are monitor-only.
14. Demo roster: added more demo roster entries and labelled SCDF/SPF/SAF professional units as demo/special.
15. Polygon drawing session: ops drawing controls now appear only inside Declare/Broadcast sessions. Undo/clear only affect the current draft.
16. Accountability logs: added role-visible action logs. Ops sees ops/responder logs; responders see responder-visible logs.
17. Notifications: added role-scoped, tiered notifications with acknowledge buttons plus an optional browser permission prompt that clearly says push delivery still needs a backend worker.
18. Professional movements: added demo SCDF/SPF/SAF professional units, official-only restricted cases, and covert/unit labels to reduce volunteer interference.
19. Host AI enabled: added `/api/host/ask` OpenRouter route and wired case/citizen Host AI calls. It does not invent data when provider env is missing.

## Known Configuration State

- Vercel does not currently have `OPENROUTER_API_KEY` configured, so Host AI correctly shows `not_configured` on production.
- I did not commit any `.env*` files or secrets.
