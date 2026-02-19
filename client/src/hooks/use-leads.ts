import { useMutation } from "@tanstack/react-query";
import { api, type LeadInput, type LeadResponse } from "@shared/routes"; // Import from shared routes
import { useToast } from "@/hooks/use-toast";

export function useCreateLead() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LeadInput) => {
      const res = await fetch(api.leads.create.path, {
        method: api.leads.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to submit application");
      }

      // Parse response using Zod schema from routes
      const result = await res.json();
      return result as LeadResponse; 
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
      
      // Handle the redirect as specified in requirements
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
  });
}
