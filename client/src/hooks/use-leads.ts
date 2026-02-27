import { useMutation } from "@tanstack/react-query";
import { api, type LeadInput, type LeadResponse } from "@shared/routes"; // Import from shared routes
import { useToast } from "@/hooks/use-toast";

function buildOffersUrl(data: LeadInput) {
  const searchParams = new URLSearchParams({
    name: data.fullName,
    purpose: data.loanPurpose,
    amount: String(data.loanAmount),
    score: data.creditScoreRange,
  });

  return `/offers?${searchParams.toString()}`;
}

export function useCreateLead() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LeadInput) => {
      try {
        const res = await fetch(api.leads.create.path, {
          method: api.leads.create.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          if (res.status === 400) {
            const error = await res.json();
            const validationError = new Error(error.message || "Validation failed");
            validationError.name = "ValidationError";
            throw validationError;
          }

          return { redirectUrl: buildOffersUrl(data) } as LeadResponse;
        }

        // Parse response using Zod schema from routes
        const result = await res.json();
        return result as LeadResponse;
      } catch (error) {
        if (error instanceof Error && error.name === "ValidationError") {
          throw error;
        }

        return { redirectUrl: buildOffersUrl(data) } as LeadResponse;
      }
    },
    onError: (error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Application Submitted",
        description: "Redirecting you to your offers...",
      });

      window.location.href = data.redirectUrl;
    },
  });
}
