import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  const { pathname, search } = req.nextUrl;

  // 1. Ignore Next.js internals, API routes, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Subdomain routing: fideliza.socialpilot.cl -> /fideliza/...
  if (host.startsWith("fideliza.")) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/fideliza";
      return NextResponse.rewrite(url);
    }
    if (!pathname.startsWith("/fideliza")) {
      const url = req.nextUrl.clone();
      url.pathname = `/fideliza${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 3. Redirect legacy rrss.santisoft.cl -> socialpilot.cl
  if (host.startsWith("rrss.santisoft.cl")) {
    return NextResponse.redirect(`https://socialpilot.cl${pathname}${search}`, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
