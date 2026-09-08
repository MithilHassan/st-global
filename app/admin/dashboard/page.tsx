import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminAuthConfigured, verifySessionToken } from "@/lib/adminAuth";
import LoginForm from "@/components/admin/LoginForm";
import AdminOverview from "@/components/admin/AdminOverview";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = verifySessionToken(token);

  return (
    <main className="min-h-screen bg-paper text-ink">
      {authenticated ? (
        <AdminOverview />
      ) : (
        <LoginForm configured={isAdminAuthConfigured()} />
      )}
    </main>
  );
}
