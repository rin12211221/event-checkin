import Link from "next/link";
import { ExternalLink, RefreshCw, Users } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import {
  ambassadorInviteUrl,
  DEFAULT_CAMPAIGN_ID,
  eventRsvpUrl,
  getCampaignDashboard,
  promotionUrl,
} from "@/lib/upswell";
import { CampaignRegistrationTable } from "./campaign-registration-table";

export const dynamic = "force-dynamic";

function formatDay(date: string, time: string | null) {
  const parsed = new Date(`${date}T${time || "00:00:00"}`);
  if (Number.isNaN(parsed.getTime())) return `${date}${time ? ` ${time}` : ""}`;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(time
      ? ({ hour: "numeric", minute: "2-digit" } as const)
      : {}),
  });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const params = await searchParams;
  const campaignId = params.campaign?.trim() || DEFAULT_CAMPAIGN_ID;

  let dashboard;
  try {
    dashboard = await getCampaignDashboard(campaignId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown API error";
    return (
      <main className="admin-shell">
        <header className="admin-header">
          <div>
            <div className="brand-pill">UPSWELL · CHECK-IN</div>
            <h1>Campaign connection</h1>
            <p>The check-in tool could not load this Upswell campaign yet.</p>
          </div>
        </header>
        <section className="panel campaign-error-panel">
          <div className="section-kicker">Campaign ID</div>
          <h2>{campaignId}</h2>
          <p>{message}</p>
          <div className="campaign-actions">
            <Link
              className="button button-secondary"
              href={eventRsvpUrl(campaignId)}
              target="_blank"
            >
              Open RSVP page <ExternalLink size={16} />
            </Link>
            <Link className="button button-primary" href="/admin">
              Retry <RefreshCw size={16} />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { campaign, ambassadors, registrants } = dashboard;
  const address = [
    campaign.venue_address.street1,
    campaign.venue_address.city,
    `${campaign.venue_address.state} ${campaign.venue_address.zip_code}`,
  ].join(", ");

  return (
    <main className="admin-shell wide">
      <header className="admin-header campaign-admin-header">
        <div>
          <div className="brand-pill">UPSWELL · CHECK-IN</div>
          <h1>{campaign.event?.title || campaign.venue_name}</h1>
          <p>
            {campaign.venue_name} · {address}
          </p>
        </div>
        <div className="campaign-actions">
          <Link
            className="button button-secondary"
            href={promotionUrl(campaignId)}
            target="_blank"
          >
            Upswell campaign <ExternalLink size={16} />
          </Link>
          <Link
            className="button button-primary"
            href={eventRsvpUrl(campaignId)}
            target="_blank"
          >
            Event RSVP page <ExternalLink size={16} />
          </Link>
        </div>
      </header>

      <section className="campaign-source-bar">
        <div>
          <span>Connected campaign</span>
          <strong>{campaignId}</strong>
        </div>
        <form action="/admin" method="get" className="campaign-switcher">
          <input
            name="campaign"
            placeholder="Paste another marketingCampaignId"
            aria-label="Marketing campaign ID"
          />
          <button type="submit" className="button button-secondary button-small">
            Load
          </button>
        </form>
      </section>

      <section className="stat-grid">
        <div className="stat-card">
          <span>Club / ambassador links</span>
          <strong>{ambassadors.length}</strong>
        </div>
        <div className="stat-card success">
          <span>Students registered</span>
          <strong>{registrants.length}</strong>
        </div>
        <div className="stat-card">
          <span>Ambassador slots left</span>
          <strong>{campaign.ambassador_slots.remaining_slots}</strong>
        </div>
        <div className="stat-card">
          <span>Check-in tracking</span>
          <strong className="stat-text">Next</strong>
        </div>
      </section>

      <section className="event-tools-grid campaign-tools-grid">
        <div className="panel">
          <div className="panel-title">
            <Users size={19} />
            <div>
              <h2>Club invitation links</h2>
              <p>
                Each ambassador code is already tracked by the existing Upswell
                invitation flow.
              </p>
            </div>
          </div>
          <div className="campaign-link-list">
            {ambassadors.length === 0 ? (
              <div className="empty-state">
                No ambassadors have been added to this campaign yet. Add the club
                contacts in Upswell Admin first.
              </div>
            ) : (
              ambassadors.map((ambassador) => {
                const url = ambassadorInviteUrl(ambassador.ambassador_code);
                return (
                  <div className="campaign-link-row" key={ambassador.id}>
                    <div>
                      <strong>{ambassador.public_name}</strong>
                      <span>
                        {ambassador.ambassador_code} · {ambassador.total_invites} registered
                      </span>
                    </div>
                    <div className="campaign-link-actions">
                      <CopyButton value={url} label="Copy link" />
                      <Link
                        href={url}
                        target="_blank"
                        className="button button-ghost button-small"
                      >
                        Open <ExternalLink size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="panel campaign-event-panel">
          <div className="section-kicker">Ambassador event</div>
          <h2>{campaign.event?.title || "Event"}</h2>
          <div className="campaign-slot-list">
            {(campaign.event?.days ?? []).length === 0 ? (
              <p>No event slots configured.</p>
            ) : (
              campaign.event?.days.map((day, index) => (
                <div key={`${day.event_date}-${index}`}>
                  <span>Slot {index + 1}</span>
                  <strong>{formatDay(day.event_date, day.start_time)}</strong>
                </div>
              ))
            )}
          </div>
          <p className="campaign-note">
            Registration data below comes from Upswell’s existing ambassador/referee
            records. QR attendance will be connected to the same campaign next.
          </p>
        </div>
      </section>

      <section className="panel attendance-panel">
        <div className="panel-title">
          <div>
            <h2>Student registrations</h2>
            <p>
              Students who joined through one of this campaign’s ambassador links.
            </p>
          </div>
        </div>
        <CampaignRegistrationTable registrations={registrants} />
      </section>
    </main>
  );
}
