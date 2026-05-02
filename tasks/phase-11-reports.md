# Phase 11 — Reports & Analytics (FM/Admin)

**Status:** TODO  
**Estimated Time:** 5–6 days  
**Depends on:** Phase 04  
**Roles:** FM, COMMUNITY_ADMIN only

---

## 1. Screens
1. **Reports Home** — date range picker + report type selector
2. **Complaints Analytics** — charts + KPIs
3. **Visitor Analytics** — charts + heatmap
4. **Maintenance Analytics** — work orders + PPM
5. **Announcements Analytics** — delivery funnel
6. **Export Screen** — CSV download (COMMUNITY_ADMIN only)

---

## 2. Backend Endpoints

| Report | Method | Endpoint | Required Params |
|---|---|---|---|
| Complaints | GET | `/v1/reports/complaints` | `from, to, community_id` |
| Visitors | GET | `/v1/reports/visitors` | `from, to, community_id` |
| Maintenance | GET | `/v1/reports/maintenance` | `from, to, community_id` |
| Announcements | GET | `/v1/reports/announcements` | `from, to, community_id` |
| Export CSV | GET | `/v1/reports/export/:type` | `from, to, community_id` |

**Max date range:** 90 days (validate client-side)  
**Cache:** Results cached 10 min server-side — instant reload

---

## 3. Reports Home / Filter

**File:** `app/(app)/(fm)/reports/index.tsx`

```
┌─────────────────────────────────┐
│  Reports & Analytics            │
├─────────────────────────────────┤
│  Date Range                     │
│  [Today] [7d] [30d] [90d] [Custom] │  ← Presets
│  Jun 1 – Jun 30, 2024           │
├─────────────────────────────────┤
│  ┌──────────────┐ ┌───────────┐ │
│  │ 📊 Complaints│ │ 👥 Visitors│ │
│  └──────────────┘ └───────────┘ │
│  ┌──────────────┐ ┌───────────┐ │
│  │ 🔧 Maintenance│ │ 📢 Announcements│
│  └──────────────┘ └───────────┘ │
│                                 │
│  [↓ Export Data]  (Admin only)  │
└─────────────────────────────────┘
```

---

## 4. Complaints Analytics Screen

```
┌─────────────────────────────────┐
│  Complaints Analytics           │
├─────────────────────────────────┤
│  Total: 47  │ Avg Res: 24h      │
│  SLA Breach: 8.5%               │
├─────────────────────────────────┤
│  Status Breakdown (Donut)       │
│     ○ NEW 12%                   │
│    ○○ IN_PROGRESS 38%           │
│   ○○○ RESOLVED 50%              │
├─────────────────────────────────┤
│  By Category (Horizontal bar)   │
│  Plumbing     ████████ 18       │
│  Electrical   ██████   12       │
│  Security     ████     8        │
├─────────────────────────────────┤
│  Resolution Trend (Line chart)  │
│  ↗ Improving over time          │
└─────────────────────────────────┘
```

**Chart library:** Victory Native XL

```typescript
import { VictoryPie, VictoryBar, VictoryLine } from "victory-native";

// Donut: by_status
// Bar: by_category (top 10)
// Line: resolution_trend (daily)
```

---

## 5. Visitor Analytics Screen

```
Total: 245  │ Approval Rate: 92%
Avg Duration: 45min │ Blocked: 3

Peak Hours Heatmap (24 bars):
Hour 0-23 with booking counts
Tallest bars = peak entry hours

Daily Trend (Line chart)
```

**Peak hours:** 24-element array → `VictoryBar` chart (0–23 hours X-axis)

---

## 6. CSV Export Screen (Admin only)

**File:** `app/(app)/(admin)/reports/export.tsx`

```
┌─────────────────────────────────┐
│  ←  Export Data                 │
├─────────────────────────────────┤
│  Export Type *                  │
│  ● Complaints                   │
│  ○ Visitors                     │
│  ○ Work Orders                  │
│  ○ Amenity Bookings             │
│  ○ Billing Summary              │
│                                 │
│  Date Range * (max 90 days)     │
│  Jun 1 – Jun 30, 2024           │
│                                 │
│  ⚠️ Range > 90 days not allowed │  ← Shown if exceeded
│                                 │
│  [Generate & Download CSV]      │
│  ████████████ Generating...     │
└─────────────────────────────────┘
```

**Download Implementation:**
```typescript
const downloadCsv = async () => {
  const response = await apiClient.get(
    `/v1/reports/export/${exportType}`,
    {
      params: { from, to, community_id: communityId },
      responseType: "blob",
    }
  );

  const blob = new Blob([response.data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const filename = `mynivas-${exportType}-${from}-to-${to}.csv`;

  // On mobile: save to device and share
  const fileUri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, await blob.text());
  await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: filename });
};
```

---

## 7. Acceptance Criteria

| Check | Expected |
|---|---|
| Date range > 90 days | Error shown, export button disabled |
| RESIDENT tries reports | 403 handled, not visible in nav |
| Complaints donut chart | Renders with real data |
| Export complaints CSV | File downloads to device |
| Charts on iOS | Render correctly (Victory Native XL) |
| Charts on Android | Render correctly |
| Loading state | Skeleton shown while fetching |
| Empty data range | "No data for selected period" message |
