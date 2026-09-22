"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  Users,
  FileText,
  Settings,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  Menu,
  X,
  MapPinned,
  FileEdit,
} from "lucide-react";
import type { NotificationItem } from "./shared";

type NavKey = "dashboard" | "bookings" | "customers" | "invoices" | "content" | "settings";

const NAV_ITEMS: { key: NavKey; label: string; icon: typeof LayoutDashboard; href: string; enabled: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", enabled: true },
  { key: "bookings", label: "Bookings", icon: PackageSearch, href: "/admin", enabled: true },
  { key: "customers", label: "Customers", icon: Users, href: "/admin/customers", enabled: true },
  { key: "invoices", label: "Invoices", icon: FileText, href: "/admin/invoices", enabled: true },
  { key: "content", label: "Content", icon: FileEdit, href: "/admin/content", enabled: true },
  { key: "settings", label: "Settings", icon: Settings, href: "/admin/settings", enabled: true },
];

export default function AdminShell({
  active,
  eyebrow,
  title,
  search,
  notifications = [],
  children,
}: {
  active: NavKey;
  eyebrow: string;
  title: string;
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
  notifications?: NotificationItem[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [who, setWho] = useState<{ name: string; email: string; initials: string }>({
    name: "Admin",
    email: "",
    initials: "A",
  });
  const [canManageContent, setCanManageContent] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.identity) return;
        if (data.identity.kind === "admin") {
          setWho({
            name: data.identity.name,
            email: data.identity.email,
            initials: data.identity.name.slice(0, 2).toUpperCase(),
          });
          setCanManageContent(Boolean(data.identity.isSuperAdmin));
        } else {
          setWho({ name: "Team admin", email: "Shared password", initials: "TA" });
          // The shared/master password is always treated as super admin.
          setCanManageContent(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Backdrop — only rendered (and only needed) when the mobile drawer is open */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-20 bg-ink/50 md:hidden"
        />
      )}

      {/* Sidebar — fixed on desktop; an off-canvas drawer below md, toggled
          by the hamburger button in the top bar. */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-ink text-paper transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-paper/10 px-5 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-paper p-1.5">
            <Image
              src="/images/logo.png"
              alt="ST Global Forwarding logo"
              width={32}
              height={30}
              className="h-full w-full object-contain"
            />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-display text-sm font-semibold tracking-tight">ST GLOBAL</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-paper/50">
              Forwarding
            </p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="shrink-0 text-paper/50 hover:text-paper md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.filter((item) => item.key !== "content" || canManageContent).map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            if (!item.enabled) {
              return (
                <div
                  key={item.key}
                  title="Coming soon"
                  className="flex cursor-not-allowed items-center justify-between gap-3 px-3 py-2.5 text-sm text-paper/30"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} strokeWidth={1.75} />
                    {item.label}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wide text-paper/25">
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-royalLight/20 font-medium text-paper"
                    : "text-paper/70 hover:bg-paper/5 hover:text-paper"
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-paper/10 p-3">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-paper/5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-royalLight font-mono text-xs font-medium text-ink">
              {who.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{who.name}</span>
              <span className="block truncate text-xs text-paper/45">{who.email}</span>
            </span>
            <ChevronDown size={15} className="shrink-0 text-paper/40" />
          </button>
          {profileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 border border-paper/10 bg-marine">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-paper/80 hover:bg-paper/5 hover:text-paper"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main column — offset by the fixed sidebar's width on desktop only;
          on mobile the sidebar is an overlay, so no offset is needed. */}
      <div className="min-w-0 md:ml-64">
        <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-line text-ink/60 hover:border-ink hover:text-ink md:hidden"
                aria-label="Open menu"
              >
                <Menu size={17} />
              </button>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
                  {eyebrow}
                </p>
                <h1 className="truncate font-display text-xl font-semibold leading-tight tracking-tight">
                  {title}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {search && (
                <div className="relative hidden md:block">
                  <PackageSearch
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30"
                  />
                  <input
                    type="text"
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    placeholder={search.placeholder ?? "Search…"}
                    className="w-64 border border-line bg-white py-2 pl-9 pr-3 text-sm placeholder:text-ink/30 focus:border-royal"
                  />
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setProfileOpen(false);
                  }}
                  title={
                    notifications.length > 0
                      ? `${notifications.length} shipment${notifications.length === 1 ? "" : "s"} awaiting delivery confirmation`
                      : "Notifications"
                  }
                  className="flex h-9 w-9 items-center justify-center border border-line text-ink/60 hover:border-ink hover:text-ink"
                >
                  <Bell size={16} />
                </button>
                {notifications.length > 0 && (
                  <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center bg-signal px-1 font-mono text-[10px] font-medium text-white">
                    {notifications.length > 99 ? "99+" : notifications.length}
                  </span>
                )}
                {notifOpen && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-80 border border-line bg-white shadow-sm">
                    <div className="border-b border-line px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                        Arrived — awaiting delivery
                      </p>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-ink/40">
                        Nothing needs attention right now.
                      </p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.href}
                            onClick={() => setNotifOpen(false)}
                            className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-paperdim/50"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-marine/10 text-marine">
                              <MapPinned size={14} />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-mono text-xs font-medium">{n.title}</span>
                              <span className="mt-0.5 block truncate text-xs text-ink/50">{n.subtitle}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Link
                href="/booking"
                target="_blank"
                className="flex items-center gap-1.5 bg-royal px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-white transition-colors hover:bg-royalLight hover:text-ink md:px-4"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New booking</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
