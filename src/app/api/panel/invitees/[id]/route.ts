import { randomBytes } from "node:crypto";

import { requirePanelSession } from "@/lib/panel-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "Supabase is not connected." }, { status: 503 });
  }
  const { id } = await params;
  const body = await request.json();
  const fullName = String(body.full_name || "").trim().slice(0, 100);
  if (fullName.length < 2) {
    return Response.json({ error: "Full name is required." }, { status: 400 });
  }
  const updates = {
    full_name: fullName,
    phone: String(body.phone || "").trim() || null,
    pax_allowed: Math.min(10, Math.max(1, Number(body.pax_allowed) || 1)),
    notes: String(body.notes || "").trim() || null,
    ...(body.rotateToken === true
      ? { access_token: randomBytes(24).toString("hex") }
      : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("invitees")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error?.code === "23505") {
    return Response.json(
      { error: "An invitee with this full name already exists." },
      { status: 409 },
    );
  }
  if (error) return Response.json({ error: "Unable to update invitee." }, { status: 500 });
  return Response.json({ invitee: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "Supabase is not connected." }, { status: 503 });
  }
  const { id } = await params;
  const { error } = await supabase.from("invitees").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
