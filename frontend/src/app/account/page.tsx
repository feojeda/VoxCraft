"use client";

import { useRouter } from "next/navigation";
import { User, LogOut, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import type { ShareLink } from "@/lib/types";

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const { data: sharesData, isLoading: sharesLoading } = useQuery({
    queryKey: ["shares"],
    queryFn: () => apiClient.getShares(),
  });

  const revokeMutation = useMutation({
    mutationFn: (shareId: string) => apiClient.revokeShare(shareId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shares"] }),
  });

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-xl font-semibold text-[var(--text-primary)]">
          Account
        </h1>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          {/* Profile section */}
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Profile
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
                <User className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Email</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {user?.email ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Shared Links section */}
          <div className="mt-6 border-t border-[var(--border)] pt-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Shared Links
            </h2>
            {sharesLoading && (
              <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
            )}
            {!sharesLoading && sharesData?.items.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">
                No active share links.
              </p>
            )}
            {!sharesLoading && sharesData && sharesData.items.length > 0 && (
              <div className="space-y-2">
                {sharesData.items.map((share: ShareLink) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-[var(--text-primary)]">
                        {share.share_url}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {share.expires_at
                          ? `Expires: ${new Date(share.expires_at).toLocaleDateString()}`
                          : "Never expires"}
                      </p>
                    </div>
                    <button
                      onClick={() => revokeMutation.mutate(share.id)}
                      disabled={revokeMutation.isPending}
                      className="ml-2 rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      aria-label="Revoke"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions section */}
          <div className="mt-6 border-t border-[var(--border)] pt-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Actions
            </h2>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-[var(--error)] transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
