# PCF Fixer Benchmark — Multi-Issue Complex PCF

**File pair:**
- Broken: `benchmark-broken.pcf`
- Fixed:  `benchmark-fixed.pcf`
- Pipeline: `BENCH-MULTI-01`

---

## Component Inventory (benchmark-broken.pcf)

| # | Tag | Type | EP1 (E,N,Up) | EP2 (E,N,Up) | Bore | Notes |
|---|-----|------|--------------|--------------|------|-------|
| 1 | PIPE-001 | PIPE | 0,0,0 | 800,0,0 | 150 | Main run start |
| 2 | PIPE-002 | PIPE | **803**,0,0 | 1500,0,0 | 150 | **ISSUE #1** |
| 3 | TEE-001 | TEE | 1500,0,0 | 1800,0,0 + branch(1650,250,0) | 150/80 | Tee junction |
| 4 | PIPE-003 | PIPE | 1800,0,0 | 2400,0,0 | 150 | WLOT-001 on body at E=2100 |
| 5 | FLANGE-001 | FLANGE | 2400,0,0 | 2438,0,0 | 150 | WNRF |
| 6 | FLANGE-002 | FLANGE | **2448**,0,0 | 2486,0,0 | 150 | **ISSUE #2** — no GASKET |
| 7 | PIPE-004 | PIPE | 2486,0,0 | 3000,0,0 | 150 | |
| 8 | VALVE-001 | VALVE | **3018**,0,0 | 3218,0,0 | 150 | **ISSUE #3** |
| 9 | PIPE-005 | PIPE | 3218,0,0 | 3600,0,0 | 150 | |
| 10 | PIPE-006 | PIPE | **3580**,0,0 | 4000,0,0 | 150 | **ISSUE #4** — overlap |
| 11 | PIPE-007 | PIPE | 4000,0,0 | 4500,0,0 | 150 | |
| 12 | PIPE-008 | PIPE | **4540**,0,0 | 5200,0,0 | 150 | **ISSUE #5** |
| 13 | ELBOW-001 | ELBOW | 5200,0,0 | 5425,0,225 | 150 | E→Up, R=225mm |
| 14 | PIPE-009 | PIPE | 5425,0,225 | 5425,0,1200 | 150 | Vertical |
| 15 | PIPE-010 | PIPE | 5425,0,**2200** | 5425,0,3000 | 150 | **ISSUE #6** |
| 16 | ELBOW-002 | ELBOW | **5433,6**,3000 | 5433,231,3225 | 150 | **ISSUE #7** — skewed |
| 17 | PIPE-011 | PIPE | 5433,231,3225 | 5433,1200,3225 | 150 | Running North |
| 18 | PIPE-012 | PIPE | 7000,0,0 | 7600,0,300 | 100 | Sloped 26.6° |
| 19 | PIPE-013 | PIPE | **7613,0,307** | 8200,0,600 | 100 | **ISSUE #8** — sloped gap |
| 20 | PIPE-B01 | PIPE | 1650,250,0 | 1650,750,0 | 80 | Branch from TEE |
| 21 | ELBOW-B01 | ELBOW | 1650,**765**,0 | 1650,885,120 | 80 | **ISSUE #9** — branch gap |
| 22 | PIPE-B02 | PIPE | 1650,885,120 | 1650,885,600 | 80 | Branch vertical |
| 23 | WLOT-001 | WELDOLET | 2100,0,0 | 2100,0,200 | 50 | On PIPE-003 body |
| 24 | PIPE-W01 | PIPE | 2100,0,200 | 2100,0,800 | 50 | Weldolet branch |
| 25 | PIPE-ORF1 | PIPE | 10000,0,0 | 10600,0,0 | 150 | **ISSUE #10** — orphan |
| 26 | PIPE-ORF2 | PIPE | 10600,0,0 | 11000,0,0 | 150 | **ISSUE #10** — orphan |
| 27 | VALVE-ORF | VALVE | 15000,5000,1000 | 15200,5000,1000 | 100 | **ISSUE #11** — orphan |

