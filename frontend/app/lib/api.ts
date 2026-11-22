const AUTH_REFRESH_PATH = "/api/auth/refresh";
const AUTH_LOGIN_PATH = "/api/auth/login";
const SESSION_EXPIRED_PATH = "/login?reason=session_expired";

let refreshPromise: Promise<boolean> | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function isAuthEndpoint(path: string) {
  return (
    path === AUTH_REFRESH_PATH ||
    path === AUTH_LOGIN_PATH ||
    path === "/api/auth/logout" ||
    path === "/api/auth/forgot-password" ||
    path === "/api/auth/reset-password" ||
    path === "/api/auth/invites/validate" ||
    path === "/api/auth/invites/accept"
  );
}

function isPublicAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  );
}

function redirectToExpiredSession() {
  if (!isBrowser()) return;
  if (isPublicAuthPath(window.location.pathname)) return;
  // Full navigation intentionally clears client state after session expiry.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload outside React tree
  window.location.href = SESSION_EXPIRED_PATH;
}

async function refreshSession(): Promise<boolean> {
  if (!isBrowser()) return false;
  if (!refreshPromise) {
    refreshPromise = fetch(AUTH_REFRESH_PATH, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const requestInit: RequestInit = {
    ...init,
    credentials: "include",
    headers: init?.headers,
  };

  const response = await fetch(path, requestInit);

  if (
    response.status !== 401 ||
    !isBrowser() ||
    path === AUTH_REFRESH_PATH ||
    isAuthEndpoint(path)
  ) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    redirectToExpiredSession();
    return response;
  }

  return fetch(path, requestInit);
}
