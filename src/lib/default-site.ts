import type { SiteSettings } from "@/lib/types";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: "main",
  content: {
    coupleShort: "Rudi & Gabby",
    coupleFormal: "Rudi & Gabriella",
    weddingDate: "Sunday, 11 October 2026",
    weddingDateIso: "2026-10-11T10:00:00+07:00",
    receptionVenue: "Sheraton Grand Jakarta",
    intro: [
      "To our beloved family & friends,",
      "You’ve been part of our story.",
      "We’d love to have you with us",
      "as we begin our next chapter.",
    ],
    groom: {
      label: "The Groom",
      nickname: "Rudi",
      fullName: "Rudi Sukarto",
      familyLabel: "The Youngest Son of",
      parents: "Phung Ket Hiung & Ho Suk Kie",
      instagram: "rudisukarto",
    },
    bride: {
      label: "The Bride",
      nickname: "Gabby",
      fullName: "Gabriella Dharmawan",
      familyLabel: "The Oldest Daughter of",
      parents: "Tommy Dharmawan & Bettris Sutjitro",
      instagram: "gabrielladharmawan",
    },
    events: [
      {
        title: "Holy Matrimony",
        time: "10.00 AM — done",
        venue: "Kapel Hati Kudus Yesus — Biara Ursulin, Jakarta",
        mapUrl:
          "https://maps.google.com/maps/place//data=!4m2!3m1!1s0x2e69f5001d79922b:0xd96dddd446e7dbea",
      },
      {
        title: "Reception",
        time: "06.00 PM — done",
        venue: "Sheraton Grand Jakarta Gandaria City Hotel",
        mapUrl:
          "https://maps.google.com/maps/place//data=!4m2!3m1!1s0x2e69f110a36617f7:0xdac37e63cab92386",
      },
    ],
    bank: {
      bankName: "Bank BCA",
      accountNumber: "7130811773",
      accountName: "Rudi Sukarto",
    },
    music: {
      title: "Beautiful Things",
      artist: "Benson Boone",
      audioUrl: "/beautiful-things-benson-boone.mp3",
    },
    footerCredit: "Ryan Pratama",
  },
  media: [
    { key: "cover", label: "Cover", imageUrl: "/placeholders/editorial-01.svg", overlay: 0.42 },
    { key: "intro", label: "Opening", imageUrl: "/placeholders/editorial-02.svg", overlay: 0.44 },
    { key: "groom", label: "The Groom", imageUrl: "/placeholders/editorial-03.svg", overlay: 0.46 },
    { key: "bride", label: "The Bride", imageUrl: "/placeholders/editorial-04.svg", overlay: 0.46 },
    { key: "journey", label: "Our Journey", imageUrl: "/placeholders/editorial-05.svg", overlay: 0.62 },
    { key: "events", label: "Wedding Event", imageUrl: "/placeholders/editorial-06.svg", overlay: 0.58 },
    { key: "countdown", label: "Countdown", imageUrl: "/placeholders/editorial-02.svg", overlay: 0.54 },
    { key: "dress", label: "Dress Code", imageUrl: "/placeholders/editorial-07.svg", overlay: 0.64 },
    { key: "rsvp", label: "RSVP", imageUrl: "/placeholders/editorial-07.svg", overlay: 0.7 },
    { key: "wishes", label: "Wishes", imageUrl: "/placeholders/editorial-08.svg", overlay: 0.72 },
    { key: "gift", label: "Wedding Gift", imageUrl: "/placeholders/editorial-08.svg", overlay: 0.7 },
    { key: "gallery", label: "Gallery", imageUrl: "/placeholders/editorial-09.svg", overlay: 0.35 },
    { key: "video", label: "Pre-wedding Video", imageUrl: "/placeholders/editorial-10.svg", overlay: 0.52 },
    { key: "thanks", label: "Closing", imageUrl: "/placeholders/editorial-09.svg", overlay: 0.54 },
  ],
  gallery: [
    {
      id: "default-gallery-1",
      imageUrl: "/placeholders/editorial-09.svg",
    },
  ],
};

export function getSectionMedia(settings: SiteSettings, key: string) {
  return (
    settings.media.find((item) => item.key === key) ??
    DEFAULT_SITE_SETTINGS.media.find((item) => item.key === key) ??
    DEFAULT_SITE_SETTINGS.media[0]
  );
}
