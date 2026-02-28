import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type CreateMarketPostRequest, type MarketPostResponse } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

export function useMarketPosts(page: "rates" | "market") {
  return useQuery<MarketPostResponse>({
    queryKey: [api.marketPosts.listByPage.path, page],
    queryFn: async () => {
      const res = await fetch(`${api.marketPosts.listByPage.path}?page=${page}`);
      if (!res.ok) {
        throw new Error("Failed to load posts");
      }
      return (await res.json()) as MarketPostResponse;
    },
  });
}

export function useCreateMarketPost(adminKey: string) {
  return useMutation({
    mutationFn: async (payload: CreateMarketPostRequest) => {
      const res = await fetch(api.marketPosts.create.path, {
        method: api.marketPosts.create.method,
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
        throw new Error("Failed to publish post");
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.marketPosts.listByPage.path, variables.page] });
    },
  });
}
