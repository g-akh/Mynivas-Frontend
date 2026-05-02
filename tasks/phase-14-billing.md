# Phase 14 — Billing & Dues

**Status:** DONE  
**Estimated Time:** 4–5 days  
**Depends on:** Phase 03  

---

## 1. Screens
1. **Resident: My Dues** — outstanding + paid history
2. **Resident: Due Detail** — single ledger entry
3. **FM: Collection Dashboard** — collection rate + overdue
4. **FM: Unit Ledger** — all dues for a unit
5. **FM: Record Payment** — manually record a payment

---

## 2. Backend Endpoints

| Action | Method | Endpoint |
|---|---|---|
| Get billing dashboard | GET | `/v1/billing/dashboard?month=YYYY-MM` |
| List dues | GET | `/v1/billing/dues` |
| Unit ledger | GET | `/v1/billing/dues/:unitId` |
| Record payment | POST | `/v1/billing/payments` |
| List payments | GET | `/v1/billing/payments` |
| Get receipt | GET | `/v1/billing/receipts/:id` |
| Download receipt PDF | GET | `/v1/billing/receipts/:id/pdf` |
| Billing analytics | GET | `/v1/reports/billing?from=&to=&community_id=` |

---

## 3. Resident Dues Screen

**File:** `app/(app)/(resident)/billing/index.tsx`

```
┌─────────────────────────────────┐
│  My Dues                        │
├─────────────────────────────────┤
│  Outstanding Balance            │
│  ┌──────────────────────────┐   │
│  │       ₹8,500             │   │  ← Big amount display
│  │   2 pending dues         │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  [PENDING] Maintenance — Jun 24 │
│  ₹4,500           Due: Jun 30   │
│  ──────────────────────────     │
│  [OVERDUE] Maintenance — May 24 │
│  ₹4,000    🔴 Overdue since May 31│
├─────────────────────────────────┤
│  ─── Payment History ───        │
│  [PAID] Apr 2024  ₹4,500        │
│  Receipt: RCPT-202404-00023 [↓] │
│  [PAID] Mar 2024  ₹4,500        │
└─────────────────────────────────┘
```

---

## 4. FM Collection Dashboard

**File:** `app/(app)/(fm)/billing/dashboard.tsx`

```
┌─────────────────────────────────┐
│  Collection — June 2024  [◀ ▶]  │  ← Month picker
├─────────────────────────────────┤
│  Total Billed:    ₹1,12,500     │
│  Collected:       ₹98,000       │
│  Collection Rate: 87.1%         │
│  ████████████████████░░         │
│  Outstanding:     ₹14,500       │
│  Overdue Units:   8             │
├─────────────────────────────────┤
│  Recent Payments (Last 10)      │
│  A-101  ₹4,500  Jun 12 [Receipt]│
│  B-204  ₹6,000  Jun 11 [Receipt]│
└─────────────────────────────────┘
```

---

## 5. Record Payment (FM)

**File:** `app/(app)/(fm)/billing/record-payment.tsx`

```
Ledger Entry ID * (auto-filled from unit ledger screen)
Amount:           ₹4,500 (read-only, must match ledger)
Payment Method:   [CASH] [BANK_TRANSFER] [CHEQUE] [UPI] [OTHER]
Reference No:     TXN20240612 (optional)

[Record Payment]
```

**After success:** Show generated receipt card with receipt number.

---

## 6. Receipt PDF Download

```typescript
const downloadReceipt = async (receiptId: string) => {
  const response = await apiClient.get(
    `/v1/billing/receipts/${receiptId}/pdf`,
    { responseType: "arraybuffer" }
  );
  const fileUri = `${FileSystem.documentDirectory}receipt-${receiptId}.pdf`;
  await FileSystem.writeAsStringAsync(
    fileUri,
    Buffer.from(response.data).toString("base64"),
    { encoding: FileSystem.EncodingType.Base64 }
  );
  await Sharing.shareAsync(fileUri, { mimeType: "application/pdf" });
};
```

---

## 7. Acceptance Criteria

| Check | Expected |
|---|---|
| Resident sees outstanding dues | Correct amount with status |
| OVERDUE due shown in red | Red badge, overdue days shown |
| FM records payment | POST called, ledger status → PAID |
| Amount mismatch | 400 error shown inline |
| Double payment attempt | 409 error "Already paid" shown |
| Receipt PDF download | PDF opens/shares on device |
| FM dashboard collection rate | Correct % calculated |
