import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type CreateSmartPennyPostRequest, type SmartPennyPostResponse } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

type SmartPennyPage = "rates" | "smart-penny" | "shopping-guide";

export function useSmartPennyPosts(page: SmartPennyPage) {
  return useQuery<SmartPennyPostResponse>({
    queryKey: [api.smartPennyPosts.listByPage.path, page],
    queryFn: async () => {
      const res = await fetch(`${api.smartPennyPosts.listByPage.path}?page=${page}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load posts");
      }
      return (await res.json()) as SmartPennyPostResponse;
    },
  });
}

export function useCreateSmartPennyPost(adminKey: string) {
  return useMutation({
    mutationFn: async (payload: CreateSmartPennyPostRequest) => {
      const res = await fetch(api.smartPennyPosts.create.path, {
        method: api.smartPennyPosts.create.method,
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
      queryClient.invalidateQueries({ queryKey: [api.smartPennyPosts.listByPage.path, variables.page] });
    },
  });
}

export function useUpdateSmartPennyPost(adminKey: string) {
  return useMutation({
    mutationFn: async (payload: { id: number; page: SmartPennyPage; title: string; content: string }) => {
      const path = api.smartPennyPosts.update.path.replace(":id", String(payload.id));
      const res = await fetch(path, {
        method: api.smartPennyPosts.update.method,
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
      queryClient.invalidateQueries({ queryKey: [api.smartPennyPosts.listByPage.path, variables.page] });
    },
  });
}

export function useDeleteSmartPennyPost(adminKey: string) {
  return useMutation({
    mutationFn: async (payload: { id: number; page: SmartPennyPage }) => {
      const path = api.smartPennyPosts.delete.path.replace(":id", String(payload.id));
      const res = await fetch(path, {
        method: api.smartPennyPosts.delete.method,
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
      queryClient.invalidateQueries({ queryKey: [api.smartPennyPosts.listByPage.path, variables.page] });
    },
  });
}
