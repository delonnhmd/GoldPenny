import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type SmartPennyUpdateResponse, type UpsertSmartPennyUpdateRequest } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

type SmartPennyPage = "rates" | "smart-penny";

export function useSmartPennyUpdate(page: SmartPennyPage) {
  return useQuery<SmartPennyUpdateResponse>({
    queryKey: [api.smartPennyUpdates.getByPage.path, page],
    queryFn: async () => {
      const res = await fetch(`${api.smartPennyUpdates.getByPage.path}?page=${page}`);
      if (!res.ok) {
        throw new Error("Failed to load content");
      }
      return (await res.json()) as SmartPennyUpdateResponse;
    },
  });
}

export function useUpsertSmartPennyUpdate(adminKey: string) {
  return useMutation({
    mutationFn: async (payload: UpsertSmartPennyUpdateRequest) => {
      const res = await fetch(api.smartPennyUpdates.upsert.path, {
        method: api.smartPennyUpdates.upsert.method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized admin key");
        }
        throw new Error("Failed to save update");
      }

      return res.json() as Promise<{ success: boolean }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.smartPennyUpdates.getByPage.path, variables.page] });
    },
  });
}
