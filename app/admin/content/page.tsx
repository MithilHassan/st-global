import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminAuthConfigured, getSessionIdentity, isSuperAdmin } from "@/lib/adminAuth";
import LoginForm from "@/components/admin/LoginForm";
import AdminContent from "@/components/admin/AdminContent";

export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);

  if (!identity) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <LoginForm configured={isAdminAuthConfigured()} />
      </main>
    );
  }

  if (!isSuperAdmin(identity)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
        <div className="max-w-sm border border-line bg-white p-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Restricted</p>
          <h1 className="mt-2 font-display text-xl font-semibold">Super admins only</h1>
          <p className="mt-3 text-sm text-ink/60">
            The Content page is only available to super admins. Ask one to make the change, or to grant you
            super admin from Settings.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <AdminContent />
    </main>
  );
}
