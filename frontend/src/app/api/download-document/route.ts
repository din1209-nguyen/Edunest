import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function sanitizeFilename(value: string | null) {
  const fallback = "tai-lieu-bai-hoc.pdf";
  if (!value) return fallback;

  const safe = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/(^-+|-+$)/g, "");

  return safe || fallback;
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("url");
  const filename = sanitizeFilename(request.nextUrl.searchParams.get("filename"));

  if (!sourceUrl) {
    return NextResponse.json({ message: "Missing document URL" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ message: "Invalid document URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ message: "Unsupported document URL" }, { status: 400 });
  }

  const response = await fetch(parsedUrl, { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json({ message: "Cannot download document" }, { status: response.status });
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
