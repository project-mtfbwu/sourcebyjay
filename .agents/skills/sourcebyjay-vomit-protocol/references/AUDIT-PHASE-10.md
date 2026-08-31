# Phase 10A retrospective vs Alibaba (Owner GO 2026-08-27)

## Shipped (OK)

- On-platform fake pay → escrow **held** (Trade Assurance parallel)
- Invoice per paid order
- Unpaid → cancel; paid → apply for refund → buyer fake credits
- Ops release / return escrow
- Guarantee terms still optional on pay

## Gaps (not blockers for GO)

| Severity | Gap | Notes |
|----------|-----|-------|
| later-ok | **Stripe Connect** real rails | Locked as **Phase 10B** |
| later-ok | Real commission split / Connect payouts | With 10B |
| should-fix | Seller “ship by date” on quote/order UI | Feeds logistics Phase 11 |
| later-ok | GST tax invoice (India) | Phase 12 compliance |
| later-ok | Milestone / deposit payments | Deferred |

## Catch-up decision needed

Reply **SKIP catch-up** (go to Phase 11 proposal) or **CHANGE** / **APPROVE catch-up** if you want Stripe 10B before logistics.
