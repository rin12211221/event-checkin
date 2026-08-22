const DEFAULT_BACKEND_URL = "https://internal-api-backend-production.up.railway.app";
export const DEFAULT_CAMPAIGN_ID =
  process.env.NEXT_PUBLIC_DEFAULT_CAMPAIGN_ID ??
  "ad39123e-4c58-46b2-b03b-2bab8ce8da67";

const APP_URL = "https://app.upswell.ai";

function backendUrl() {
  const raw =
    process.env.BACKEND_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
    DEFAULT_BACKEND_URL;
  return raw.replace(/\/+$/, "");
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Upswell API ${response.status}${text ? `: ${text.slice(0, 240)}` : ""}`,
    );
  }

  const payload = (await response.json()) as
    | T
    | { data?: T; result?: T };
  if (payload && typeof payload === "object") {
    if ("data" in payload && payload.data !== undefined) return payload.data;
    if ("result" in payload && payload.result !== undefined) return payload.result;
  }
  return payload as T;
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${backendUrl()}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  return parseApiResponse<T>(response);
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${backendUrl()}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseApiResponse<T>(response);
}

export type Campaign = {
  marketing_campaign_id: string;
  promotion_id: string | null;
  venue_id: string;
  venue_name: string;
  venue_address: {
    street1: string;
    street2?: string | null;
    city: string;
    state: string;
    zip_code: string;
  };
  campaign_status: string | null;
  campaign_starts_at: string | null;
  campaign_ends_at: string | null;
  event: {
    title: string;
    event_starts_at: string | null;
    event_ends_at: string | null;
    days: Array<{
      event_date: string;
      start_time: string | null;
      end_time: string | null;
    }>;
  } | null;
  ambassador_program: {
    ambassador_count: number;
    reward_structure: string;
    milestone_reward_text: string | null;
    tier_reward_text: string | null;
  } | null;
  ambassador_slots: {
    max_slots: number;
    current_ambassadors: number;
    remaining_slots: number;
  };
};

export type Ambassador = {
  id: string;
  user_id: string;
  venue_id: string;
  venue_name: string;
  cohort_id: string;
  ambassador_code: string;
  public_name: string;
  status: string;
  joined_at: string;
  total_invites: number;
  current_stamps: number;
};

type AmbassadorReferee = {
  user_id: string;
  registered_at: string;
};

type AmbassadorDetailResponse = {
  ambassador: Ambassador;
  referees: AmbassadorReferee[];
};

type RefereeListItem = {
  user_id: string;
  name: string;
  venue_name: string;
  referrer_user_id: string;
  referrer_name: string;
  ambassador_code: string;
  phone_number?: string | null;
  email?: string | null;
  voucher_status?: string | null;
  voucher_created_at?: string | null;
};

export type RefereeAttendance = {
  registration_id: string;
  user_id: string;
  ambassador_id: string;
  ambassador_code: string;
  registered_at: string;
  checked_in_at: string | null;
  check_in_method: string | null;
};

export type RefereeCheckInResponse = {
  status: "checked_in" | "already";
  registration_id: string;
  user_id: string;
  ambassador_code: string;
  checked_in_at: string;
  check_in_method: string | null;
};

export type CampaignRegistrant = {
  registrationId: string | null;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  ambassadorCode: string;
  ambassadorName: string;
  registeredAt: string | null;
  checkedInAt: string | null;
  checkInMethod: string | null;
};

export type CampaignDashboard = {
  campaign: Campaign;
  ambassadors: Ambassador[];
  registrants: CampaignRegistrant[];
  attendanceConnected: boolean;
};

export function eventRsvpUrl(campaignId: string) {
  return `${APP_URL}/invitations/${campaignId}`;
}

export function promotionUrl(campaignId: string) {
  return `${APP_URL}/promotions/${campaignId}`;
}

export function ambassadorInviteUrl(code: string) {
  return `${APP_URL}/i/${encodeURIComponent(code)}`;
}

export function refereeQrValue(userId: string) {
  return `upswell-referee:${userId}`;
}

export function refereeUserIdFromQr(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("upswell-referee:")) {
    return trimmed.slice("upswell-referee:".length).trim() || null;
  }

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("user_id") ?? url.searchParams.get("userId");
    if (fromQuery) return fromQuery.trim() || null;
  } catch {
    // A raw opaque user id is also accepted for backwards-compatible staff tools.
  }

  return trimmed;
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  return apiGet<Campaign>(
    `/marketing-campaign-events/${encodeURIComponent(campaignId)}`,
  );
}

export async function getCampaignAmbassadors(
  campaignId: string,
): Promise<Ambassador[]> {
  return apiGet<Ambassador[]>(
    `/internal/marketing-campaigns/${encodeURIComponent(campaignId)}/ambassadors`,
  );
}

export async function getCampaignRefereeAttendance(
  campaignId: string,
): Promise<RefereeAttendance[]> {
  return apiGet<RefereeAttendance[]>(
    `/internal/marketing-campaigns/${encodeURIComponent(campaignId)}/referees/attendance`,
  );
}

export async function checkInCampaignReferee(
  campaignId: string,
  userId: string,
  method: "qr" | "manual",
): Promise<RefereeCheckInResponse> {
  return apiPost<RefereeCheckInResponse>(
    `/internal/marketing-campaigns/${encodeURIComponent(campaignId)}/referees/${encodeURIComponent(userId)}/check-in`,
    { method },
  );
}

async function getAmbassadorDetail(
  ambassadorId: string,
): Promise<AmbassadorDetailResponse> {
  return apiGet<AmbassadorDetailResponse>(
    `/internal/ambassadors/${encodeURIComponent(ambassadorId)}`,
  );
}

async function getRefereesForCohort(cohortId: string) {
  const rows: RefereeListItem[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetch(
      `${backendUrl()}/internal/referees?cohort_id=${encodeURIComponent(cohortId)}&page=${page}&limit=100`,
      { cache: "no-store", headers: { Accept: "application/json" } },
    );
    const data = await parseApiResponse<RefereeListItem[]>(response);
    rows.push(...data);
    const hasMore = response.headers.get("x-has-more") === "true";
    if (!hasMore && data.length < 100) break;
  }
  return rows;
}

export async function getCampaignDashboard(
  campaignId: string,
): Promise<CampaignDashboard> {
  const [campaign, ambassadors, attendanceResult] = await Promise.all([
    getCampaign(campaignId),
    getCampaignAmbassadors(campaignId),
    getCampaignRefereeAttendance(campaignId)
      .then((rows) => ({ rows, connected: true as const }))
      .catch(() => ({ rows: [] as RefereeAttendance[], connected: false as const })),
  ]);

  if (ambassadors.length === 0) {
    return {
      campaign,
      ambassadors: [],
      registrants: [],
      attendanceConnected: attendanceResult.connected,
    };
  }

  const details = await Promise.all(
    ambassadors.map((ambassador) =>
      getAmbassadorDetail(ambassador.id).catch(() => null),
    ),
  );

  const cohorts = [
    ...new Set(ambassadors.map((row) => row.cohort_id).filter(Boolean)),
  ];
  const refereePages = await Promise.all(
    cohorts.map((cohort) => getRefereesForCohort(cohort).catch(() => [])),
  );
  const ambassadorCodes = new Set(
    ambassadors.map((row) => row.ambassador_code),
  );
  const refereeRows = refereePages
    .flat()
    .filter((row) => ambassadorCodes.has(row.ambassador_code));

  const publicByKey = new Map(
    refereeRows.map((row) => [`${row.ambassador_code}:${row.user_id}`, row]),
  );
  const attendanceByKey = new Map<string, RefereeAttendance>();
  for (const row of attendanceResult.rows) {
    const key = `${row.ambassador_code}:${row.user_id}`;
    if (!attendanceByKey.has(key)) attendanceByKey.set(key, row);
  }

  const registrants: CampaignRegistrant[] = [];
  const seen = new Set<string>();

  for (const detail of details) {
    if (!detail) continue;
    const code = detail.ambassador.ambassador_code;
    for (const referee of detail.referees ?? []) {
      const key = `${code}:${referee.user_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const publicRow = publicByKey.get(key);
      const attendance = attendanceByKey.get(key);
      registrants.push({
        registrationId: attendance?.registration_id ?? null,
        userId: referee.user_id,
        name: publicRow?.name || "Registered student",
        phone: publicRow?.phone_number ?? null,
        email: publicRow?.email ?? null,
        ambassadorCode: code,
        ambassadorName:
          publicRow?.referrer_name ||
          detail.ambassador.public_name ||
          "Ambassador",
        registeredAt:
          attendance?.registered_at ?? referee.registered_at ?? null,
        checkedInAt: attendance?.checked_in_at ?? null,
        checkInMethod: attendance?.check_in_method ?? null,
      });
    }
  }

  for (const row of refereeRows) {
    const key = `${row.ambassador_code}:${row.user_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const attendance = attendanceByKey.get(key);
    registrants.push({
      registrationId: attendance?.registration_id ?? null,
      userId: row.user_id,
      name: row.name || "Registered student",
      phone: row.phone_number ?? null,
      email: row.email ?? null,
      ambassadorCode: row.ambassador_code,
      ambassadorName: row.referrer_name || "Ambassador",
      registeredAt:
        attendance?.registered_at ?? row.voucher_created_at ?? null,
      checkedInAt: attendance?.checked_in_at ?? null,
      checkInMethod: attendance?.check_in_method ?? null,
    });
  }

  for (const attendance of attendanceResult.rows) {
    const key = `${attendance.ambassador_code}:${attendance.user_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const ambassador = ambassadors.find(
      (row) => row.ambassador_code === attendance.ambassador_code,
    );
    registrants.push({
      registrationId: attendance.registration_id,
      userId: attendance.user_id,
      name: "Registered student",
      phone: null,
      email: null,
      ambassadorCode: attendance.ambassador_code,
      ambassadorName: ambassador?.public_name || "Ambassador",
      registeredAt: attendance.registered_at,
      checkedInAt: attendance.checked_in_at,
      checkInMethod: attendance.check_in_method,
    });
  }

  registrants.sort((a, b) =>
    (b.registeredAt ?? "").localeCompare(a.registeredAt ?? ""),
  );

  return {
    campaign,
    ambassadors,
    registrants,
    attendanceConnected: attendanceResult.connected,
  };
}
