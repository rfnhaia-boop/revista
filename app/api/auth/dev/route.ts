import { DEV_COOKIE_NAME, devAuthEnabled, safeReturnPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Somente desenvolvimento local (DEV_FAKE_USER=1, NODE_ENV != production). */
export async function GET(request: Request) {
  if (!devAuthEnabled()) return new Response("Not found", { status: 404 });
  const url = new URL(request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: safeReturnPath(url.searchParams.get("return_to")),
      "Set-Cookie": `${DEV_COOKIE_NAME}=1; Path=/; HttpOnly; SameSite=Lax`,
      "Cache-Control": "private, no-store",
    },
  });
}
