import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminAuthConfigured, verifySessionToken } from "@/lib/adminAuth";
import LoginForm from "@/components/admin/LoginForm";
import AdminSettings from "@/components/admin/AdminSettings";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = verifySessionToken(token);

  return (
    <main className="min-h-screen bg-paper text-ink">
      {authenticated ? (
        <AdminSettings />
      ) : (
        <LoginForm configured={isAdminAuthConfigured()} />
      )}
    </main>
  );
}
