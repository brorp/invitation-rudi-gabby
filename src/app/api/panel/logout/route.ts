import { cookies } from "next/headers";

import { panelCookie } from "@/lib/panel-auth";

export async function POST() {
  const store = await cookies();
  store.delete(panelCookie.name);
  return Response.json({ ok: true });
}

