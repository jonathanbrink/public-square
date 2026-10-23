# Public Square: product brief and build plan

Planning draft · October 23, 2026

Implementation update: the private-authoring milestone is now implemented in `suggest.html`, with browser-only storage, matching, preview, and draft management. Five storage tests and Chromium desktop/mobile checks pass. Safari, Firefox, assistive-technology testing, and resident research remain outstanding. Before integrating the feature, GitHub main was fetched at `27d371f`; it contains the expanded concern pages and state/city/ZIP map markers described in the handoff. The starting-point observations below refer to the older checkout and are superseded for those two areas. Both sets of work are preserved.

## Product direction

Public Square helps residents turn individual concerns into a clear, useful community agenda.

Proposed first use case: before a neighborhood meeting, a resident discovers relevant concerns, saves personal priorities, and prepares a concern they want discussed. A meeting organizer uses deliberately shared input to prepare an agenda and later records what happened.

This is a working hypothesis. The founder has not yet selected a pilot community, organizer, or meeting. Portland is represented in the sample data; that does not establish it as the launch market.

The first useful outcome is a meeting agenda with concerns people recognize and a follow-up record. Publishing a concern or increasing a counter alone does not demonstrate value.

## Verified starting point

Reviewed local repository `/workspace/public-square`, commit `3d1ccb5`, including README, page scripts, `app.js`, and `priorities.js`. File reads and shell commands work. These are code observations, not a completed browser usability or accessibility audit.

| Area | What exists | Implication |
| --- | --- | --- |
| Designs | V1 in `v1.html`; V2 in `index.html` | Preserve both; use V2 for the proposed new flow and link to it from both designs. |
| Discovery | Eight sample concerns; topic, search, and national/state/city/ZIP filtering; results URL parameters | Enough to test navigation, too little to evaluate real community demand or matching quality. |
| Details | Initially only housing had a dedicated page; fetched main now provides detail content for all eight concerns | Similar-concern links use the matching detail page and preserve a route back to filtered results. |
| My Priorities | Up to 10 selections, browser localStorage, cross-tab updates, temporary fallback when storage fails | Private personal choices already have a useful precedent. |
| Map | Initial checkout had state selection only; fetched main includes city/ZIP drill-down and approximate locator markers | The handoff was accurate for current main; synthetic counts and approximate geographic coverage remain clearly labeled. |
| Contributions | Private drafting is implemented in this milestone; accounts, public submission, and moderation remain future work | Validate the draft experience before introducing public contributions. |
| Implementation | Static pages with inline scripts and repeated catalogs/storage logic; separate JS files also exist | Editing only a standalone JS file will not update these self-contained pages. Identify actual consumers before changing shared code. |

## Pilot scope

Primary participant: a resident preparing for a local community meeting.

Partner: one organizer who can explain how input affects the agenda and who owns follow-up. This partner must be recruited; the product cannot promise an official response without one.

Start with one community and a small set of clearly sourced, locally relevant concerns. Keep national browsing available as a prototype, but evaluate the pilot using local tasks.

For the pilot, a concern is a shared condition affecting a community that can be discussed and followed up. It should describe the problem without requiring agreement on a solution. For example, “Bus service ends before evening shifts finish” is a concern; “Buy more buses” is one possible response.

Route emergencies and individual service requests to the appropriate existing channels. Treat proposals, evidence, and personal perspectives as separate future contributions attached to a concern. Personal allegations need moderation and should not be part of an unmoderated pilot.

## Product rules

1. Saving a personal priority does not cast a public vote.
2. A draft remains personal and never enters shared lists, totals, maps, matching results, or rankings.
3. Browser-only means this browser profile and site origin, not an account or backup. Other users of the same profile may access the data; clearing site data can erase it.
4. Location describes the concern's scope, not the author's residence. Do not request a home address or device location for drafting.
5. Similar concerns are suggestions the author may dismiss. Never automatically merge or discard their draft.
6. All current totals and map percentages remain explicitly illustrative. Public participation later must be described as activity on Public Square, with its measurement period and limitations.
7. Publishing, public support, and private saving are separate actions with separate explanations.
8. A response or resolution needs an identified source and date. An organizer's acknowledgment is not proof that a problem is resolved.

