import "server-only";

import { createHmac } from "node:crypto";

export function getSubmissionFingerprint(request: Request) {
  const secret =
    process.env.SUBMISSION_FINGERPRINT_SECRET ||
    process.env.PANEL_SESSION_SECRET;

  if (!secret) return null;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    forwardedFor?.split(",")[0]?.trim() ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return createHmac("sha256", secret)
    .update(`${ip}\u0000${userAgent}`)
    .digest("hex");
}
