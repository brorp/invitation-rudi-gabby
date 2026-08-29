import { randomBytes } from "node:crypto";

import { slugifyGuestName } from "@/lib/data";
import { requirePanelSession } from "@/lib/panel-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ invitees: [], configured: false });
  }
  const { data, error } = await supabase
    .from("invitees")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ invitees: data, configured: true });
}

export async function POST(request: Request) {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json(
      { error: "Connect Supabase before adding invitees." },
      { status: 503 },
    );
  }
  const body = await request.json();
  const fullName = String(body.full_name || "").trim().slice(0, 100);
  const paxAllowed = Math.min(10, Math.max(1, Number(body.pax_allowed) || 1));
  if (fullName.length < 2) {
    return Response.json({ error: "Full name is required." }, { status: 400 });
  }
  const accessToken = randomBytes(24).toString("hex");
  const { data, error } = await supabase
    .from("invitees")
    .insert({
      full_name: fullName,
      slug: `${slugifyGuestName(fullName)}-${accessToken.slice(0, 8)}`,
      access_token: accessToken,
      phone: String(body.phone || "").trim() || null,
      pax_allowed: paxAllowed,
      status: "pending",
      notes: String(body.notes || "").trim() || null,
    })
    .select("*")
    .single();
  if (error?.code === "23505") {
    return Response.json(
      { error: "An invitee with this full name already exists." },
      { status: 409 },
    );
  }
  if (error) return Response.json({ error: "Unable to add invitee." }, { status: 500 });
  return Response.json({ invitee: data }, { status: 201 });
}
