import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase isn't configured, block all protected routes
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const isDashboardRoute =
      request.nextUrl.pathname.startsWith("/kanban") ||
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/insights");
    const isApiRoute = request.nextUrl.pathname.startsWith("/api/ai");

    // Block protected routes when Supabase is not configured
    if (isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 503 }
      );
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: don't remove this
  // getUser() validates the token server-side (not just getSession which trusts the JWT)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route classification
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/forgot-password");
  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/kanban") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/insights");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/ai");

  // Protect dashboard routes — redirect unauthenticated users to login
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect API routes — return 401 for unauthenticated requests
  if (!user && isApiRoute) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  // Redirect authenticated users away from auth pages (except new-password which is used during recovery)
  if (user && isAuthRoute && !request.nextUrl.pathname.startsWith("/new-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/kanban";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
