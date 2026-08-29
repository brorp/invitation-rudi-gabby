import { getPublicWishes } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSubmissionFingerprint } from "@/lib/submission-identity";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const limit = Math.min(5, Math.max(1, Number(searchParams.get("limit")) || 5));
  return Response.json(await getPublicWishes(offset, limit));
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json(
      { error: "Wishes will be available after Supabase is connected." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const message = String(body.message || "").trim().slice(0, 500);
  const accessToken =
    typeof body.accessToken === "string" ? body.accessToken.toLowerCase() : "";

  if (!/^[a-f0-9]{48}$/.test(accessToken) || message.length < 2) {
    return Response.json(
      { error: "Please open your valid personal invitation before posting." },
      { status: 400 },
    );
  }

  const { data: invitee } = await supabase
    .from("invitees")
    .select("id, full_name")
    .eq("access_token", accessToken)
    .maybeSingle();

  if (!invitee) {
    return Response.json({ error: "Invitation link is not valid." }, { status: 404 });
  }

  const { data: existingWish } = await supabase
    .from("wishes")
    .select("id")
    .eq("invitee_id", invitee.id)
    .maybeSingle();

  if (existingWish) {
    return Response.json(
      { error: "A wish has already been submitted for this invitation." },
      { status: 409 },
    );
  }

  const fingerprint = getSubmissionFingerprint(request);

  const { data, error } = await supabase
    .from("wishes")
    .insert({
      invitee_id: invitee.id,
      guest_name: invitee.full_name,
      message,
      submission_fingerprint: fingerprint,
      is_approved: true,
    })
    .select("id, guest_name, message, is_approved, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "A wish has already been submitted for this invitation." },
        { status: 409 },
      );
    }
    console.error("Unable to save wish", error.code);
    return Response.json({ error: "We could not save your wish." }, { status: 500 });
  }

  const submittedAt = new Date().toISOString();
  const { error: identityError } = await supabase
    .from("invitees")
    .update({
      submission_fingerprint: fingerprint,
      last_submitted_at: submittedAt,
      updated_at: submittedAt,
    })
    .eq("id", invitee.id);

  if (identityError) {
    console.error("Unable to update submission identity", identityError.code);
  }
  return Response.json({ wish: data }, { status: 201 });
}
