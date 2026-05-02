# Phase 10 — Document Management

**Status:** TODO  
**Estimated Time:** 4–5 days  
**Depends on:** Phase 03  

---

## 1. Screens
1. **Document Library** — category sidebar + document list
2. **Upload Document** — file picker + metadata form
3. **Document Detail** — view info + download
4. **Document Search** — full-text search
5. **Admin: All Documents** — manage with restore

---

## 2. Backend Endpoints

| Action | Method | Endpoint |
|---|---|---|
| List categories | GET | `/v1/documents/categories` |
| Create category | POST | `/v1/documents/categories` |
| List documents | GET | `/v1/documents?category_id=&my_unit=` |
| Upload document | POST | `/v1/documents` (multipart) |
| Download (signed URL) | GET | `/v1/documents/:id/download` |
| Update document | PATCH | `/v1/documents/:id` |
| Delete document | DELETE | `/v1/documents/:id` |
| Search documents | GET | `/v1/documents/search?q=` |
| Bulk upload | POST | `/v1/documents/bulk` |
| Admin: all docs | GET | `/v1/documents/admin/all` |
| Admin: restore | POST | `/v1/documents/admin/restore/:id` |

---

## 3. Document Library Screen

**File:** `app/(app)/documents/index.tsx`

```
┌─────────────────────────────────┐
│  Documents              [🔍] [+] │
├───────────┬─────────────────────┤
│ Categories│  Bylaws & Policies  │
│ ──────────│  ┌───────────────┐  │
│ ● Bylaws  │  │ 📄 Bylaws.pdf │  │
│   Notices │  │ 2.3 MB • 3d   │  │
│   Records │  │ [↓ Download]  │  │
│   Finance │  └───────────────┘  │
│           │  ┌───────────────┐  │
│           │  │ 📄 Rules.docx │  │
│           │  │ 1.1 MB • 1w   │  │
│           │  └───────────────┘  │
└───────────┴─────────────────────┘
```

**Category sidebar** (horizontal scroll on mobile):
- Fetched from `GET /v1/documents/categories`
- Filtered: residents only see categories where their role is in `access_roles`
- COMMUNITY_ADMIN sees all categories

**Document file icons by MIME type:**
```typescript
const FILE_ICONS: Record<string, string> = {
  "application/pdf": "picture-as-pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "description",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "table-chart",
  "image/jpeg": "image",
  "image/png": "image",
};
```

---

## 4. Upload Document Screen

**File:** `app/(app)/documents/upload.tsx`

```
┌─────────────────────────────────┐
│  ←  Upload Document             │
├─────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │  📎 Select File           │   │  ← Tap to open DocumentPicker
│  │  (PDF, Word, Excel, Image)│   │
│  │  Max 20 MB                │   │
│  └──────────────────────────┘   │
│  Selected: bylaws_2024.pdf      │  ← Shows after selection
│  2.3 MB ✓                       │
│                                 │
│  Document Name *                │
│  ┌──────────────────────────┐   │
│  │ bylaws_2024              │   │  ← Auto-filled from filename
│  └──────────────────────────┘   │
│                                 │
│  Category *                     │
│  ┌──────────────────────────┐   │
│  │ Bylaws & Policies      ▾ │   │
│  └──────────────────────────┘   │
│                                 │
│  Description (optional)         │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                 │
│  ████████████ 67%               │  ← Upload progress bar
│                                 │
│  [Upload Document]              │
└─────────────────────────────────┘
```

**File Selection:**
```typescript
import * as DocumentPicker from "expo-document-picker";

const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf",
           "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
           "image/jpeg", "image/png"],
    copyToCacheDirectory: true,
  });

  if (!result.canceled) {
    const file = result.assets[0];
    if (file.size! > 20 * 1024 * 1024) {
      showToast({ type: "error", message: "File exceeds 20MB limit." });
      return;
    }
    setSelectedFile(file);
    setDocumentName(file.name.replace(/\.[^/.]+$/, "")); // strip extension
  }
};
```

**Upload with progress:**
```typescript
const uploadDocument = async () => {
  const formData = new FormData();
  formData.append("file", {
    uri: selectedFile.uri,
    name: selectedFile.name,
    type: selectedFile.mimeType,
  } as any);
  formData.append("category_id", categoryId);
  formData.append("name", documentName);
  if (description) formData.append("description", description);

  await apiClient.post("/v1/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      setProgress(Math.round((e.loaded / e.total!) * 100));
    },
  });
};
```

---

## 5. Document Download

**IMPORTANT: Never cache the signed URL**

```typescript
const downloadDocument = async (docId: string) => {
  // 1. Get fresh signed URL (expires in 900s)
  const { data } = await apiClient.get(`/v1/documents/${docId}/download`);

  // 2. Download file to device
  const fileUri = FileSystem.documentDirectory + doc.name;
  const download = FileSystem.createDownloadResumable(data.url, fileUri);
  const result = await download.downloadAsync();

  // 3. Share / open file
  await Sharing.shareAsync(result!.uri);
};
```

**Access denied (403):**
```
"🔒 You don't have access to this document.
 Contact your community admin."
```

**Expired document (410):**
```
"📋 This document has expired and is no longer available."
```

---

## 6. Document Search

**File:** `app/(app)/documents/search.tsx`

```
┌─────────────────────────────────┐
│  ←  Search Documents            │
│  ┌──────────────────────────┐   │
│  │ 🔍 bylaws...             │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  Results for "bylaws" (3)       │
│  ┌──────────────────────────┐   │
│  │ 📄 Bylaws 2024.pdf        │   │
│  │ Category: Policies        │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

Debounced search — fires after 300ms of no typing.

---

## 7. Acceptance Criteria

| Check | Expected |
|---|---|
| Resident opens Documents | Only accessible categories shown |
| FM opens Documents | All categories visible |
| Upload PDF > 20MB | Error: file size exceeded |
| Upload invalid type (.exe) | Error: file type not allowed |
| Tap Download | Fresh signed URL fetched, file opens |
| 403 on restricted doc | Access denied message shown |
| Search "bylaws" | Matching documents returned |
| Document version history | Tap doc → see version list |
