import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import InvoicesList from "@/components/admin/InvoicesList";

export const dynamic = "force-dynamic";

export default function AdminInvoicesPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <InvoicesList />
    </main>
  );
}
