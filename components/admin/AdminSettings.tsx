"use client";

import { useEffect, useState } from "react";
import { KeyRound, Mail, CheckCircle2, XCircle, Users, Trash2, UserPlus } from "lucide-react";
import AdminShell from "./AdminShell";

interface SettingsData {
  identity: { kind: "master" } | { kind: "admin"; id: string; name: string; email: string; isSuperAdmin: boolean };
  canManageAdmins: boolean;
  passwordIsCustom: boolean;
  smtp: {
    configured: boolean;
    host: string | null;
    port: string | null;
    user: string | null;
    from: string | null;
  };
  siteUrl: string | null;
  adminNotificationEmail: string | null;
  notificationSource: "custom" | "env" | "disabled" | "unset";
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
  is_super_admin: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySaving, setNotifySaving] = useState(false);
  const [notifyNotice, setNotifyNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [admins, setAdmins] = useState<AdminUserRow[] | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [grantSuperAdmin, setGrantSuperAdmin] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminsNotice, setAdminsNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadAdmins() {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setAdmins(data.admins);
    } catch {
      // Non-fatal — the rest of the Settings page still works.
    }
  }

  async function load(): Promise<boolean> {
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load settings.");
      setSettings(data);
      setNotifyEmail(data.adminNotificationEmail ?? "");
      return Boolean(data.canManageAdmins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
      return false;
    }
  }

  useEffect(() => {
    (async () => {
      const canManage = await load();
      if (canManage) loadAdmins();
    })();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordNotice(null);
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: "error", msg: "New password and confirmation don't match." });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to change password.");
      setPasswordNotice({ type: "success", msg: "Password updated. Use it next time you sign in." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await load();
    } catch (err) {
      setPasswordNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function saveNotificationEmail(value: string | null) {
    setNotifySaving(true);
    setNotifyNotice(null);
    try {
      const res = await fetch("/api/admin/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotificationEmail: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      setNotifyNotice({ type: "success", msg: "Saved." });
      await load();
    } catch (err) {
      setNotifyNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to save.",
      });
    } finally {
      setNotifySaving(false);
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminsNotice(null);
    setCreatingAdmin(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPw, isSuperAdmin: grantSuperAdmin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create admin.");
      setAdminsNotice({ type: "success", msg: `${newName} can now sign in with their own email.` });
      setNewName("");
      setNewEmail("");
      setNewPw("");
      setGrantSuperAdmin(false);
      await loadAdmins();
    } catch (err) {
      setAdminsNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to create admin.",
      });
    } finally {
      setCreatingAdmin(false);
    }
  }

  async function handleDeleteAdmin(admin: AdminUserRow) {
    const isSelf = settings?.identity.kind === "admin" && settings.identity.id === admin.id;
    const confirmed = window.confirm(
      isSelf
        ? `Delete your own admin account (${admin.email})? You'll be signed out and will need the shared team password to get back in.`
        : `Remove ${admin.name} (${admin.email}) as an admin? They'll no longer be able to sign in with this account.`
    );
    if (!confirmed) return;

    setDeletingId(admin.id);
    setAdminsNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to remove admin.");
      setAdminsNotice({ type: "success", msg: `${admin.name} removed.` });
      await loadAdmins();
    } catch (err) {
      setAdminsNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to remove admin.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminShell active="settings" eyebrow="Operations" title="Settings">
      {error && (
        <p className="mb-6 border border-signal/40 bg-signal/5 px-4 py-3 text-sm text-ink">{error}</p>
      )}

      {!settings ? (
        <p className="text-sm text-ink/50">Loading settings…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Account & security */}
          <div className="border border-line bg-white p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center bg-royal/10 text-royal">
                <KeyRound size={15} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">Account &amp; security</p>
                <p className="text-xs text-ink/50">
                  {settings.identity.kind === "admin"
                    ? `Signed in as ${settings.identity.name} (${settings.identity.email}).`
                    : settings.passwordIsCustom
                    ? "Signed in with the shared team password (custom)."
                    : "Signed in with the shared team password (ADMIN_PASSWORD default)."}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-ink/50">
                  Current password
                </span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-royal"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-ink/50">
                  New password
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-royal"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-ink/50">
                  Confirm new password
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-royal"
                />
              </label>
              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full border border-ink bg-ink py-2.5 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? "Saving…" : "Change password"}
              </button>
              {passwordNotice && (
                <p className={`text-xs ${passwordNotice.type === "success" ? "text-teal" : "text-signal"}`}>
                  {passwordNotice.msg}
                </p>
              )}
            </form>
          </div>

          {/* Email delivery */}
          <div className="border border-line bg-white p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center bg-teal/10 text-teal">
                <Mail size={15} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold">Email delivery</p>
                <p className="text-xs text-ink/50">Booking confirmations &amp; status-update emails.</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 border border-line bg-paper px-4 py-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink/60">SMTP configured</span>
                {settings.smtp.configured ? (
                  <span className="flex items-center gap-1 font-medium text-success">
                    <CheckCircle2 size={13} /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-signal">
                    <XCircle size={13} /> No — set SMTP_HOST/USER/PASSWORD
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink/60">Host</span>
                <span className="font-mono text-ink/80">{settings.smtp.host ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink/60">Port</span>
                <span className="font-mono text-ink/80">{settings.smtp.port ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink/60">Sends as</span>
                <span className="truncate font-mono text-ink/80">{settings.smtp.from ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink/60">Tracking link domain</span>
                <span className="truncate font-mono text-ink/80">{settings.siteUrl ?? "not set"}</span>
              </div>
            </div>

            <div className="mt-5">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Ops bcc address
              </span>
              <p className="mb-2 text-xs text-ink/50">
                Every booking confirmation and status-update email sent to a customer is quietly bcc'd here too.
                Leave blank and save to turn it off entirely.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="ops@yourdomain.com"
                  className="flex-1 border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/30 focus:border-royal"
                />
                <button
                  onClick={() => saveNotificationEmail(notifyEmail.trim())}
                  disabled={notifySaving}
                  className="border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink/40">
                  {settings.notificationSource === "custom" && "Custom override active"}
                  {settings.notificationSource === "env" && "Using ADMIN_NOTIFICATION_EMAIL env default"}
                  {settings.notificationSource === "disabled" && "Bcc explicitly disabled"}
                  {settings.notificationSource === "unset" && "No bcc configured"}
                </span>
                {settings.notificationSource !== "env" && settings.notificationSource !== "unset" && (
                  <button
                    onClick={() => saveNotificationEmail(null)}
                    disabled={notifySaving}
                    className="font-mono text-[10px] uppercase tracking-wide text-royal hover:underline disabled:opacity-60"
                  >
                    Reset to default
                  </button>
                )}
              </div>
              {notifyNotice && (
                <p className={`mt-2 text-xs ${notifyNotice.type === "success" ? "text-teal" : "text-signal"}`}>
                  {notifyNotice.msg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {settings?.canManageAdmins && (
        <div className="mt-6 border border-line bg-white p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center bg-royal/10 text-royal">
              <Users size={15} />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">Admin users</p>
              <p className="text-xs text-ink/50">
                Individual logins that work alongside the shared team password above. Only super admins can see this.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              {!admins ? (
                <p className="text-xs text-ink/50">Loading admins…</p>
              ) : admins.length === 0 ? (
                <p className="border border-line bg-paper px-4 py-6 text-center text-xs text-ink/50">
                  No named admins yet — everyone signs in with the shared password.
                </p>
              ) : (
                <div className="divide-y divide-line border border-line">
                  {admins.map((admin) => {
                    const isSelf = settings.identity.kind === "admin" && settings.identity.id === admin.id;
                    return (
                      <div key={admin.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-royal/10 font-mono text-xs font-medium text-royal">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {admin.name}
                            {isSelf && <span className="ml-1.5 font-mono text-[10px] uppercase text-teal">You</span>}
                            {admin.is_super_admin && (
                              <span className="ml-1.5 font-mono text-[10px] uppercase text-royal">Super admin</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-ink/50">{admin.email}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          disabled={deletingId === admin.id}
                          className="flex h-8 w-8 shrink-0 items-center justify-center text-ink/40 hover:bg-signal/5 hover:text-signal disabled:opacity-50"
                          title="Remove admin"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-ink/50">
                <UserPlus size={12} /> Create a new admin
              </p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/30 focus:border-royal"
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/30 focus:border-royal"
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Temporary password (min. 8 characters)"
                required
                minLength={8}
                className="w-full border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/30 focus:border-royal"
              />
              <label className="flex items-center gap-2 text-xs text-ink/60">
                <input
                  type="checkbox"
                  checked={grantSuperAdmin}
                  onChange={(e) => setGrantSuperAdmin(e.target.checked)}
                  className="h-4 w-4 border-line accent-royal"
                />
                Make this a super admin (can also create/remove admins)
              </label>
              <button
                type="submit"
                disabled={creatingAdmin}
                className="w-full border border-ink bg-ink py-2.5 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingAdmin ? "Creating…" : "Create admin"}
              </button>
              {adminsNotice && (
                <p className={`text-xs ${adminsNotice.type === "success" ? "text-teal" : "text-signal"}`}>
                  {adminsNotice.msg}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