## Next build: Suggest a concern

Flow: open Suggest a concern → describe concern → review possible matches → preview → save private draft. Users may return to edit at any stage. There is no public submission action in this milestone.

### Fields

| Field | Proposed behavior |
| --- | --- |
| Title | Required for a complete preview; 10–120 characters after trimming. Describe one concern. |
| Description | Required for a complete preview; 30–2,000 characters. Explain the condition, who it affects, and why it matters. |
| Topic | One of the existing five topics, plus Other / unsure for authoring. An unusual concern must not be blocked by the taxonomy. |
| Scope | National, state, city, or ZIP. Require the corresponding location fields for a complete preview. |
| Location | State for state scope; state and city for city scope; five-digit ZIP for ZIP scope. Syntax validation does not prove geographic validity. |

Allow saving incomplete drafts with an “Untitled concern” fallback. Distinguish incomplete from ready for preview, so people can preserve work without meeting every requirement. Limits above are initial design choices to validate, not research findings.

### Similar-concern suggestions

Use transparent local matching against the existing public sample catalog: shared meaningful title/description words, topic, and applicable geography. Show up to three plausible matches with a short reason such as “Same topic and city.” Do not require an AI service or display a probability of duplication.

Provide “View concern” and “Keep drafting.” Opening a match must preserve current work or warn about unsaved changes. No-match copy should say “No close matches in this sample catalog,” rather than claiming the concern is unique. Test exact matches, paraphrases, different locations, and no-match cases; record obvious misses.

### Draft lifecycle and storage

- Use a separate versioned key, such as `public-square-drafts-v1`; never add draft IDs to the priority catalog.
- Store an opaque ID, schema version, title, description, topic, location scope/fields, created timestamp, and updated timestamp. Derive readiness from validated fields.
- Provide a private draft list with create, reopen, edit, and delete. Require confirmation or provide undo for deletion.
- Use an explicit Save draft action and a visible unsaved/saved state. Avoid promising automatic saving unless implemented.
- If storage is unavailable or full, retain work in memory and clearly say it will be lost when the page closes. Do not announce successful persistent saving.
- Validate stored records on read. Handle malformed records without crashing or silently overwriting recoverable drafts.
- Detect cross-tab changes before overwriting a draft being edited; let the user reload or save a separate copy.
- Render authored text as text, including in previews and match results. Treat stored content as untrusted.

Recommended persistent-state copy: **Private draft — saved only in this browser. It is not published and does not affect community rankings.** Add a brief explanation about shared browser profiles and clearing site data.

### Completion criteria

- Both home designs can reach the new flow; their existing behavior is preserved.
- A resident can save an incomplete draft, reload, reopen it, finish it, preview it, edit it, and delete it.
- Preview shows title, description, topic, location, and private status without suggesting public submission occurred.
- Field errors are associated with inputs; keyboard navigation and focus work across the flow; status announcements are understandable.
- The flow is usable on a narrow mobile viewport, at increased text size, and without color as the only status indicator.
- Storage errors, malformed saved data, cross-tab conflicts, and authored markup are handled safely.
- Sample counts, map percentages, and My Priorities remain unchanged by draft actions.
- Report browser coverage and any unperformed checks with the implementation.

## Validation before public launch

Recruit 5–8 intended residents with varied familiarity with civic meetings, including mobile users, and one organizer. This is qualitative discovery, not a representative survey. Obtain agreement before recording sessions and avoid collecting unnecessary personal details.

First test current discovery: find a relevant local concern, explain what the counts mean, save it, and explain who can see that choice. Then test drafting: describe a concern, review a similar match, save, and recover the draft after reload.

Record task completion, assistance needed, misunderstandings, the participant's own words, and requested next steps in a small research log. Collect observations manually rather than adding tracking infrastructure for this exercise.

Proposed decision thresholds:

