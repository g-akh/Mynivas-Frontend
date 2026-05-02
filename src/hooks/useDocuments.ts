import { useQuery } from "@tanstack/react-query";
import { listDocuments, listCategories } from "../api/documents";

export function useDocumentList(params?: { category_id?: string; unit_id?: string; my_unit?: string }) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => listDocuments(params),
    staleTime: 60_000,
  });
}

export function useCategoryList() {
  return useQuery({
    queryKey: ["document-categories"],
    queryFn: listCategories,
    staleTime: 120_000,
  });
}
