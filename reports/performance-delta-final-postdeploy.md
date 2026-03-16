# Performance Delta Final (Postdeploy Home Stability)

Generated: 2026-02-18 20:51:28 -05:00

## Home (9 runs, 7 valid)

- Source runs: `reports/lh-home-prod-home-9runs-stability-v1-r1..r9.json`
- Invalid runs excluded: 2 (`r2`, `r3`)

### Percentiles (clean valid set)

| Metric | p50 | p75 |
|---|---:|---:|
| Performance Score | 71.0 | 71.5 |
| LCP (ms) | 3178 | 3276 |
| CLS | 0.0000 | 0.0016 |
| TBT (ms) | 907 | 1243 |
| Speed Index (ms) | 2977 | 3349 |

### Valid Range (min/max)

| Metric | Min | Max |
|---|---:|---:|
| Score | 56.0 | 73.0 |
| LCP (ms) | 2105 | 4981 |
| TBT (ms) | 722 | 1446 |

## Comparison vs previous 5-run batch (prod-home-after-3p-delay-v3)

Previous median (5 runs):
- Score: 43
- LCP: 6142 ms
- CLS: 0.0000
- TBT: 3681 ms
- Speed Index: 5139 ms

Current stable (9-run p50):
- Score: 71 (`+28`)
- LCP: 3178 ms (`-2964 ms`)
- CLS: 0.0000 (`=`, stable low)
- TBT: 907 ms (`-2774 ms`)
- Speed Index: 2977 ms (`-2162 ms`)

## Notes

- The severe CLS outlier observed earlier (`~0.337`) did not reappear in this 9-run sample.
- LCP target element is now consistently stable and mostly the hero image (`nuestras marcas`).
- One run used promo-bar text as LCP candidate, but it remained within acceptable bounds and did not impact p50 materially.

## Executive Conclusion

Home performance is now materially improved and stable enough for production baseline tracking.
Recommended baseline for future regressions: **p50 from this 9-run set**.
