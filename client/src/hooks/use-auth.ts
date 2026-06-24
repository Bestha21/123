import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchUser() {
  const response = await fetch("/api/auth/user", { credentials: "include" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(response.status + ": " + response.statusText);
  return response.json();
}

async function logout() {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
  window.location.href = "/login";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => { queryClient.setQueryData(["/api/auth/user"], null); },
  });

  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/stop-impersonation", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to stop impersonation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      window.location.href = "/employees";
    },
  });

  const anyUser = user;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    isImpersonating: !!(anyUser?.isImpersonating),
    originalAdmin: anyUser?.originalAdmin || null,
    stopImpersonation: stopImpersonationMutation.mutate,
    isStoppingImpersonation: stopImpersonationMutation.isPending,
  };
}
