import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminAuthConfigured, verifySessionToken } from "@/lib/adminAuth";
import LoginForm from "@/components/admin/LoginForm";
import AdminContent from "@/components/admin/AdminContent";

export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = verifySessionToken(token);

  return (
    <main className="min-h-screen bg-paper text-ink">
      {authenticated ? (
        <AdminContent />
      ) : (
        <LoginForm configured={isAdminAuthConfigured()} />
      )}
    </main>
  );
}
