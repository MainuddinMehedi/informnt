import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

function handleRevalidate(
  req: NextRequest,
  tag: string | null,
  secret: string | null,
) {
  const serverSecret = process.env.REVALIDATE_SECRET;

  const providedSecret =
    secret ||
    req.headers.get("x-revalidate-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!serverSecret || providedSecret !== serverSecret) {
    return NextResponse.json(
      { error: "Invalid secret or REVALIDATE_SECRET not configured on server" },
      { status: 401 },
    );
  }

  if (!tag) {
    return NextResponse.json(
      { error: "Missing tag parameter" },
      { status: 400 },
    );
  }

  revalidateTag(tag, "max");

  return NextResponse.json({
    revalidated: true,
    tag,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");
  const secret = searchParams.get("secret");
  return handleRevalidate(req, tag, secret);
}

export async function POST(req: NextRequest) {
  let tag: string | null = null;
  let secret: string | null = null;

  try {
    const body = await req.json();
    tag = body.tag || null;
    secret = body.secret || null;
  } catch {
    const { searchParams } = req.nextUrl;
    tag = searchParams.get("tag");
    secret = searchParams.get("secret");
  }

  return handleRevalidate(req, tag, secret);
}