**Supports:** SUPP-01 @ (400,0,0), SUPP-02 @ (1650,400,0)

---

## Known Issues — Benchmark Matrix

### Issue #1 — Small Gap (0–6mm range) → GapFix Extend EP

| Field | Value |
|-------|-------|
| **Between** | PIPE-001 EP2 → PIPE-002 EP1 |
| **Coordinates** | (800,0,0) → (803,0,0) |
| **Gap distance** | **3 mm** |
| **Gap type** | Standard inline gap |
| **HUD before fix** | `gaps: 1` (SceneHealthHUD dist ≤25mm) |
| **Expected fix** | `fix6mmGaps` extends PIPE-001 EP2 from (800,0,0) → (803,0,0) |
| **HUD after fix** | `gaps: 0` (for this pair) |
| **Data table change** | PIPE-001 row: ep2.x changes 800 → 803 |
| **Export PCF change** | PIPE-001 END-POINT line 2: `800 0 0` → `803 0 0` |

---

### Issue #2 — Missing Gasket (10mm gap between facing flanges)

| Field | Value |
|-------|-------|
| **Between** | FLANGE-001 EP2 → FLANGE-002 EP1 |
| **Coordinates** | (2438,0,0) → (2448,0,0) |
| **Gap distance** | **10 mm** |
| **Gap type** | Missing gasket (two WNRF flanges face-to-face, no GASKET component) |
| **HUD before fix** | `gaps: 1` (dist 10mm ≤25mm) |
| **Expected fix — auto** | `fix25mmGapsWithPipe` inserts a bridge PIPE spool (10mm long) |
| **Expected fix — ideal** | Insert GASKET component: EP1=(2438,0,0), EP2=(2448,0,0), bore=150 |
| **HUD after fix** | `gaps: 0` |
| **Data table change** | New row inserted between FLANGE-001 and FLANGE-002; row count +1 |
| **Export PCF change** | New component (GASKET or PIPE bridge) appears between flanges |

---

### Issue #3 — Medium Gap (6–25mm range) → GapFix Bridge Spool

| Field | Value |
|-------|-------|
| **Between** | PIPE-004 EP2 → VALVE-001 EP1 |
| **Coordinates** | (3000,0,0) → (3018,0,0) |
| **Gap distance** | **18 mm** |
| **Gap type** | Pipe-to-valve gap (missing spool) |
| **HUD before fix** | `gaps: 1` |
| **Expected fix** | `fix25mmGapsWithPipe` inserts bridge PIPE: EP1=(3000,0,0), EP2=(3018,0,0), bore=150 |
| **HUD after fix** | `gaps: 0` |
| **Data table change** | New PIPE row (18mm spool) inserted before VALVE-001; row count +1 |
| **Export PCF change** | New PIPE (tag `BENCH-MULTI-01_3DTopoBridge_25mmfix`) between PIPE-004 and VALVE-001 |

---

### Issue #4 — Pipe Overlap (-20mm)

| Field | Value |
|-------|-------|
| **Between** | PIPE-005 EP2 → PIPE-006 EP1 |
| **Coordinates** | (3600,0,0) → (3580,0,0) |
| **Euclidean distance** | 20 mm (but PIPE-006 starts *inside* PIPE-005 on X-axis) |
| **Gap type** | Overlap — PIPE-006 EP1 (E=3580) is 20mm behind PIPE-005 EP2 (E=3600) |
| **HUD before fix** | `gaps: 1` (HUD sees 20mm Euclidean dist ≤25mm, cannot distinguish overlap) |
| **Expected fix** | Manual: trim PIPE-005 EP2 from E=3600 → E=3580 (match PIPE-006 EP1) |
| **What auto-fix does (wrong)** | `fix25mmGapsWithPipe` would insert a 20mm bridge spool — INCORRECT for overlap |
| **Correct fix action** | DELETE the overlapping 20mm section: set PIPE-005 EP2 = (3580,0,0) |
| **HUD after correct fix** | `gaps: 0`, `disconnected: 0` |
| **Data table change** | PIPE-005 row: ep2.x changes 3600 → 3580 |

