import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type CreateMarketPostRequest, type MarketPostResponse } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

export function useMarketPosts(page: "rates" | "market") {
  return useQuery<MarketPostResponse>({
    queryKey: [api.marketPosts.listByPage.path, page],
    queryFn: async () => {
      const res = await fetch(`${api.marketPosts.listByPage.path}?page=${page}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load posts");
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
        const text = await res.text();
        throw new Error(text || "Failed to publish post");
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.marketPosts.listByPage.path, variables.page] });
    },
  });
}

export function useUpdateMarketPost(adminKey: string) {
  return useMutation({
    mutationFn: async (payload: { id: number; page: "rates" | "market"; title: string; content: string }) => {
      const path = api.marketPosts.update.path.replace(":id", String(payload.id));
      const res = await fetch(path, {
        method: api.marketPosts.update.method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized admin key");
        }
        const text = await res.text();
        throw new Error(text || "Failed to update post");
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.marketPosts.listByPage.path, variables.page] });
    },
  });
}

export function useDeleteMarketPost(adminKey: string) {
  return useMutation({
    mutationFn: async (payload: { id: number; page: "rates" | "market" }) => {
      const path = api.marketPosts.delete.path.replace(":id", String(payload.id));
      const res = await fetch(path, {
        method: api.marketPosts.delete.method,
        headers: {
          "x-admin-key": adminKey,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized admin key");
        }
        const text = await res.text();
        throw new Error(text || "Failed to delete post");
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.marketPosts.listByPage.path, variables.page] });
    },
  });
}
