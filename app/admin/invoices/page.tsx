import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminAuthConfigured, verifySessionToken } from "@/lib/adminAuth";
import LoginForm from "@/components/admin/LoginForm";
import AdminInvoices from "@/components/admin/AdminInvoices";

export const dynamic = "force-dynamic";

export default function AdminInvoicesPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = verifySessionToken(token);

  return (
    <main className="min-h-screen bg-paper text-ink">
      {authenticated ? (
        <AdminInvoices />
      ) : (
        <LoginForm configured={isAdminAuthConfigured()} />
      )}
    </main>
  );
}
