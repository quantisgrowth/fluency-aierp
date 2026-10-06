type AccessSnapshot = {
  userId: string;
  schoolRoles?: string[];
  platformAdmin?: boolean;
  expiresAt: number;
};

let snapshot: AccessSnapshot | null = null;
const ACCESS_CACHE_TTL_MS = 60_000;

export function rememberSchoolAccess(userId: string, schoolRoles: string[]) {
  snapshot = {
    userId,
    schoolRoles,
    expiresAt: Date.now() + ACCESS_CACHE_TTL_MS,
  };
}

export function rememberPlatformAccess(userId: string, platformAdmin: boolean) {
  snapshot = {
    userId,
    platformAdmin,
    expiresAt: Date.now() + ACCESS_CACHE_TTL_MS,
  };
}

export function readAccessSnapshot() {
  if (!snapshot || snapshot.expiresAt <= Date.now()) {
    snapshot = null;
    return null;
  }
  return snapshot;
}

export function clearAccessSnapshot() {
  snapshot = null;
}
