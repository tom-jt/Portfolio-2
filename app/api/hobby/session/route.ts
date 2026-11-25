import { isAdmin } from "@/lib/hobby/auth";

/**
 * Whether the visitor is the signed-in admin. The hobby pages are static and
 * cached for everyone, so they ask here after loading instead of reading the
 * cookie while rendering.
 */
export async function GET() {
  return Response.json(
    { admin: await isAdmin() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
