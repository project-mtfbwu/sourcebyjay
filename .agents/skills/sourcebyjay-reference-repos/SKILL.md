---
name: sourcebyjay-reference-repos
description: >-
  Reference open-source repos to steal patterns for SourceByJay without changing
  stack. Use when implementing a feature and need prior art for orders, admin,
  chat, search, or marketplace UX.
---

# SourceByJay Reference Repos

**Rule:** Steal schema ideas, workflows, and UI patterns. Implement in **Next.js + Supabase**. Do not migrate to Medusa/Refine as primary stack.

## Workflow

```
1. Identify feature (e.g. quote → order)
2. Open reference below
3. Note tables, status enums, screen flow
4. Implement in our schema + apps
5. Skip their auth/ORM/deployment
```

## By feature

| Feature | Primary reference | Also see |
|---------|-------------------|----------|
| Starter/auth/Supabase | [Nextbase upstream](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) | This repo |
| Order lifecycle, dashboards | [Ruang Usaha Kita](https://github.com/fadd3079-prog/ruangusahakita) | — |
| Marketplace vendor/admin | [Mercur](https://github.com/mercurjs/mercur) | Medusa admin |
| B2B quote/order states | [Medusa B2B](https://docs.medusajs.com/resources/recipes/b2b) | community medusa-marketplace |
| Ops CRUD + RBAC UI | [Refine](https://github.com/refinedev/refine) | Directus roles |
| Chat | [Supabase Realtime demo](https://github.com/supabase/supabase/tree/master/examples/realtime/nextjs-authorization-demo) | — |
| AI / vector search | [nextjs-openai-doc-search](https://github.com/supabase-community/nextjs-openai-doc-search) | Supabase vector guide |
| Seller Central layout | Amazon Seller Central (UX) | Mercur vendor panel |
| Alibaba UX | alibaba.com (layout only) | Figma refs |
| Payments | [Stripe Connect docs](https://stripe.com/docs/connect) | B2B Wholesale OS article |
| Platform commission | [Stripe application fees](https://stripe.com/docs/connect/marketplace/tasks/app-fees) | Mercur vendor admin |

## Same-stack (copy freely)

- Ruang Usaha Kita — Next.js + Supabase
- Supabase official examples
- Nextbase patterns in this repo

## Patterns only (do not adopt stack)

- Mercur, Medusa, Spree, Refine, Directus, Strapi

## License caution

| Repo | License | Note |
|------|---------|------|
| Mercur, Medusa, Refine | MIT/Apache | Safe to learn |
| MOMM market-fe | AGPL v3 | Do not copy code verbatim |

## Phase → reference map

| Phase | Open first |
|-------|------------|
| S0 | SECURITY.md, Supabase RLS docs |
| 1 | Mercur verification, Alibaba supplier UI |
| 2 | Ruang Usaha Kita, Refine, Seller Central, Mercur onboarding |
| 3 | Mercur, Medusa B2B, Stripe application fees |
| 4 | Supabase Realtime demo |
| 5 | Ruang Usaha Kita reviews |
| 6 | nextjs-openai-doc-search |
| 7 | Stripe Connect + application fees |
| 8 | Built app screenshots → Figma |
