# Performance Audit (Mobile) - 2026-02-17

## Scope
- `https://naturalbe.com.co/`
- `https://naturalbe.com.co/categoria/suplementos`
- `https://naturalbe.com.co/producto/omega-3-6-9`

## Current (Lighthouse v13, preset `perf`)
- Source files:
  - `reports/lh-home-prod-current.json`
  - `reports/lh-category-prod-current.json`
  - `reports/lh-product-prod-current.json`

| Page | Perf Score | LCP (ms) | CLS | TBT (ms) | Speed Index (ms) |
|---|---:|---:|---:|---:|---:|
| Home | 28 | 7722 | 0.003 | 4194 | 8917 |
| Category | 38 | 5477 | 0.031 | 4256 | 5477 |
| Product | 32 | 8573 | 0.051 | 4696 | 6500 |

## Baseline Used (existing reports in repo)
- Home baseline: average of:
  - `reports/lh-home-mobile-prod-postdeploy-r1.report.json`
  - `reports/lh-home-mobile-prod-postdeploy-r2.report.json`
  - `reports/lh-home-mobile-prod-postdeploy-r3.report.json`
  - `reports/lh-home-mobile-prod-postdeploy-r4.report.json`
  - `reports/lh-home-mobile-prod-postdeploy-r5.report.json`
- Category baseline:
  - `reports/lh-category-mobile.report.json`
- Product baseline:
  - `reports/lh-product-mobile-after3.report.json`

| Page | Perf Score | LCP (ms) | CLS | TBT (ms) | Speed Index (ms) |
|---|---:|---:|---:|---:|---:|
| Home baseline | 67.8 | 3246 | 0.028 | 498 | 8024 |
| Category baseline | 83 | 3444 | 0.025 | 192 | 4929 |
| Product baseline | 61 | 6347 | 0.086 | 288 | 8746 |

## Key Findings
- Main bottleneck is JS execution / main-thread saturation, not layout shift.
- Heavy third-party cost is visible in all pages:
  - `gtag.js` and `gtm.js` with high scripting time.
  - Meta Pixel (`fbevents.js`) contributes additional scripting.
  - UserWay widget contributes on home.
- Product page has the highest main-thread work (`~18.8s` reported in `mainthread-work-breakdown`).

## Recommended Next Actions (priority)
1. Delay non-essential analytics until first interaction (`scroll`, `pointerdown`, `keydown`) and keep one fallback idle timer.
2. Load GTM after consent or after first interaction for non-critical events.
3. Move heavyweight inline logic from HTML into deferred modules; split product-page JS by feature.
4. Keep UserWay strictly lazy (already deferred) and block loading on fast bounces.
5. Re-run 3x per URL and compare medians, not single runs.

## Notes
- INP is field metric and may not be stable in lab JSON.
- Some local Lighthouse runs in this environment showed `EPERM` on temp cleanup; production JSON outputs were still generated and used above.
