import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import InvoiceEditor from "@/components/admin/InvoiceEditor";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminInvoiceEditorPage({ params }: { params: { id: string } }) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    redirect("/admin");
  }

  return (
    <AdminShell active="bookings" eyebrow="Operations" title="Invoice">
      <InvoiceEditor invoiceId={params.id} />
    </AdminShell>
  );
}
