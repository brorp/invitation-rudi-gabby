import { PanelDashboard } from "@/components/panel/panel-dashboard";
import { PanelLogin } from "@/components/panel/panel-login";
import { getSiteSettings } from "@/lib/data";
import {
  isPanelAuthenticated,
  isPanelConfigured,
} from "@/lib/panel-auth";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "@/lib/supabase-admin";
import type { Invitee, Wish } from "@/lib/types";

export const metadata = {
  title: "Wedding Panel — Rudi & Gabriella",
  robots: { index: false, follow: false },
};

export default async function PanelPage() {
  const authenticated = await isPanelAuthenticated();
  if (!authenticated) {
    return <PanelLogin configured={isPanelConfigured()} />;
  }

  const supabase = getSupabaseAdmin();
  const [settings, inviteeResult, wishesResult] = await Promise.all([
    getSiteSettings(),
    supabase
      ? supabase
          .from("invitees")
          .select("*")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      ? supabase
          .from("wishes")
          .select("*")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <PanelDashboard
      initialSettings={settings}
      initialInvitees={(inviteeResult.data || []) as Invitee[]}
      initialWishes={(wishesResult.data || []) as Wish[]}
      supabaseConfigured={isSupabaseConfigured()}
      imageKitConfigured={Boolean(
        process.env.IMAGEKIT_PRIVATE_KEY &&
          process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY &&
          process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
      )}
    />
  );
}
