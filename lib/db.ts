import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type EventRecord = {
  id: string;
  slug: string;
  name: string;
  restaurant_name: string;
  offer: string;
  location_name: string;
  address: string;
  date_label: string;
  created_at: string;
};

export type ClubRecord = {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type RegistrationRecord = {
  id: string;
  event_id: string;
  club_id: string | null;
  name: string;
  phone: string;
  source: "club_link" | "walk_in" | "direct";
  checkin_token: string;
  checked_in_at: string | null;
  checkin_method: "qr" | "manual" | null;
  created_at: string;
  club?: { name: string; slug: string } | null;
};

let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return client;
}

export async function getEventBySlug(slug: string) {
  const db = getDb();
  const { data, error } = await db
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as EventRecord | null;
}

export async function getEventById(id: string) {
  const db = getDb();
  const { data, error } = await db
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as EventRecord | null;
}

export async function getEvents() {
  const db = getDb();
  const { data, error } = await db
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export async function getClubs(eventId: string) {
  const db = getDb();
  const { data, error } = await db
    .from("clubs")
    .select("*")
    .eq("event_id", eventId)
    .order("name");

  if (error) throw error;
  return (data ?? []) as ClubRecord[];
}

export async function getRegistrationByToken(token: string) {
  const db = getDb();
  const { data, error } = await db
    .from("registrations")
    .select("*, club:clubs(name, slug)")
    .eq("checkin_token", token)
    .maybeSingle();

  if (error) throw error;
  return data as RegistrationRecord | null;
}

export async function getRegistrations(eventId: string) {
  const db = getDb();
  const { data, error } = await db
    .from("registrations")
    .select("*, club:clubs(name, slug)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RegistrationRecord[];
}
