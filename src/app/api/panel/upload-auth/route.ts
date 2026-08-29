import { getUploadAuthParams } from "@imagekit/next/server";

import { requirePanelSession } from "@/lib/panel-auth";

export async function GET() {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  if (!privateKey || !publicKey) {
    return Response.json(
      { error: "Set the ImageKit private and public keys first." },
      { status: 503 },
    );
  }
  const auth = getUploadAuthParams({ privateKey, publicKey });
  return Response.json({ ...auth, publicKey });
}

