export type AttendanceStatus =
  | "reception_only"
  | "holy_matrimony_only"
  | "both"
  | "not_attending";

export type InviteeStatus = "attending" | "pending" | "skip";

export type Invitee = {
  id: string;
  full_name: string;
  slug: string;
  access_token: string;
  phone: string | null;
  pax_allowed: number;
  pax_attending: number | null;
  status: InviteeStatus;
  attendance_status: AttendanceStatus | null;
  submission_fingerprint: string | null;
  rsvp_submitted_at: string | null;
  last_submitted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Wish = {
  id: string;
  invitee_id: string | null;
  guest_name: string;
  message: string;
  submission_fingerprint: string | null;
  is_approved: boolean;
  created_at: string;
};

export type PublicWish = Pick<
  Wish,
  "id" | "guest_name" | "message" | "is_approved" | "created_at"
>;

export type SiteContent = {
  coupleShort: string;
  coupleFormal: string;
  weddingDate: string;
  weddingDateIso: string;
  receptionVenue: string;
  intro: string[];
  groom: {
    label: string;
    nickname: string;
    fullName: string;
    familyLabel: string;
    parents: string;
    instagram: string;
  };
  bride: {
    label: string;
    nickname: string;
    fullName: string;
    familyLabel: string;
    parents: string;
    instagram: string;
  };
  events: Array<{
    title: string;
    time: string;
    venue: string;
    mapUrl: string;
  }>;
  bank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  music: {
    title: string;
    artist: string;
    audioUrl: string;
  };
  footerCredit: string;
};

export type GalleryImage = {
  id: string;
  imageUrl: string;
  imageKitFileId?: string;
};

export type SectionMedia = {
  key: string;
  label: string;
  imageUrl: string;
  imageKitFileId?: string;
  overlay?: number;
};

export type SiteSettings = {
  id: string;
  content: SiteContent;
  media: SectionMedia[];
  gallery: GalleryImage[];
  updated_at?: string;
};
