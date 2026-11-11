import { NextRequest, NextResponse } from "next/server";

/**
 * Rutas transversales del ecosistema que nunca deben prefijarse con /menu o /fideliza
 * cuando el usuario navega desde un subdominio hacia su cuenta, panel o landing hermana.
 */
const SHARED_APP_PREFIXES = [
  "/login",
  "/registro",
  "/onboarding",
  "/confirmar-plan",
  "/automatizacion-rrss",
  "/marketing",
  "/menu",
  "/fideliza",
  "/demo-plan-mania",
  "/es",
];

function isSharedAppPath(pathname: string): boolean {
  return SHARED_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

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

  // 2. Subdomain routing: fideliza.socialpilot.cl -> Landing SocialPilot Fideliza
  if (host.startsWith("fideliza.")) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/fideliza";
      return NextResponse.rewrite(url);
    }
    if (pathname === "/panel") {
      const url = req.nextUrl.clone();
      url.pathname = "/automatizacion-rrss/panel/fidelizacion";
      return NextResponse.rewrite(url);
    }
    if (!isSharedAppPath(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = `/fideliza${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 3. Subdomain routing: menu.socialpilot.cl -> Landing SocialPilot Carta QR + Rutas de restaurantes
  if (host.startsWith("menu.")) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/menu";
      return NextResponse.rewrite(url);
    }
    if (pathname === "/panel") {
      const url = req.nextUrl.clone();
      url.pathname = "/automatizacion-rrss/panel/menu-qr";
      return NextResponse.rewrite(url);
    }
    // Permite que menu.socialpilot.cl/AGdJLwdz0QNhBPcRp1FdWWMooAb2___default resuelva a /menu/[id]
    if (!isSharedAppPath(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = `/menu${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 4. Subdomain routing: marketing.socialpilot.cl -> Landing SocialPilot Marketing
  if (host.startsWith("marketing.")) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/marketing";
      return NextResponse.rewrite(url);
    }
    if (pathname === "/panel") {
      const url = req.nextUrl.clone();
      url.pathname = "/automatizacion-rrss/panel";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 5. Subdomain routing: app.socialpilot.cl -> Panel Central del Cliente
  if (host.startsWith("app.")) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/automatizacion-rrss/panel";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 6. Redirect legacy rrss.santisoft.cl -> socialpilot.cl
  if (host.startsWith("rrss.santisoft.cl")) {
    return NextResponse.redirect(`https://socialpilot.cl${pathname}${search}`, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
