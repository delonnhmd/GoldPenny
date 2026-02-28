import { useQuery } from "@tanstack/react-query";
import { api, type AdminLeadResponse, type AdminReportResponse } from "@shared/routes";

export function useAdminLeads(adminKey: string, limit = 100, enabled = false) {
  return useQuery<AdminLeadResponse>({
    queryKey: [api.admin.leads.path, limit, adminKey],
    enabled,
    queryFn: async () => {
      const res = await fetch(`${api.admin.leads.path}?limit=${limit}`, {
        headers: { "x-admin-key": adminKey },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized admin key");
        }
        throw new Error("Failed to load leads");
      }

      return (await res.json()) as AdminLeadResponse;
    },
  });
}

export function useAdminReport(adminKey: string, period: "day" | "week", enabled = false) {
  return useQuery<AdminReportResponse>({
    queryKey: [api.admin.report.path, period, adminKey],
    enabled,
    queryFn: async () => {
      const res = await fetch(`${api.admin.report.path}?period=${period}`, {
        headers: { "x-admin-key": adminKey },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized admin key");
        }
        throw new Error("Failed to load report");
      }

      return (await res.json()) as AdminReportResponse;
    },
  });
}
