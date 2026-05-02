import { apiClient } from "./client";
import type { Document, DocumentCategory } from "../types";

export async function listCategories(): Promise<DocumentCategory[]> {
  const { data } = await apiClient.get("/v1/documents/categories");
  return data.categories ?? [];
}

export async function listDocuments(params?: {
  category_id?: string;
  unit_id?: string;
  my_unit?: string;
}): Promise<Document[]> {
  const { data } = await apiClient.get("/v1/documents", { params });
  return data.documents ?? [];
}

export async function searchDocuments(params: {
  q: string;
  category_id?: string;
  limit?: number;
  offset?: number;
}): Promise<Document[]> {
  const { data } = await apiClient.get("/v1/documents/search", { params });
  return data.documents ?? [];
}

export async function getDownloadUrl(
  documentId: string
): Promise<{ url: string; expires_in: number }> {
  const { data } = await apiClient.get(`/v1/documents/${documentId}/download`);
  return data;
}

export async function uploadDocument(
  formData: FormData
): Promise<Document> {
  const { data } = await apiClient.post("/v1/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateDocument(
  id: string,
  patch: Partial<{ name: string; description: string; category_id: string; expires_at: string }>
): Promise<Document> {
  const { data } = await apiClient.patch(`/v1/documents/${id}`, patch);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/v1/documents/${id}`);
}

export async function createCategory(input: {
  name: string;
  description?: string;
  access_roles: string[];
}): Promise<DocumentCategory> {
  const { data } = await apiClient.post("/v1/documents/categories", input);
  return data;
}

export async function listAllDocuments(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ documents: Document[]; limit: number; offset: number }> {
  const { data } = await apiClient.get("/v1/documents/admin/all", { params });
  return data;
}

export async function restoreDocument(id: string): Promise<Document> {
  const { data } = await apiClient.post(`/v1/documents/admin/restore/${id}`);
  return data;
}

export function getMimeTypeIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "picture-as-pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "description";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "table-chart";
  if (mimeType.startsWith("image/")) return "image";
  return "insert-drive-file";
}

export function getMimeTypeColor(mimeType: string): string {
  if (mimeType.includes("pdf")) return "#E74C3C";
  if (mimeType.includes("word") || mimeType.includes("document")) return "#2980B9";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "#27AE60";
  if (mimeType.startsWith("image/")) return "#F39C12";
  return "#95A5A6";
}
