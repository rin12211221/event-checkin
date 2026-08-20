"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearAdminSession, requireAdmin, setAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

function cleanPhone(value: string) {
  return value.replace(/\D/g, "");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function loginAdmin(pin: string) {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return { ok: false, error: "ADMIN_PIN is not configured." };
  if (pin !== expected) return { ok: false, error: "Incorrect PIN." };
  await setAdminSession();
  return { ok: true };
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function registerForEvent(input: {
  eventSlug: string;
  name: string;
  phone: string;
  clubSlug?: string;
  source: "club_link" | "walk_in" | "direct";
}) {
  const db = getDb();
  const name = input.name.trim();
  const phone = cleanPhone(input.phone);

  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (phone.length < 7) return { ok: false, error: "Enter a valid phone number." };

  const { data: event, error: eventError } = await db
    .from("events")
    .select("id, slug")
    .eq("slug", input.eventSlug)
    .maybeSingle();
  if (eventError) throw eventError;
  if (!event) return { ok: false, error: "Event not found." };

  const { data: existing, error: existingError } = await db
    .from("registrations")
    .select("checkin_token")
    .eq("event_id", event.id)
    .eq("phone", phone)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    return { ok: true, token: existing.checkin_token as string, duplicate: true };
  }

  let clubId: string | null = null;
  if (input.clubSlug) {
    const { data: club, error: clubError } = await db
      .from("clubs")
      .select("id")
      .eq("event_id", event.id)
      .eq("slug", input.clubSlug)
      .maybeSingle();
    if (clubError) throw clubError;
    clubId = club?.id ?? null;
  }

  const token = randomUUID();
  const { error } = await db.from("registrations").insert({
    event_id: event.id,
    club_id: clubId,
    name,
    phone,
    source: input.source,
    checkin_token: token
  });

  if (error?.code === "23505") {
    const { data: duplicate } = await db
      .from("registrations")
      .select("checkin_token")
      .eq("event_id", event.id)
      .eq("phone", phone)
      .single();
    return { ok: true, token: duplicate.checkin_token as string, duplicate: true };
  }
  if (error) throw error;

  revalidatePath(`/admin/events/${event.id}`);
  return { ok: true, token, duplicate: false };
}

export async function createEvent(input: {
  name: string;
  restaurantName: string;
  offer: string;
  locationName: string;
  address: string;
  dateLabel: string;
}) {
  await requireAdmin();
  const db = getDb();
  const slug = `${slugify(input.name)}-${Date.now().toString().slice(-5)}`;
  const { data, error } = await db
    .from("events")
    .insert({
      slug,
      name: input.name.trim(),
      restaurant_name: input.restaurantName.trim(),
      offer: input.offer.trim(),
      location_name: input.locationName.trim(),
      address: input.address.trim(),
      date_label: input.dateLabel.trim()
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true, id: data.id as string };
}

export async function createClub(eventId: string, name: string) {
  await requireAdmin();
  const db = getDb();
  const cleanName = name.trim();
  const slug = slugify(cleanName);
  if (!cleanName || !slug) return { ok: false, error: "Enter a club name." };
  const { error } = await db.from("clubs").insert({ event_id: eventId, name: cleanName, slug });
  if (error?.code === "23505") return { ok: false, error: "That club already exists." };
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}

function normalizeScannedToken(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("upswell-checkin:")) return trimmed.slice("upswell-checkin:".length);
  try {
    const url = new URL(trimmed);
    const token = url.pathname.split("/").filter(Boolean).at(-1);
    return token ?? trimmed;
  } catch {
    return trimmed;
  }
}

export async function checkInToken(eventId: string, rawToken: string) {
  await requireAdmin();
  const db = getDb();
  const token = normalizeScannedToken(rawToken);
  const { data: registration, error } = await db
    .from("registrations")
    .select("id, name, phone, checked_in_at, club:clubs(name)")
    .eq("event_id", eventId)
    .eq("checkin_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!registration) return { ok: false, status: "not_found" as const };

  const clubRaw = registration.club as unknown;
  const club = Array.isArray(clubRaw)
    ? ((clubRaw[0] as { name?: string } | undefined)?.name ?? null)
    : ((clubRaw as { name?: string } | null)?.name ?? null);

  if (registration.checked_in_at) {
    return {
      ok: true,
      status: "already" as const,
      name: registration.name as string,
      club,
      checkedInAt: registration.checked_in_at as string
    };
  }

  const checkedInAt = new Date().toISOString();
  const { error: updateError } = await db
    .from("registrations")
    .update({ checked_in_at: checkedInAt, checkin_method: "qr" })
    .eq("id", registration.id);
  if (updateError) throw updateError;
  revalidatePath(`/admin/events/${eventId}`);

  return {
    ok: true,
    status: "checked_in" as const,
    name: registration.name as string,
    club,
    checkedInAt
  };
}

export async function manualLookup(eventId: string, query: string) {
  await requireAdmin();
  const db = getDb();
  const clean = query.replace(/[,%()]/g, "").trim();
  if (clean.length < 2) return [];
  const digits = cleanPhone(clean);
  const filters = [`name.ilike.%${clean}%`];
  if (digits) filters.push(`phone.ilike.%${digits}%`);

  const { data, error } = await db
    .from("registrations")
    .select("id, name, phone, checked_in_at, club:clubs(name)")
    .eq("event_id", eventId)
    .or(filters.join(","))
    .limit(8);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const clubRaw = row.club as unknown;
    const club = Array.isArray(clubRaw)
      ? ((clubRaw[0] as { name?: string } | undefined)?.name ?? null)
      : ((clubRaw as { name?: string } | null)?.name ?? null);
    return {
      id: row.id as string,
      name: row.name as string,
      phone: row.phone as string,
      club,
      checkedInAt: row.checked_in_at as string | null
    };
  });
}

export async function checkInByRegistrationId(eventId: string, registrationId: string) {
  await requireAdmin();
  const db = getDb();
  const { data: registration, error } = await db
    .from("registrations")
    .select("id, name, checked_in_at, club:clubs(name)")
    .eq("event_id", eventId)
    .eq("id", registrationId)
    .maybeSingle();
  if (error) throw error;
  if (!registration) return { ok: false, error: "Registration not found." };

  const clubRaw = registration.club as unknown;
  const club = Array.isArray(clubRaw)
    ? ((clubRaw[0] as { name?: string } | undefined)?.name ?? null)
    : ((clubRaw as { name?: string } | null)?.name ?? null);
  if (registration.checked_in_at) {
    return { ok: true, status: "already" as const, name: registration.name as string, club };
  }

  const checkedInAt = new Date().toISOString();
  const { error: updateError } = await db
    .from("registrations")
    .update({ checked_in_at: checkedInAt, checkin_method: "manual" })
    .eq("id", registration.id);
  if (updateError) throw updateError;
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true, status: "checked_in" as const, name: registration.name as string, club };
}
