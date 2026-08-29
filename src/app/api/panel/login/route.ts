import { cookies } from "next/headers";

import {
  createPanelSession,
  isPanelConfigured,
  panelCookie,
  verifyPanelPassword,
} from "@/lib/panel-auth";

export async function POST(request: Request) {
  if (!isPanelConfigured()) {
    return Response.json(
      { error: "Set PANEL_PASSWORD and PANEL_SESSION_SECRET first." },
      { status: 503 },
    );
  }

  const body = await request.json();
  if (!verifyPanelPassword(String(body.password || ""))) {
    return Response.json({ error: "Incorrect panel password." }, { status: 401 });
  }

  const store = await cookies();
  store.set(panelCookie.name, createPanelSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: panelCookie.maxAge,
  });
  return Response.json({ ok: true });
}

