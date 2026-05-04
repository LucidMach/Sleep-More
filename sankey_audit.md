# Sankey Implementation Audit

## Summary

**337 nights** exist in the CSV with valid sleep data. The Sankey claims to show all of them but has **5 distinct bugs** causing missing nights and illogical flows.

---

## Bug 1: `getBucket` Modulo Creates Fake Evening Wake Nodes

**Severity: HIGH — This is the primary source of nonsensical flows**

[getBucket](file:///Users/lucidmach/SleepMore/dashboard/src/components/SleepCharts.jsx#L124-L127) applies `mins % 1440` before bucketing:

```javascript
const getBucket = (mins) => {
  const m = mins % 1440;        // ← BUG: wraps values > 1440 back into 0-1439
  return Math.floor(m / 60);
};
```

But in [dataProcessor.js](file:///Users/lucidmach/SleepMore/dashboard/src/utils/dataProcessor.js#L93-L109), when `sleep_end < sleep_start`, the end gets `+= 1440`:

```javascript
if (s2 < s1) s2 += 1440;   // e.g. sleep 23:50 → wake 10:42 becomes s2 = 2082
```

So when `s2 > 1440`, `getBucket(s2)` wraps it back: `2082 % 1440 = 642 → bucket 10`. This *happens* to be correct for next-morning wakes, but only by coincidence — the raw wake time was already < 1440 before the `+= 1440` was applied, so the modulo undoes it.

**The real problem** is rows where `sleep_end` is legitimately in the late evening (the data has wake times like `23:11`, `23:58`, `19:06`). Since `s2 > s1` in these cases (no wrapping), `getBucket` returns hours 18–23 for the **wake** column. This creates **Wake nodes at 18:00, 19:00, 22:00, 23:00** — which make no logical sense as wake-up times in a Sleep→Wake Sankey.

### Affected nights: **15 rows** with wake bucket ≥ 18:00

| Wake Bucket | Count | Example |
|-------------|-------|---------|
| 18:00 | 2 | `06:32 → 18:53` |
| 19:00 | 3 | `07:04 → 19:06` |
| 22:00 | 1 | `21:03 → 22:26` (83 min nap) |
| 23:00 | 9 | `03:12 → 23:11` (garbage data) |

---

## Bug 2: Self-Loop Flows (source === target)

**Severity: MEDIUM — Crashes or renders invisibly**

3 rows have `sleep_start` and `sleep_end` in the same hour bucket, creating links where `source === target`:

| Date | Start | End | Duration |
|------|-------|-----|----------|
| 2025-08-01 | 23:05 | 23:50 | 45 min |
| 2025-10-03 | 23:10 | 23:53 | 43 min |
| 2026-03-14 | 23:55 | 23:56 | 1 min |

Recharts' Sankey does not support self-referencing links. These either silently disappear or cause rendering glitches.

---

## Bug 3: Garbage Data Rows Pollute the Visualization

**Severity: MEDIUM — Creates impossible flows**

Several rows have obviously corrupted timing data that should be filtered:

| Date | Sleep→Wake | In-Bed | Actual Sleep | Issue |
|------|------------|--------|--------------|-------|
| 2024-12-15 | 03:12→23:11 | **1199 min (20h!)** | 705 min | Clearly wrong end time |
| 2025-12-16 | 02:47→23:58 | **1271 min (21h!)** | 514 min | Clearly wrong end time |
| 2026-03-13 | 01:08→23:55 | **1367 min (23h!)** | 169 min | Clearly wrong end time |
| 2026-03-20 | 00:15→23:52 | **1417 min (24h!)** | 476 min | Clearly wrong end time |
| 2026-03-14 | 23:55→23:56 | **1 min** | 235 min | Nonsensical |

These create flows from Sleep:03 → Wake:23, Sleep:00 → Wake:23, etc. — paths that no human follows.

---

## Bug 4: Evening Bedtimes Create Ambiguous Sleep Nodes

**Severity: LOW — Confusing but rare**

13 rows have `sleep_start ≥ 18:00`, creating Sleep nodes at 20:00, 21:00, 22:00, 23:00. These overlap with Wake nodes from Bug 1, causing visual ambiguity. But more importantly, the Sankey sorting logic sorts Sleep and Wake separately using `(hour - 18 + 24) % 24`, which means an evening Sleep:23 node sits visually near morning Sleep:00 — confusing the flow direction.

---

## Bug 5: Night Count May Be Incorrect Under Aggregation

**Severity: LOW — Currently mitigated**

Line 140 prefers `allDailyData` over `visibleData`:
```javascript
const sourceData = (allDailyData && allDailyData.length > 0) ? allDailyData : visibleData;
```

Since `allDailyData` is always `aggregateData(rawData, 'daily')`, each entry has exactly 1 `sleep_event` — so the count is correct at **337 nights**. But if the timeframe picker ever changes this to weekly/monthly, the aggregation would merge multiple nights into single entries where `sleep_events` is an array of multiple events, and the count/flows would still work since the events are preserved individually. **This is fine for now** but fragile.

---

## Data Distribution

### Sleep (Bedtime) Buckets
```
00:00   17  █████████████████
01:00   36  ████████████████████████████████████
02:00   48  ████████████████████████████████████████████████
03:00   60  ████████████████████████████████████████████████████████████
04:00   52  ████████████████████████████████████████████████████
05:00   42  ██████████████████████████████████████████
06:00   36  ████████████████████████████████████████
07:00   14  ██████████████
08:00   12  ████████████
09:00    2  ██
10:00    2  ██
11:00    2  ██
14:00    1  █
20:00    1  █        ← anomalous
21:00    1  █        ← anomalous
22:00    1  █        ← anomalous
23:00   10  ██████████  ← likely next-day entries
```

### Wake (Wake-up) Buckets
```
02:00    1  █          ← suspicious
03:00    1  █          ← suspicious
04:00    4  ████
05:00    1  █
06:00    9  █████████
07:00   22  ██████████████████████████████
08:00   34  ██████████████████████████████████
09:00   33  █████████████████████████████████
10:00   38  ██████████████████████████████████████
11:00   43  ███████████████████████████████████████████
12:00   42  ██████████████████████████████████████████
13:00   36  ████████████████████████████████████
14:00   29  █████████████████████████████
15:00   17  █████████████████
16:00    8  ████████
17:00    4  ████
18:00    2  ██         ← BUG 1
19:00    3  ███        ← BUG 1
22:00    1  █          ← BUG 1
23:00    9  █████████  ← BUG 1 (garbage data)
```

---

## Recommended Fixes

### 1. Fix `getBucket` — remove `% 1440`
The modulo is unnecessary. `event.start` is always 0–1439. `event.end` can be > 1440, but you should bucket it directly: `Math.floor(event.end / 60)` gives hour 0–23+ which you then `% 24` to get the actual clock hour.

Actually, both values should just use the raw clock hour without wrapping:
```javascript
const getBucket = (mins) => Math.floor(mins / 60) % 24;
```

### 2. Filter garbage data
Add sanity filters in `dataProcessor.js` when constructing `sleep_events`:
```javascript
const inBedDuration = s2 - s1;
if (inBedDuration < 60 || inBedDuration > 900) return; // Skip <1h or >15h in-bed
```

### 3. Guard against self-loops
In the Sankey link construction, skip any link where `source === target`:
```javascript
if (source === target) return; // Skip self-referencing flows
```

### 4. Clamp wake buckets to reasonable range
Wake times should realistically be 4:00–18:00. Any wake bucket outside this is likely data corruption:
```javascript
const wakeHour = getBucket(event.end);
if (wakeHour >= 18 || wakeHour < 2) return; // Skip nonsensical wake times
```

> [!IMPORTANT]
> Fixes 2 and 4 are data quality decisions. Do you want me to implement aggressive filtering (drop the ~20 anomalous nights), or should we keep them but visually separate them (e.g., collapse evening buckets into an "Other" node)?
