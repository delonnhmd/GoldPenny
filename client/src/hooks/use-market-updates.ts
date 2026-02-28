import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type MarketUpdateResponse, type UpsertMarketUpdateRequest } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

export function useMarketUpdate(page: "rates" | "market") {
  return useQuery<MarketUpdateResponse>({
    queryKey: [api.marketUpdates.getByPage.path, page],
    queryFn: async () => {
      const res = await fetch(`${api.marketUpdates.getByPage.path}?page=${page}`);
      if (!res.ok) {
        throw new Error("Failed to load content");
      }
      return (await res.json()) as MarketUpdateResponse;
    },
  });
}

export function useUpsertMarketUpdate(adminKey: string) {
  return useMutation({
    mutationFn: async (payload: UpsertMarketUpdateRequest) => {
      const res = await fetch(api.marketUpdates.upsert.path, {
        method: api.marketUpdates.upsert.method,
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
      queryClient.invalidateQueries({ queryKey: [api.marketUpdates.getByPage.path, variables.page] });
    },
  });
}
