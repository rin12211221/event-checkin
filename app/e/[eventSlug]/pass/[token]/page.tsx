import { CheckCircle2, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { PassQr } from "@/components/pass-qr";
import { getEventById, getRegistrationByToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PassPage({ params }: { params: Promise<{ eventSlug: string; token: string }> }) {
  const { token } = await params;
  const registration = await getRegistrationByToken(token);
  if (!registration) notFound();
  const event = await getEventById(registration.event_id);
  if (!event) notFound();

  const clubRaw = registration.club as unknown;
  const clubName = Array.isArray(clubRaw)
    ? ((clubRaw[0] as { name?: string } | undefined)?.name ?? null)
    : ((clubRaw as { name?: string } | null)?.name ?? null);

  return (
    <main className="pass-shell">
      <section className="pass-card">
        <div className="brand-pill">UPSWELL · EVENT PASS</div>
        {registration.checked_in_at ? (
          <div className="checked-banner"><CheckCircle2 size={20} /> Checked in</div>
        ) : (
          <div className="pass-instruction">Show this QR at check-in</div>
        )}
        <h1>{registration.name}</h1>
        {clubName ? <div className="pass-club">{clubName}</div> : null}
        <PassQr token={token} />
        <div className="pass-details">
          <strong>{event.name}</strong>
          <span>{event.date_label}</span>
          <span><MapPin size={16} /> {event.location_name}</span>
        </div>
        <p className="pass-tip">Keep this page open when you arrive. Staff can scan it in a second.</p>
      </section>
    </main>
  );
}
