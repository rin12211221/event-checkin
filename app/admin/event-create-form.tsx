"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { createEvent } from "@/app/actions";

export function EventCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      const result = await createEvent({
        name: String(form.get("name") ?? ""),
        restaurantName: String(form.get("restaurantName") ?? ""),
        offer: String(form.get("offer") ?? ""),
        locationName: String(form.get("locationName") ?? ""),
        address: String(form.get("address") ?? ""),
        dateLabel: String(form.get("dateLabel") ?? "")
      });
      if (!result.ok || !result.id) return setError(result.error ?? "Could not create event.");
      router.push(`/admin/events/${result.id}`);
    });
  }

  return (
    <form className="stack-form compact-form" onSubmit={submit}>
      <label>Event name<input name="name" placeholder="SJSU Free Food Night" required /></label>
      <label>Restaurant<input name="restaurantName" placeholder="Restaurant name" required /></label>
      <label>Offer<input name="offer" placeholder="Free entrée for registered students" required /></label>
      <label>Date & time<input name="dateLabel" placeholder="Thursday · 6:00–8:00 PM" required /></label>
      <label>Location name<input name="locationName" placeholder="Restaurant / venue" required /></label>
      <label>Address<input name="address" placeholder="123 Main St, San Jose, CA" required /></label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="button button-primary" disabled={pending}>{pending ? "Creating…" : "Create event"}</button>
    </form>
  );
}
