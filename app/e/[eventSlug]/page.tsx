import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { getClubs, getEventBySlug } from "@/lib/db";
import { RegistrationForm } from "./registration-form";

export const dynamic = "force-dynamic";

export default async function EventRegistrationPage({
  params,
  searchParams
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventSlug } = await params;
  const query = await searchParams;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const clubs = await getClubs(event.id);
  const clubQuery = typeof query.club === "string" ? query.club : undefined;
  const selectedClub = clubs.find((club) => club.slug === clubQuery) ?? null;
  const source = query.source === "walkin" ? "walk_in" : selectedClub ? "club_link" : "direct";

  return (
    <main className="public-shell">
      <section className="event-hero">
        <div className="brand-pill">UPSWELL · CAMPUS</div>
        <div className="event-badge"><Sparkles size={16} /> Free food event</div>
        <h1>{event.name}</h1>
        <p className="hero-offer">{event.offer}</p>
        <div className="event-meta">
          <div><CalendarDays size={19} /><span>{event.date_label}</span></div>
          <div><MapPin size={19} /><span>{event.location_name}<small>{event.address}</small></span></div>
        </div>
      </section>

      <section className="registration-card">
        <div className="section-kicker">Claim your spot</div>
        <h2>{source === "walk_in" ? "Register here, then show your QR" : "Get your free food pass"}</h2>
        <p className="muted">Takes about 15 seconds. Your QR appears right after you register.</p>
        <RegistrationForm
          eventSlug={event.slug}
          clubs={clubs.map(({ name, slug }) => ({ name, slug }))}
          selectedClub={selectedClub ? { name: selectedClub.name, slug: selectedClub.slug } : null}
          source={source}
        />
      </section>
    </main>
  );
}
