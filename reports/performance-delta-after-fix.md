# Performance Delta After Fix (quick run)

Baseline: reports/lh-summary-prod-now.json (median of 3 runs)
After: single run files prod-after-r1

| Page | Score (after/base/delta) | LCP ms (after/base/delta) | CLS (after/base/delta) | TBT ms (after/base/delta) |
|---|---:|---:|---:|---:|
| category | 55 / 28 / 27 | 3697 / 8423 / -4726 | 0.022 / 0.0219 / 0.0001 | 1984 / 4249 / -2266 |
| product | 42 / 19 / 23 | 9129 / 15454 / -6325 | 0.0512 / 0.3372 / -0.2861 | 1987 / 3168 / -1181 |
| home | 35 / 34 / 1 | 6565 / 5903 / 662 | 0.0287 / 0.0016 / 0.0271 | 1153 / 5063 / -3910 |
