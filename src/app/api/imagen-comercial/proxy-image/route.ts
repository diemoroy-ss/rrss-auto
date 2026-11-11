import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isSafeImageProxyUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname.toLowerCase();
    // Block localhost, loopback, link-local, metadata, and private IP ranges (SSRF protection)
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host === "0.0.0.0" ||
      host === "[::1]"
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }
  if (!isSafeImageProxyUrl(url)) {
    return NextResponse.json({ error: "URL no permitida" }, { status: 403 });
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Error cargando imagen (${res.status})` }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/") && !contentType.startsWith("application/octet-stream")) {
      return NextResponse.json({ error: "El recurso solicitado no es una imagen válida" }, { status: 415 });
    }
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("[proxy-image] Error:", err);
    return NextResponse.json({ error: err.message || "Error al solicitar la imagen remota" }, { status: 500 });
  }
}
