# Phase 3: User Accounts & Complete Frontend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion flow.

**Date:** 2026-04-25
**Phase:** 03-user-accounts-complete-frontend
**Mode:** discuss (default)
**Areas discussed:** Guest access policy, Navigation structure, Generation history layout, Voice presets UX

---

## Area 1: Guest Access Policy

**Question:** Should anonymous visitors be able to generate audio, or is login required for everything?

**Options presented:**
1. Require login for everything — simplest to build, higher friction
2. Allow guest generation, but no history or presets — lower friction, clear upgrade path
3. Guest generation with localStorage temp history — most complex but lowest friction

**User selection:** Require login for everything

**Follow-up:** None needed — clear decision

**Decision captured (D-01):** All features gated behind authentication. No anonymous usage.

---

## Area 2: Navigation Structure

**Question:** How should the app navigation work with multiple pages?

**Options presented:**
1. Top nav bar with page links — collapses to hamburger on mobile
2. Sidebar navigation — collapses to slide-out drawer on mobile
3. Minimal top bar + user menu — keeps tool-focused minimalism

**User concern:** Mobile compatibility of all options

**Clarification provided:** All three options work on mobile (hamburger, drawer, or simple avatar menu respectively).

**User selection:** Top nav bar with page links

**Decision captured (D-06):** Top nav bar with Generate, History, Voices, Account links. Collapses to hamburger on mobile.

---

## Area 3: Generation History Layout

**Question:** How should generation history be displayed?

**Options presented:**
1. Card list with text preview + quick actions — modern and scannable
2. Dense table with sortable columns — good for power users
3. Card grid with mini waveform players — more visual but takes more space

**User selection:** Card list with text preview + quick actions

**Follow-up:** Can users delete history items?

**User selection:** Yes, delete with confirmation

**Decisions captured (D-11, D-13):** Vertical scrollable card list. Each card shows text preview, voice name, date, play/download buttons. Delete with confirmation.

---

## Area 4: Voice Presets UX

**Question:** How should voice presets (save/load speed + emotion combos) work?

**Options presented:**
1. Named presets with Save button + dropdown — explicit and predictable
2. Auto-save last settings per user — simple but no multiple presets
3. Both named presets AND auto-save last used — most flexible

**User selection:** Named presets with Save button + dropdown

**Follow-up:** What should a voice preset include?

**User selection:** Speed + emotion + prosody instruct

**Decisions captured (D-16, D-18):** Named presets with explicit Save button and dropdown loader. Presets persist speed, emotion, and custom prosody instruct text.

---

## Additional Clarifications

### Auth Flow Style
**Question:** Login/register as modal or separate pages?

**User selection:** Separate pages (`/login`, `/register`)

**Decision captured (D-03):** Dedicated auth pages, not modals.

---

## Deferred Ideas

Ideas mentioned or considered but explicitly out of scope for Phase 3:

- OAuth / social login — future enhancement
- Admin dashboard — out of scope for v1
- Public user profiles — Phase 4 territory
- Advanced account settings (avatar, etc.) — can be added later
- Search/filter in history — nice-to-have for later
- Bulk delete in history — single delete sufficient for v1
- Default/app-provided voice presets — only user-saved for now
- Guest/anonymous generation — explicitly rejected

---

## Summary

| Area | Key Decision |
|---|---|
| Guest access | Login required for everything |
| Navigation | Top nav bar (Generate, History, Voices, Account) |
| History layout | Card list with text preview + play/download/delete |
| Voice presets | Named presets saving speed + emotion + prosody |
| Auth flow | Separate `/login` and `/register` pages |

All decisions are concrete and unambiguous. No blocking questions remain.
