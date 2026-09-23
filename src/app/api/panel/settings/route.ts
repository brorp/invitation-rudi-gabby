import { getSiteSettings } from "@/lib/data";
import { requirePanelSession } from "@/lib/panel-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { SiteSettings } from "@/lib/types";

export async function GET() {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ settings: await getSiteSettings() });
}

export async function PUT(request: Request) {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json(
      { error: "Connect Supabase before saving site settings." },
      { status: 503 },
    );
  }
  const body = (await request.json()) as Partial<SiteSettings>;
  if (
    !body.content ||
    !Array.isArray(body.media) ||
    !Array.isArray(body.gallery)
  ) {
    return Response.json({ error: "Invalid site settings." }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("site_settings")
    .upsert({
      id: "main",
      content: body.content,
      media: body.media,
      gallery: body.gallery,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) {
    const message = error.message.toLowerCase().includes("gallery")
      ? "Run the latest supabase/schema.sql before saving gallery settings."
      : error.message;
    return Response.json({ error: message }, { status: 500 });
  }
  return Response.json({ settings: data });
}
