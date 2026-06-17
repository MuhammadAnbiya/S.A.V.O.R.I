import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session (important for keeping auth tokens valid)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Define auth pages (login, register) that should be accessible without session
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Protect root and dashboard pages
  const isProtected = pathname === "/" || pathname.startsWith("/dashboard");

  if (isProtected && !user && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in and visits auth pages, redirect to dashboard
  if (isAuthPage && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/overview";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Configure proxy to run on specific paths
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};
