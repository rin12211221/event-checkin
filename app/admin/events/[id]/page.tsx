import Link from "next/link";
import { ArrowLeft, Camera, ExternalLink, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getClubs, getEventById, getRegistrations } from "@/lib/db";
import { LinkQr } from "@/components/link-qr";
import { CopyButton } from "@/components/copy-button";
import { ClubManager } from "./club-manager";
import { AttendanceTable } from "./attendance-table";

export const dynamic = "force-dynamic";

export default async function EventAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [event, clubs, registrations] = await Promise.all([
    getEventById(id),
    getClubs(id),
    getRegistrations(id)
  ]);
  if (!event) notFound();

  const checkedIn = registrations.filter((row) => row.checked_in_at).length;
  const walkIns = registrations.filter((row) => row.source === "walk_in").length;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const venueUrl = `${appUrl}/e/${event.slug}?source=walkin`;

  return (
    <main className="admin-shell wide">
      <div className="crumb-row">
        <Link href="/admin" className="back-link"><ArrowLeft size={17} /> All events</Link>
        <a className="button button-secondary button-small" href={`/e/${event.slug}`} target="_blank"><ExternalLink size={16} /> Public page</a>
      </div>

      <header className="event-admin-header">
        <div><div className="section-kicker">{event.restaurant_name}</div><h1>{event.name}</h1><p>{event.date_label} · {event.location_name}</p></div>
        <Link className="button button-primary scanner-launch" href={`/admin/events/${event.id}/scanner`}><Camera size={19} /> Open scanner</Link>
      </header>

      <section className="stat-grid">
        <div className="stat-card"><span>Registered</span><strong>{registrations.length}</strong></div>
        <div className="stat-card success"><span>Checked in</span><strong>{checkedIn}</strong></div>
        <div className="stat-card"><span>Not arrived</span><strong>{registrations.length - checkedIn}</strong></div>
        <div className="stat-card"><span>Walk-ins</span><strong>{walkIns}</strong></div>
      </section>

      <section className="event-tools-grid">
        <div className="panel">
          <div className="panel-title"><Users size={19} /><div><h2>Club links</h2><p>Each club gets its own tracked registration link.</p></div></div>
          <ClubManager eventId={event.id} eventSlug={event.slug} clubs={clubs} appUrl={appUrl} />
        </div>
        <div className="panel venue-panel">
          <div><div className="section-kicker">Venue signup QR</div><h2>Walk-in registration</h2><p>Put this QR at the entrance for students who did not register beforehand.</p></div>
          <LinkQr value={venueUrl} size={150} />
          <CopyButton value={venueUrl} label="Copy walk-in link" />
        </div>
      </section>

      <section className="panel attendance-panel">
        <div className="panel-title"><div><h2>Attendance</h2><p>Search, filter, and export registrations.</p></div></div>
        <AttendanceTable registrations={registrations.map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          club: Array.isArray(row.club) ? row.club[0]?.name ?? null : row.club?.name ?? null,
          source: row.source,
          createdAt: row.created_at,
          checkedInAt: row.checked_in_at
        }))} />
      </section>
    </main>
  );
}
