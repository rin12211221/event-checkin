"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClub } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";

export function ClubManager({
  eventId,
  eventSlug,
  clubs,
  appUrl
}: {
  eventId: string;
  eventSlug: string;
  clubs: { id: string; name: string; slug: string }[];
  appUrl: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    startTransition(async () => {
      const result = await createClub(eventId, String(data.get("club") ?? ""));
      if (!result.ok) return setError(result.error ?? "Could not add club.");
      form.reset();
      router.refresh();
    });
  }

  return (
    <div className="club-manager">
      <form className="inline-form" onSubmit={submit}>
        <input name="club" placeholder="Add club, e.g. KASA" required />
        <button className="button button-secondary" disabled={pending}><Plus size={17} /> Add</button>
      </form>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="club-link-list">
        {clubs.length === 0 ? <div className="empty-mini">Add clubs to create tracked links.</div> : clubs.map((club) => {
          const url = `${appUrl}/e/${eventSlug}?club=${club.slug}`;
          return <div className="club-link-row" key={club.id}><div><strong>{club.name}</strong><span>{club.slug}</span></div><CopyButton value={url} /></div>;
        })}
      </div>
    </div>
  );
}