---

### Issue #5 — Large Gap (>25mm, Disconnected) — 40mm

| Field | Value |
|-------|-------|
| **Between** | PIPE-007 EP2 → PIPE-008 EP1 |
| **Coordinates** | (4500,0,0) → (4540,0,0) |
| **Gap distance** | **40 mm** |
| **Gap type** | Disconnected (>25mm threshold) |
| **HUD before fix** | `disconnected: 1` |
| **Expected fix** | CONNECT tool: drag EP from (4500,0,0) to (4540,0,0); creates bridge PIPE |
| **HUD after fix** | `disconnected: 0` |
| **Data table change** | New PIPE row appended (CONNECT appends to end, not between rows — see Bug) |
| **Export PCF change** | New PIPE EP1=(4500,0,0), EP2=(4540,0,0) added |
| **Known Bug** | CONNECT appends to END of table, not between rows 11–12; original pair remains disconnected in HUD |

---

### Issue #6 — Very Large Gap (Disconnected) — 1000mm Vertical

| Field | Value |
|-------|-------|
| **Between** | PIPE-009 EP2 → PIPE-010 EP1 |
| **Coordinates** | (5425,0,1200) → (5425,0,2200) |
| **Gap distance** | **1000 mm** |
| **Gap type** | Disconnected — missing 1000mm of vertical riser |
| **HUD before fix** | `disconnected: +1` |
| **Expected fix** | CONNECT or INSERT_SUPPORT/pipe: bridge PIPE (5425,0,1200)→(5425,0,2200), bore=150 |
| **HUD after fix** | `disconnected: 0` (if inserted in correct table position) |
| **Data table change** | New 1000mm PIPE spool inserted; row count +1 |
| **Export PCF change** | New 1000mm PIPE between PIPE-009 and PIPE-010 |

---

### Issue #7 — Skewed Elbow Entry (~10mm offset + lateral)

| Field | Value |
|-------|-------|
| **Between** | PIPE-010 EP2 → ELBOW-002 EP1 |
| **Coordinates** | (5425,0,3000) → (5433,6,3000) |
| **Euclidean distance** | √(8²+6²+0) = **10 mm** + lateral offset (E+8, N+6) |
| **Gap type** | Skew — near gap but not collinear; ELBOW-002 is laterally offset from PIPE-010 axis |
| **HUD before fix** | `gaps: 1` (dist 10mm ≤25mm, but direction change is skewed) |
| **Expected fix** | Snap ELBOW-002 EP1 to (5425,0,3000); recompute CENTER and EP2 accordingly |
| **Corrected ELBOW-002** | EP1=(5425,0,3000), EP2=(5425,225,3225), CENTER=(5425,0,3225) |
| **Corrected PIPE-011** | EP1=(5425,225,3225), EP2=(5425,1200,3225) |
| **HUD after fix** | `gaps: 0` |
| **Data table change** | ELBOW-002: ep1 updated; PIPE-011: ep1 updated |

---

### Issue #8 — Gap on Sloped Line (15mm along slope axis)

| Field | Value |
|-------|-------|
| **Between** | PIPE-012 EP2 → PIPE-013 EP1 |
| **Coordinates** | (7600,0,300) → (7613,0,307) |
| **Euclidean distance** | √(13²+0+7²) = √(169+49) = **~14.8 mm ≈ 15mm** |
| **Gap type** | In-line gap on sloped run (26.6° slope, direction=(600,0,300)) |
| **HUD before fix** | `gaps: 1` |
| **Expected fix** | `fix25mmGapsWithPipe` inserts bridge PIPE along slope: EP1=(7600,0,300), EP2=(7613,0,307) |
| **HUD after fix** | `gaps: 0` |
| **Data table change** | New PIPE row inserted between PIPE-012 and PIPE-013 |
| **Note** | Bridge is geometrically correct — gap is along slope direction, not horizontal |

