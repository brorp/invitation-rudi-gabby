import "server-only";

import { DEFAULT_SITE_SETTINGS } from "@/lib/default-site";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Invitee, PublicWish, SiteSettings } from "@/lib/types";

export function slugifyGuestName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return DEFAULT_SITE_SETTINGS;

  const currentResult = await supabase
    .from("site_settings")
    .select("id, content, media, gallery, updated_at")
    .eq("id", "main")
    .maybeSingle();

  let data = currentResult.data;
  let error = currentResult.error;

  if (error?.message.toLowerCase().includes("gallery")) {
    const legacyResult = await supabase
      .from("site_settings")
      .select("id, content, media, updated_at")
      .eq("id", "main")
      .maybeSingle();
    data = legacyResult.data
      ? { ...legacyResult.data, gallery: DEFAULT_SITE_SETTINGS.gallery }
      : null;
    error = legacyResult.error;
  }

  if (error || !data) return DEFAULT_SITE_SETTINGS;

  return {
    ...DEFAULT_SITE_SETTINGS,
    ...data,
    content: {
      ...DEFAULT_SITE_SETTINGS.content,
      ...data.content,
      music: {
        ...DEFAULT_SITE_SETTINGS.content.music,
        ...(data.content?.music || {}),
        audioUrl:
          data.content?.music?.audioUrl ||
          DEFAULT_SITE_SETTINGS.content.music.audioUrl,
      },
    },
    media: Array.isArray(data.media) ? data.media : DEFAULT_SITE_SETTINGS.media,
    gallery: Array.isArray(data.gallery)
      ? data.gallery
      : DEFAULT_SITE_SETTINGS.gallery,
  } as SiteSettings;
}

export async function findInviteeByToken(token?: string): Promise<Invitee | null> {
  if (!token || !/^[a-f0-9]{48}$/i.test(token)) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from("invitees")
    .select("*")
    .eq("access_token", token.toLowerCase())
    .maybeSingle();

  return (data as Invitee | null) ?? null;
}

const SAMPLE_WISHES: PublicWish[] = [
  {
    id: "sample-1",
    guest_name: "Ryan Pratama & Indri",
    message: "Selamat menempuh hidup baru. Wishing you a lifetime of joy!",
    is_approved: true,
    created_at: "2026-08-29T00:00:00.000Z",
  },
  {
    id: "sample-2",
    guest_name: "Reynaldi Gunawan & Amel",
    message: "Congrats brodie — here’s to forever!",
    is_approved: true,
    created_at: "2026-08-28T00:00:00.000Z",
  },
];

export async function getPublicWishes(offset = 0, limit = 5) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      wishes: SAMPLE_WISHES.slice(offset, offset + limit),
      count: SAMPLE_WISHES.length,
    };
  }

  const { data, count } = await supabase
    .from("wishes")
    .select("id, guest_name, message, is_approved, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { wishes: (data as PublicWish[] | null) ?? [], count: count ?? 0 };
}

export async function hasInviteeSubmittedWish(inviteeId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data } = await supabase
    .from("wishes")
    .select("id")
    .eq("invitee_id", inviteeId)
    .maybeSingle();

  return Boolean(data);
}
