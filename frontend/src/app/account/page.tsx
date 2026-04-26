"use client";

import { useRouter } from "next/navigation";
import { User, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
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

          {/* Actions section */}
          <div>
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
