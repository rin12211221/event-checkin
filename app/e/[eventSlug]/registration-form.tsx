"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { registerForEvent } from "@/app/actions";

export function RegistrationForm({
  eventSlug,
  clubs,
  selectedClub,
  source
}: {
  eventSlug: string;
  clubs: { name: string; slug: string }[];
  selectedClub: { name: string; slug: string } | null;
  source: "club_link" | "walk_in" | "direct";
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await registerForEvent({
          eventSlug,
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          clubSlug: selectedClub?.slug ?? String(form.get("club") ?? "") || undefined,
          source
        });

        if (!result.ok || !result.token) {
          setError(result.error ?? "Could not register. Try again.");
          return;
        }
        router.push(`/e/${eventSlug}/pass/${result.token}`);
      } catch {
        setError("Could not register right now. Please try again.");
      }
    });
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      {selectedClub ? (
        <div className="club-invite"><CheckCircle2 size={18} /> Invited through <strong>{selectedClub.name}</strong></div>
      ) : clubs.length > 0 ? (
        <label>
          Club <span className="optional">optional</span>
          <select name="club" defaultValue="">
            <option value="">Select your club</option>
            {clubs.map((club) => <option key={club.slug} value={club.slug}>{club.name}</option>)}
          </select>
        </label>
      ) : null}

      <label>
        Name
        <input name="name" autoComplete="name" placeholder="Your name" required />
      </label>
      <label>
        Phone number
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(408) 555-1234" required />
      </label>
      <p className="privacy-note">We use your number only to identify this event registration. Registering does not opt you into marketing texts.</p>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="button button-primary button-large" disabled={isPending}>
        {isPending ? "Creating your pass…" : "Get my pass"}
        {!isPending && <ArrowRight size={19} />}
      </button>
    </form>
  );
}
