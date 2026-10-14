import { cookies } from "next/headers";
import { SESSION_COOKIE, clearSessionCookie, destroySession } from "@/lib/auth";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!validOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token).catch(() => {});
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookie(), "Cache-Control": "private, no-store" } },
  );
}
