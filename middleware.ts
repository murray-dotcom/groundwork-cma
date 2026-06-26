import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(name: string, value: string, options: any) {
          req.cookies.set(name, value);
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set(name, value, options);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        remove(name: string, options: any) {
          req.cookies.set(name, "");
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (
    !session &&
    !req.nextUrl.pathname.startsWith("/login") &&
    !req.nextUrl.pathname.startsWith("/auth")
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session?.user?.email && !session.user.email.endsWith("@homegroundestates.co.za")) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
};
