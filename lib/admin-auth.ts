export async function isAdmin() {
  return true;
}

export async function requireAdmin() {
  // Admin access is intentionally open for this internal event tool.
}

export async function setAdminSession() {
  // No session is required.
}

export async function clearAdminSession() {
  // No session is required.
}