---

### Issue #9 — Gap in Branch (15mm in 80nb branch)

| Field | Value |
|-------|-------|
| **Between** | PIPE-B01 EP2 → ELBOW-B01 EP1 |
| **Coordinates** | (1650,750,0) → (1650,765,0) |
| **Euclidean distance** | **15 mm** |
| **Gap type** | Branch pipe-to-elbow gap (North direction, 80nb) |
| **HUD before fix** | `gaps: +1` |
| **Expected fix** | `fix25mmGapsWithPipe` inserts bridge PIPE: EP1=(1650,750,0), EP2=(1650,765,0), bore=80 |
| **HUD after fix** | `gaps: 0` |
| **Data table change** | New 15mm spool row inserted before ELBOW-B01 |

---

### Issue #10 — Orphan Pipe Cluster (PIPE-ORF1 + PIPE-ORF2)

| Field | Value |
|-------|-------|
| **Components** | PIPE-ORF1 (10000→10600), PIPE-ORF2 (10600→11000) |
| **Location** | Far from main run at E=10000–11000, Y=0, Z=0 |
| **Connection to main** | None |
| **Gap to nearest main run component** | >>1000mm from PIPE-011 EP2 |
| **HUD before fix** | `disconnected: +2` (PIPE-ORF1→PIPE-ORF2 connected to each other but cluster is orphaned) |
| **Expected fix options** | (A) CONNECT to main run if there is a valid route; (B) DELETE both components |
| **HUD after correct fix** | `disconnected: -2` |
| **Data table change** | Remove 2 rows (delete); OR add bridge rows connecting to main run |

---

### Issue #11 — Orphan Single Component (VALVE-ORF)

| Field | Value |
|-------|-------|
| **Component** | VALVE-ORF (15000,5000,1000 → 15200,5000,1000) |
| **Location** | Completely isolated at E=15000, N=5000, Up=1000 |
| **Connection to main** | None — no pipes adjacent |
| **HUD before fix** | `disconnected: +1` |
| **Expected fix options** | (A) DELETE; (B) CONNECT if it belongs to a known route |
| **HUD after correct fix** | `disconnected: -1` |

---

## HUD State Summary

### Before Fix (benchmark-broken.pcf loaded)

