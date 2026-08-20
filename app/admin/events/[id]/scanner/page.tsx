import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getEventById } from "@/lib/db";
import { Scanner } from "./scanner";

export const dynamic = "force-dynamic";

export default async function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <main className="scanner-shell">
      <header className="scanner-header">
        <Link href={`/admin/events/${id}`}><ArrowLeft size={19} /> Event dashboard</Link>
        <div><strong>{event.name}</strong><span>{event.location_name}</span></div>
      </header>
      <Scanner eventId={id} />
    </main>
  );
}
