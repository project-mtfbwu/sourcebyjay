# Global i18n — Indian + international languages (Phase 12)

**Goal:** India-first multilingual UX **and** international buyer languages — export revenue depends on buyers outside India.

**Stack:** [next-intl](https://github.com/amannn/next-intl) · locale in URL (`/en/`, `/hi/`, `/ar/`) · user preference persisted

Cross-links: [alibaba-parallels.md](../sourcebyjay-architecture/references/alibaba-parallels.md) · Phase 17 Export plan (intl buyer highlight)

---

## Language rollout waves

### Wave 1 — Launch (Phase 12 MVP)

| Locale | Language | Audience |
|--------|----------|----------|
| `en` | English | Default; international |
| `hi` | Hindi | India north / national |
| `en-IN` | English (India) | INR formatting variant |

### Wave 2 — Indian languages (Phase 12.1 or post-launch sprint)

| Locale | Language |
|--------|----------|
| `ta` | Tamil |
| `te` | Telugu |
| `bn` | Bengali |
| `mr` | Marathi |
| `gu` | Gujarati |
| `kn` | Kannada |
| `ml` | Malayalam |
| `pa` | Punjabi |

### Wave 3 — International buyer languages (Phase 12.2)

| Locale | Language | Why |
|--------|----------|-----|
| `ar` | Arabic | MENA buyers |
| `zh-CN` | Chinese (Simplified) | Largest import sourcing |
| `fr` | French | Africa/Europe |
| `es` | Spanish | Americas |
| `pt` | Portuguese | Brazil |
| `de` | German | EU |
| `ja` | Japanese | |
| `ko` | Korean | |
| `tr` | Turkish | |
| `vi` | Vietnamese | |
| `id` | Indonesian | |
| `ru` | Russian | |

---

## What gets translated

| Layer | Approach |
|-------|----------|
| **UI chrome** | Full next-intl message files per locale |
| **Categories / nav** | DB `category_translations` or JSON columns |
| **Product title/description** | Source language + optional vendor-provided translations; MVP: English/Hindi fields on listing form |
| **Legal / Guarantee** | Professional translation for Guarantee terms (hi + en minimum) |
| **Emails / notifications** | Template per locale (Phase 15) |
| **RFQ / chat** | UI translated; message body stays user language (future: optional MT) |

---

## Buyer experience

- Header **language picker** (globe icon) — Alibaba-style
- Auto-detect from `Accept-Language` + geo hint (India → offer Hindi)
- Persist in cookie + `buyers.locale_preference`
- **Currency** tied to locale segment but overridable:
  - India locales → **INR** default
  - International → **USD** default with INR toggle on product

---

## Vendor experience

- Vendor dashboard UI in **English + Hindi** (Wave 1)
- Listing form: primary language + optional translation fields
- **Export plan** vendors flagged for intl buyer discovery (Phase 17)

---

## Schema

```sql
locale_preferences (
  user_id, locale, currency_display, updated_at
)

category_translations (category_id, locale, name, slug?)
product_translations (product_id, locale, title, description)  -- optional Phase 12.1

platform_settings.default_locales[]  -- enabled locale codes
```

---

## Search & SEO

- Localized routes: `/hi/search?q=...`
- `hreflang` tags on product/supplier pages
- Search synonyms per locale in Phase 7 `search_synonyms`

---

## Acceptance criteria (Phase 12)

- [ ] Language switcher on buyer storefront (en + hi minimum)
- [ ] INR/USD display rules per buyer preference
- [ ] Guarantee + checkout legal strings in en + hi
- [ ] At least 3 Indian languages beyond Hindi OR 5 intl languages documented in roadmap for 12.1
- [ ] Export-tier suppliers visible in intl buyer segment (with USD prices)

---

## References

next-intl App Router docs · Medusa regions (patterns) · Alibaba language selector (UX) · India government locale codes (BCP 47)
