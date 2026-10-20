import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guard + Supabase session refresh.
 *
 * Every private twin route requires either a demo cookie (PoC) or a valid
 * Supabase session. Refreshing here keeps `auth.getUser()` cheap in Server
 * Components, which cannot write cookies themselves.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/vitals",
  "/insights",
  "/timeline",
  "/profile",
  "/clinician",
  "/import",
  "/validation",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

  let hasSession = request.cookies.get("vitatwin_demo")?.value === "1";

  if (supabaseReady) {
    const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // Validates the JWT against Supabase (not just the cookie) and rotates
    // expired access tokens.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      hasSession = true;
    }
  }

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vitals/:path*",
    "/insights/:path*",
    "/timeline/:path*",
    "/profile/:path*",
    "/clinician/:path*",
    "/import/:path*",
    "/validation/:path*",
  ],
};