| Metric | Expected Count |
|--------|----------------|
| `gaps` (≤25mm) | **6** (Issues #1, #2, #3, #4, #7, #8, #9) |
| `disconnected` (>25mm) | **5** (Issues #5, #6, #10×2, #11) |
| Total issues | **11** |

> Note: Issue #4 (overlap) reads as a `gap` (20mm Euclidean) not an overlap, because the HUD
> uses Euclidean distance only and cannot distinguish overlap direction.
>
> The sequential HUD scan processes rows in table order. TEE branch rows (PIPE-B01, ELBOW-B01,
> PIPE-B02) and sloped rows (PIPE-012, PIPE-013) are scanned as adjacent pairs — gaps #8 and #9
> are detected correctly as long as those rows are sequential in the table.

---

### After Full Fix (benchmark-fixed.pcf loaded)

| Metric | Expected Count |
|--------|----------------|
| `gaps` | **0** |
| `disconnected` | **0** |
| Extra components added | **5 bridge PIPE spools** (BRIDGE-001 to BRIDGE-005) |
| Extra components added | **1 GASKET** (GASKET-001) |
| Components removed | **3 orphans** (PIPE-ORF1, PIPE-ORF2, VALVE-ORF) |
| PIPE-005 EP2 trimmed | 3600 → 3580 (overlap fix) |
| ELBOW-002 EP1 corrected | (5433,6,3000) → (5425,0,3000) |

---

## Bridge Spools Added in Fixed PCF

| Tag | EP1 | EP2 | Bore | Fixes Issue |
|-----|-----|-----|------|-------------|
| BRIDGE-001 | (3000,0,0) | (3018,0,0) | 150 | #3 — valve gap |
| BRIDGE-002 | (4500,0,0) | (4540,0,0) | 150 | #5 — 40mm disconnected |
| BRIDGE-003 | (5425,0,1200) | (5425,0,2200) | 150 | #6 — 1000mm vertical |
| BRIDGE-004 | (7600,0,300) | (7613,0,307) | 100 | #8 — sloped gap |
| BRIDGE-005 | (1650,750,0) | (1650,765,0) | 80 | #9 — branch gap |
| GASKET-001 | (2438,0,0) | (2448,0,0) | 150 | #2 — missing gasket |

---

## Fix Method Map

| Issue | Gap (mm) | HUD class | Auto-fix tool | Manual tool |
|-------|----------|-----------|---------------|-------------|
| #1 | 3 | gap | ✅ `fix6mmGaps` extend EP | — |
| #2 | 10 | gap | ⚠ `fix25mmGapsWithPipe` (bridge, not gasket) | INSERT GASKET |
| #3 | 18 | gap | ✅ `fix25mmGapsWithPipe` bridge spool | — |
| #4 | -20 (overlap) | gap (misclassified) | ❌ Would insert wrong bridge | ✋ Manual trim |
| #5 | 40 | disconnected | ❌ fix25mm out of range | ✅ CONNECT tool |
| #6 | 1000 | disconnected | ❌ fix25mm out of range | ✅ CONNECT tool |
| #7 | 10 + skew | gap | ⚠ fix25mm bridges skew, doesn't realign | ✋ Snap/align |
| #8 | 15 (slope) | gap | ✅ `fix25mmGapsWithPipe` bridge spool | — |
| #9 | 15 (branch) | gap | ✅ `fix25mmGapsWithPipe` bridge spool | — |
| #10 | >>1000 | disconnected | ❌ Cannot auto-fix | ✋ CONNECT / DELETE |
| #11 | >>1000 | disconnected | ❌ Cannot auto-fix | ✋ CONNECT / DELETE |

---

## Component Type Coverage

| Type | Count (broken) | Purpose |
|------|---------------|---------|
| PIPE | 18 | Main run, branches, sloped, orphans |
| ELBOW | 3 | Direction changes (E→Up, Up→N, N→Up) |
| TEE | 1 | Main run split, 150nb/80nb |
| FLANGE | 2 | Flanged joint (no gasket) |
| VALVE | 2 | Gate valve on main run + orphan |
| WELDOLET | 1 | Branch fitting on pipe body |
| SUPPORT | 2 | On main run and branch |
| **Total** | **29** | |

---

## Geometry Notes

### Elbow Geometry (CENTRE-POINT = pipe axis corner intersection)

| Elbow | Turns | Radius | EP1 | CENTER | EP2 |
|-------|-------|--------|-----|--------|-----|
| ELBOW-001 | E → Up | 225mm | (5200,0,0) | (5425,0,0) | (5425,0,225) |
| ELBOW-002 (broken) | Up → N (skewed) | 225mm | (5433,6,3000) | (5433,6,3225) | (5433,231,3225) |
| ELBOW-002 (fixed) | Up → N (aligned) | 225mm | (5425,0,3000) | (5425,0,3225) | (5425,225,3225) |
| ELBOW-B01 | N → Up | 120mm (1.5×80) | (1650,765,0) | (1650,885,0) | (1650,885,120) |

### Sloped Pipe (PIPE-012/013)
- Direction vector: (600, 0, 300) → length = √(360000+90000) = **670.8mm**
- Unit vector: **(0.8944, 0, 0.4472)** (East-Up slope)
- Gap vector: (7613-7600, 0, 307-300) = (13, 0, 7)
- Gap length: √(169+49) = **14.76mm** ≈ 15mm along slope ✓
- Slope angle: arctan(300/600) = **26.57°**

---

## Files
```
C:\Code\200-6\test\
  benchmark-broken.pcf    27 components, 11 issues
  benchmark-fixed.pcf     30 components (5 bridges + 1 gasket added, 3 orphans removed)
  benchmark-report.md     This file
```
