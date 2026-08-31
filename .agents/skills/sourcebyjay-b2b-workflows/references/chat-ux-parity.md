# Phase 5B — Chat UX parity + seller notifications (post go-live)

**Status:** Planned — **not** in MVP go-live bar (Phases S0–15 + 17).  
**Depends on:** Phase 5 (basic chat — done).  
**When:** After Phase 15 GO-LIVE (before or after Phase 16 Figma — team choice at gate).

---

## Why this phase exists

Phase 5 delivered **working** buyer ↔ seller chat (Supabase Realtime, drawer, inbox).  
Alibaba **Message Center** adds richer UX on the **same backend** — no Stream/Sendbird required for MVP or 5B.

Owner reference: Alibaba Message Center screenshot (multi-thread sidebar, quick questions, product pin, attachments).

---

## Scope (two slices)

### Slice A — Buyer Message Center UX (`apps/web`)

| Feature | Description |
|---------|-------------|
| Multi-conversation sidebar | Left panel: threads, unread badge, search, mute hint |
| Product context bar | Pinned listing above composer (thumbnail, title, MOQ, close) |
| Quick question chips | Prefill/send: price, payment terms, discount, MOQ, sample, logistics, customization |
| Rich composer | Text + **image/file** via Supabase Storage (emoji optional) |
| Floating “Chat now” | Persistent FAB on browse/search pages |
| Unread counts | Per conversation + header badge |
| Full inbox upgrade | `/account/messages` matches sidebar UX |

**Deferred within 5B (optional later):** voice/video call, translate, Trade Agent AI, business-card share.

### Slice B — Seller live app / PWA (`apps/vendor` or new `apps/seller-mobile`)

| Feature | Description |
|---------|-------------|
| PWA or Expo shell | Add-to-home-screen; optional App Store later |
| Push notifications | New message, RFQ, quote accepted, order update |
| Minimal inbox | Tap notification → thread or RFQ detail |
| Deep link | Opens `:3001` routes or in-app WebView |

**Stack default:** PWA + web push (Phase 15 Resend/email as fallback until push wired).

---

## What we do NOT change

| Keep | Reason |
|------|--------|
| `conversations` + `messages` tables | Already RLS-safe |
| Supabase Realtime | Live delivery works |
| No Stream / Sendbird | Unless scale forces revisit (see DECISIONS.md) |

Schema additions (if needed): `message_attachments`, `conversation_muted`, `messages.template_key` for quick questions — via schema-first migration only.

---

## References

| What | Where |
|------|--------|
| Primary UX | Alibaba Message Center (owner screenshot) |
| Technical | [Supabase Realtime demo](https://github.com/supabase/supabase/tree/master/examples/realtime/nextjs-authorization-demo) |
| Storage uploads | Supabase Storage (existing product/media buckets pattern) |
| Push (Slice B) | Web Push API + VAPID; or Expo Notifications if native app |

---

## Acceptance criteria

### Slice A

- [ ] Buyer opens chat from product → sidebar shows all threads + unread count
- [ ] Quick question chip sends a message in one tap
- [ ] Product context bar shows current listing; clearing does not end thread
- [ ] Image upload appears inline in thread
- [ ] Seller still receives on `:3001/messages` (no regression)

### Slice B

- [ ] Seller installs PWA (or opens minimal app)
- [ ] New buyer message triggers push (or email fallback documented)
- [ ] Tap opens correct conversation

---

## Portal routes (planned)

| Portal | Routes |
|--------|--------|
| web | Enhanced drawer + `/account/messages` (sidebar layout) |
| vendor | Existing `/messages` + PWA manifest / service worker |
| ops | No change (dispute read-only optional) |

---

## Process

1. Vomit Protocol scout + Mermaid before code ([SCOUT template](../../sourcebyjay-vomit-protocol/SKILL.md))
2. Owner **APPROVE**
3. Implement Slice A → visual demo → **GO**
4. Implement Slice B → visual demo → **GO**
