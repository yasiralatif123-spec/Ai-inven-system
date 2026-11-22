import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic UI guard only. The backend remains the real security layer and
 * enforces authentication/authorization when AUTH_ENFORCEMENT is enabled.
 *
 * This redirect is controlled by NEXT_PUBLIC_AUTH_GUARD so the existing UI can
 * keep working while backend enforcement is still rolled out.
 */
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function hasAuthCookie(request: NextRequest) {
  const accessName = process.env.ACCESS_COOKIE_NAME || "accessToken";
  const refreshName = process.env.REFRESH_COOKIE_NAME || "refreshToken";
  return Boolean(request.cookies.get(accessName) || request.cookies.get(refreshName));
}

export function proxy(request: NextRequest) {
  const authGuardEnabled = process.env.NEXT_PUBLIC_AUTH_GUARD === "true";
  if (!authGuardEnabled) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (hasAuthCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("reason", "session_expired");
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
