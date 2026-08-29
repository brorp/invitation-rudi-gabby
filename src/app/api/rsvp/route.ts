import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSubmissionFingerprint } from "@/lib/submission-identity";
import type { AttendanceStatus } from "@/lib/types";

const ALLOWED_STATUSES: AttendanceStatus[] = [
  "reception_only",
  "holy_matrimony_only",
  "both",
  "not_attending",
];

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json(
      { error: "RSVP will be available after Supabase is connected." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const accessToken =
    typeof body.accessToken === "string" ? body.accessToken.toLowerCase() : "";
  const status = body.attendanceStatus as AttendanceStatus;
  const paxAttending = Number(body.paxAttending);

  if (!/^[a-f0-9]{48}$/.test(accessToken) || !ALLOWED_STATUSES.includes(status)) {
    return Response.json(
      { error: "Please open your personal invitation link before confirming." },
      { status: 400 },
    );
  }

  const { data: invitee } = await supabase
    .from("invitees")
    .select("id, pax_allowed, status, rsvp_submitted_at")
    .eq("access_token", accessToken)
    .maybeSingle();

  if (!invitee) {
    return Response.json({ error: "Invitee was not found." }, { status: 404 });
  }

  if (invitee.status !== "pending" || invitee.rsvp_submitted_at) {
    return Response.json(
      { error: "Your RSVP has already been submitted." },
      { status: 409 },
    );
  }

  const attending = status === "not_attending" ? 0 : paxAttending;
  if (
    !Number.isInteger(attending) ||
    attending < 0 ||
    attending > invitee.pax_allowed
  ) {
    return Response.json(
      { error: "The selected pax exceeds this invitation." },
      { status: 400 },
    );
  }

  const submittedAt = new Date().toISOString();
  const { data: updatedInvitee, error } = await supabase
    .from("invitees")
    .update({
      status: status === "not_attending" ? "skip" : "attending",
      attendance_status: status,
      pax_attending: attending,
      submission_fingerprint: getSubmissionFingerprint(request),
      rsvp_submitted_at: submittedAt,
      last_submitted_at: submittedAt,
      updated_at: submittedAt,
    })
    .eq("id", invitee.id)
    .eq("status", "pending")
    .is("rsvp_submitted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to save RSVP", error.code);
    return Response.json({ error: "We could not save your RSVP." }, { status: 500 });
  }
  if (!updatedInvitee) {
    return Response.json(
      { error: "Your RSVP has already been submitted." },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}
