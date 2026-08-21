import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { getEvents, getRegistrations } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { EventCreateForm } from "./event-create-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const events = await getEvents();
  const rows = await Promise.all(
    events.map(async (event) => {
      const registrations = await getRegistrations(event.id);
      return {
        event,
        registered: registrations.length,
        checkedIn: registrations.filter((registration) => registration.checked_in_at).length
      };
    })
  );

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="brand-pill">UPSWELL</div>
          <h1>Event check-in</h1>
          <p>Registration, attendance, and club tracking in one place.</p>
        </div>
      </header>

      <section className="admin-grid">
        <div>
          <div className="section-heading">
            <div>
              <span className="section-kicker">Events</span>
              <h2>Choose an event</h2>
            </div>
          </div>
          <div className="event-list">
            {rows.length === 0 ? (
              <div className="empty-state">No events yet. Create the first one.</div>
            ) : (
              rows.map(({ event, registered, checkedIn }) => (
                <Link className="event-row" href={`/admin/events/${event.id}`} key={event.id}>
                  <div>
                    <strong>{event.name}</strong>
                    <span>
                      {event.date_label} · {event.location_name}
                    </span>
                  </div>
                  <div className="row-stats">
                    <span>{registered} registered</span>
                    <span>{checkedIn} in</span>
                    <ArrowRight size={18} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        <aside className="create-panel">
          <div className="section-kicker">
            <Plus size={14} /> New event
          </div>
          <h2>Create event</h2>
          <EventCreateForm />
        </aside>
      </section>
    </main>
  );
}
