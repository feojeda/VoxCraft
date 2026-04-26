"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Sparkles,
  History,
  Mic,
  User,
  LogOut,
  ChevronDown,
  Home,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/", label: "Generate", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/voices", label: "Voices", icon: Mic },
  { href: "/account", label: "Account", icon: User },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Don't render nav for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <Sparkles className="h-5 w-5 text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            ttsQwen
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop user menu */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              <span className="max-w-[140px] truncate">
                {user?.email}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
                <Link
                  href="/account"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <User className="h-4 w-4" />
                  Account
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--error)] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="my-1 border-t border-[var(--border)]" />
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--error)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