- At least 4 of the first 5 residents finish the core flow without coaching.
- Every tested resident understands that a draft is private and browser-only. Any confusion triggers a copy/flow revision and retest.
- Residents can explain a reason to use it before their next meeting; record actual follow-through when possible.
- The organizer can turn intentionally shared input into an agenda and agrees to record the outcome of each selected concern.

These are learning gates, not launch statistics. If people need service reporting instead, or no organizer can use the output, revisit the use case before adding public voting.

## Phased backlog

| Phase | Work | Evidence required to move on |
| --- | --- | --- |
| 0: establish pilot | Choose community, recruit organizer, define concern examples, baseline current usability | A named use case and organizer commitment; documented current-flow problems. |
| 1: private authoring | Build the specified draft flow; test storage, accessibility, and regressions | Acceptance criteria pass; residents understand privacy and recover their work. |
| 2: meeting experiment | With explicit participant consent, manually collect chosen concerns, prepare one agenda, and record follow-up | An actual meeting uses the agenda; identify useful outcomes and unresolved concerns. |
| 3: moderated public pilot | Add accounts or another justified participation model, shared database, submission review, reporting, retention/deletion, and a response process | Named moderation owner, workable rules, tested access controls, and evidence that the meeting experiment helps. |
| 4: wider participation | Evaluate public support, transparent aggregation, subscriptions, evidence, verified organizational responses | Measurable repeat use and manageable moderation; explain exactly what each count represents. |

Phase 2 can use a manual, consented handoff. Private browser drafts must never be collected automatically. Build an explicit export/share step only if testing shows it is needed.

Defer public leaderboards, automatic merging, social comments, nationwide expansion, AI summarization, and detailed map expansion until their purpose is demonstrated. Do not choose a backend vendor solely to make the static prototype look production-ready.

## Technical sequence

1. Preserve V1 and V2 and document their current behavior. Choose V2 as the proposed authoring style; confirm through user testing.
2. Map actual inline and external script usage. Introduce a small canonical concern catalog with stable IDs for new matching logic; avoid another independent copy. Preserve existing priority IDs and storage keys.
3. Add the draft store and authoring page with clear boundaries from the public sample catalog. GitHub Pages remains sufficient for this phase; no API credentials are needed.
4. Add focused behavioral checks for persistence, validation, storage failure, untrusted content, and separation from shared data. Manually test complete browser flows on desktop/mobile and both designs.
5. Consolidate repeated code incrementally where necessary, preserving existing offline/self-contained behavior where it is a requirement. Avoid a framework migration as a prerequisite for drafting.
6. Before shared submissions, specify server-authoritative permissions, moderation states, recovery/backups, abuse controls, and a data deletion policy. A client-only flag cannot enforce private access on a server.

Future shared submission states: submitted → needs changes / approved / rejected; approved concerns may later be archived. Keep this moderation lifecycle separate from public action progress and from personal draft state.

## Decisions and open questions

| Item | Current position | Status |
| --- | --- | --- |
| First purpose | Prepare and follow up on a local meeting agenda | Proposed hypothesis |
| Pilot location and partner | Founder selects a community where recruitment and organizer access are realistic | Open; needed for real-world validation |
| Next implementation | Private concern drafting, no shared effects | Recommended next milestone |
| Private priority vs public support | Separate actions | Product rule |
| Active design | Use V2 for new authoring; preserve V1 | Proposed implementation default |
| Funding and ownership | Determine who operates the service and pays for ongoing moderation/hosting | Open before sustained public operation |
| Public identity and eligibility | Decide what participation needs verification and what can remain pseudonymous | Open before public support/submissions |
| Public success measure | Useful agenda items followed by documented responses; validate with the partner | Proposed; avoid treating raw vote totals as success |

## Review record

The initial plan was grounded in source inspection; the subsequent implementation is described at the top of this document. Draft-store tests and local Chromium browser checks have been performed, including existing-page regressions, safe preview rendering, cross-tab changes, and storage failures. No environment configuration was changed. Proposed pilot and research choices still require validation with residents and an organizer.
