"use client";

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CalendarDays,
  Check,
  ChevronUp,
  Copy,
  MapPin,
  Menu,
  Music2,
  Play,
  Send,
  VolumeX,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getSectionMedia } from "@/lib/default-site";
import type {
  Invitee,
  PublicWish,
  SectionMedia,
  SiteSettings,
} from "@/lib/types";

type Props = {
  settings: SiteSettings;
  invitee: Invitee | null;
  initialWishes: PublicWish[];
  initialWishCount: number;
  hasSubmittedWish: boolean;
  isPrivate: boolean;
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type Language = "en" | "id";

const SECTION_LINKS = [
  ["intro", "Opening"],
  ["groom", "The Groom"],
  ["bride", "The Bride"],
  ["journey", "Our Journey"],
  ["events", "Wedding Event"],
  ["countdown", "Countdown"],
  ["dress", "Dress Code"],
  ["rsvp", "RSVP"],
  ["wishes", "Wishes"],
  ["gift", "Wedding Gift"],
  ["gallery", "Gallery"],
  ["video", "Video"],
  ["thanks", "Closing"],
] as const;

const ATTENDANCE_OPTIONS = {
  en: [
    { value: "both", label: "We'll attend both!" },
    { value: "holy_matrimony_only", label: "Holy Matrimony only" },
    { value: "reception_only", label: "Reception only" },
    { value: "not_attending", label: "Regretfully cannot attend" },
  ],
  id: [
    { value: "both", label: "Hadir pemberkatan & resepsi" },
    { value: "holy_matrimony_only", label: "Hanya menghadiri pemberkatan" },
    { value: "reception_only", label: "Hanya menghadiri resepsi" },
    { value: "not_attending", label: "Mohon maaf, tidak dapat hadir" },
  ],
} as const;

const INDONESIAN_COPY = {
  cover: {
    dear: "Kepada Yth.",
    publicGuest: "Tamu Undangan Kami",
    privateNote: "Mohon maaf jika ada kesalahan penulisan nama",
    publicNote: "Undangan Pernikahan",
    open: "Buka undangan",
  },
  intro: {
    eyebrow: "Kami mengundang Anda untuk merayakan",
    title: "babak baru",
    titleEmphasis: "kehidupan kami",
    lines: [
      "Untuk keluarga & teman-teman tercinta,",
      "Kalian telah menjadi bagian dari perjalanan cerita kami.",
      "Kami akan sangat senang jika kalian dapat bersama kami saat kami memulai babak baru dalam kehidupan kami.",
    ],
    date: "Minggu, 11 Oktober 2026",
    scroll: "Geser ke atas",
  },
  groom: {
    label: "Mempelai Pria",
    familyLabel: "Putra bungsu dari",
  },
  bride: {
    label: "Mempelai Wanita",
    familyLabel: "Putri sulung dari",
    parents: "Tommy Dharmawan & Bettris Sutjitro",
  },
  journey: {
    eyebrow: "Awal pertemuan kami",
    title: "Perjalanan Kita",
    titleEmphasis: "Menuju Selamanya",
    items: [
      {
        date: "Juli 2013",
        title: "Begitu Dekat, Tapi Tidak Saling Kenal",
        body: "Selama dua tahun, kami berjalan di koridor sekolah yang sama — di tempat yang sama, pada waktu yang sama — namun jalan kami tidak pernah bersilangan. Kisah kami ternyata menunggu waktu yang tepat.",
      },
      {
        date: "Mei 2023",
        title: "Saat Jalan Kami Akhirnya Bertemu",
        body: "Sepuluh tahun kemudian, media sosial mempertemukan dua orang asing yang sebenarnya sudah saling familiar. Sebuah hubungan pun tumbuh menjadi begitu banyak momen, tantangan, dan akhirnya menjadi rumah.",
      },
    ],
  },
  events: {
    title: "Mari Rayakan",
    titleEmphasis: "Cinta Kami",
    weekday: "Minggu",
    monthYear: "Oktober 2026",
    map: "Lihat peta",
    items: [
      {
        title: "Pemberkatan Pernikahan",
        time: "10.00 - selesai",
        venue: "Kapel Hati Kudus Yesus - Biara Ursulin, Jakarta",
      },
      {
        title: "Resepsi",
        time: "18.00 - selesai",
        venue: "Sheraton Grand Jakarta Gandaria City Hotel",
      },
    ],
  },
  countdown: {
    eyebrow: "Hampir tiba waktunya",
    title: "Menghitung Mundur",
    titleEmphasis: "Menuju Selamanya",
    labels: ["Hari", "Jam", "Menit", "Detik"],
    save: "Simpan tanggalnya",
  },
  dress: {
    title: "Dress Code",
    palette: "Palet warna yang disarankan",
    note: "Formal - warna netral / earth tones",
    imageAlt: "Inspirasi dress code dengan warna netral dan earth tones",
  },
  rsvp: {
    eyebrow: "Mohon konfirmasi",
    title: "Konfirmasi",
    titleEmphasis: "Kehadiran",
    name: "Nama",
    attendance: "Kehadiran",
    pax: "Jumlah yang hadir",
    confirm: "Konfirmasi Kehadiran",
    publicTitle: "Informasi pernikahan",
    publicNote: "RSVP hanya tersedia melalui tautan undangan pribadi.",
    submitted: "Konfirmasi kehadiran sudah dikirim",
  },
  navigation: {
    intro: "Pembuka",
    groom: "Mempelai Pria",
    bride: "Mempelai Wanita",
    journey: "Perjalanan Kami",
    events: "Acara Pernikahan",
    countdown: "Hitung Mundur",
    dress: "Dress Code",
    rsvp: "Konfirmasi Kehadiran",
  },
} as const;

const ENGLISH_JOURNEY_ITEMS = [
  {
    date: "July 2013",
    title: "So Close, Yet Strangers",
    body: "For two years, we walked the halls of the same school — in the same place, at the same time — yet our paths never crossed. Our story was waiting for the right time.",
  },
  {
    date: "May 2023",
    title: "When Our Paths Finally Crossed",
    body: "Ten years later, social media brought two familiar strangers together. A connection became countless moments, shared challenges, and home.",
  },
  {
    date: "October 2026",
    title: "Our Forever Begins",
    body: "Thirteen years after those hallways, we are ready for our greatest adventure yet. Our story together is only beginning.",
  },
] as const;

function backgroundStyle(media: SectionMedia) {
  const opacity = media.overlay ?? 0.5;
  return {
    backgroundImage:
      "linear-gradient(rgba(8, 8, 8, " +
      opacity +
      "), rgba(8, 8, 8, " +
      Math.min(opacity + 0.14, 0.86) +
      ")), url('" +
      media.imageUrl +
      "')",
  };
}

function InvitationSection({
  sectionKey,
  media,
  children,
  className = "",
  backgroundVideoSrc,
}: {
  sectionKey: string;
  media: SectionMedia;
  children: ReactNode;
  className?: string;
  backgroundVideoSrc?: string;
}) {
  return (
    <section
      id={sectionKey}
      data-section={sectionKey}
      className={"invitation-section " + className}
      style={backgroundStyle(media)}
    >
      {backgroundVideoSrc ? (
        <video
          className="section-background-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={media.imageUrl}
          aria-hidden="true"
        >
          <source src={backgroundVideoSrc} type="video/mp4" />
        </video>
      ) : null}
      <div className="section-vignette" />
      <div className="section-inner">{children}</div>
    </section>
  );
}

function OrnamentalLine() {
  return (
    <div className="ornamental-line" aria-hidden="true">
      <span />
      <i>✦</i>
      <span />
    </div>
  );
}

function calculateCountdown(target: string): Countdown {
  const distance = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

export function InvitationExperience({
  settings,
  invitee,
  initialWishes,
  initialWishCount,
  hasSubmittedWish,
  isPrivate,
}: Props) {
  const [language, setLanguage] = useState<Language>("en");
  const [opened, setOpened] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoStarted, setVideoStarted] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const [countdown, setCountdown] = useState(() =>
    calculateCountdown(settings.content.weddingDateIso),
  );
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [wishes, setWishes] = useState(initialWishes.slice(0, 5));
  const [wishOffset, setWishOffset] = useState(0);
  const [wishTotal, setWishTotal] = useState(initialWishCount);
  const [wishesLoading, setWishesLoading] = useState(false);
  const [rsvpState, setRsvpState] = useState("");
  const [wishState, setWishState] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<string>(
    invitee?.attendance_status || "both",
  );
  const [rsvpSubmitted, setRsvpSubmitted] = useState(
    (invitee?.status || "pending") !== "pending",
  );
  const [wishSubmitted, setWishSubmitted] = useState(hasSubmittedWish);
  const [copied, setCopied] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const content = settings.content;
  const isIndonesian = language === "id";
  const guestName =
    invitee?.full_name ||
    (isIndonesian
      ? INDONESIAN_COPY.cover.publicGuest
      : "Our Beloved Guest");
  const introLines = isIndonesian
    ? INDONESIAN_COPY.intro.lines
    : content.intro;
  const journeyItems = isIndonesian
    ? INDONESIAN_COPY.journey.items
    : ENGLISH_JOURNEY_ITEMS;
  const attendanceOptions = ATTENDANCE_OPTIONS[language];
  const sectionLinks = SECTION_LINKS.map(([key, label]) => [
    key,
    isIndonesian && key in INDONESIAN_COPY.navigation
      ? INDONESIAN_COPY.navigation[
          key as keyof typeof INDONESIAN_COPY.navigation
        ]
      : label,
  ] as const);

  const mediaMap = useMemo(
    () =>
      Object.fromEntries(
        settings.media.map((item) => [item.key, item]),
      ) as Record<string, SectionMedia>,
    [settings.media],
  );

  const media = useCallback(
    (key: string) => mediaMap[key] || getSectionMedia(settings, key),
    [mediaMap, settings],
  );

  const activeMedia = media(activeSection);
  const galleryImages = settings.gallery.length
    ? settings.gallery
    : [{ id: "fallback-gallery", imageUrl: media("gallery").imageUrl }];
  const activeGalleryImage =
    galleryImages[galleryIndex % galleryImages.length];

  useEffect(() => {
    const timer = window.setInterval(
      () => setCountdown(calculateCountdown(content.weddingDateIso)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [content.weddingDateIso]);

  useEffect(() => {
    if (!opened || !paneRef.current) return;
    const root = paneRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const key = active?.target.getAttribute("data-section");
        if (key) setActiveSection(key);
      },
      { root, threshold: [0.4, 0.62, 0.8] },
    );
    root
      .querySelectorAll("[data-section]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [opened]);

  useEffect(() => {
    if (!opened || !paneRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = paneRef.current;
    let animationFrame = 0;
    const updateParallax = () => {
      animationFrame = 0;
      const rootTop = root.getBoundingClientRect().top;
      const viewportHeight = Math.max(root.clientHeight, 1);
      root.querySelectorAll<HTMLElement>("[data-section]").forEach((section) => {
        const distance = section.getBoundingClientRect().top - rootTop;
        const offset = Math.max(-42, Math.min(42, (distance / viewportHeight) * 42));
        section.style.setProperty("--parallax-offset", `${offset}px`);
      });
    };
    const handleScroll = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", handleScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [opened]);

  function openInvitation() {
    setOpened(true);
    window.requestAnimationFrame(() => paneRef.current?.scrollTo({ top: 0 }));
    if (content.music.audioUrl && audioRef.current) {
      void audioRef.current
        .play()
        .then(() => setMuted(false))
        .catch(() => setMuted(true));
    }
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || !content.music.audioUrl) return;
    if (audio.paused) {
      void audio
        .play()
        .then(() => setMuted(false))
        .catch(() => setMuted(true));
    } else {
      audio.pause();
      setMuted(true);
    }
  }

  function playWeddingVideo() {
    audioRef.current?.pause();
    setMuted(true);
    setVideoStarted(true);
  }

  function goToSection(key: string) {
    const target = paneRef.current?.querySelector<HTMLElement>(
      '[data-section="' + key + '"]',
    );
    if (target && paneRef.current) {
      paneRef.current.scrollTop = target.offsetTop;
    }
    setMenuOpen(false);
  }

  async function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitee) return;
    setRsvpState(
      isIndonesian
        ? "Mengirim konfirmasi kehadiran…"
        : "Sending your confirmation…",
    );
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: invitee.access_token,
        guestName: form.get("guestName"),
        attendanceStatus: form.get("attendanceStatus"),
        paxAttending: Number(form.get("paxAttending") || 1),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) setRsvpSubmitted(true);
    setRsvpState(
      response.ok
        ? isIndonesian
          ? "Terima kasih — kehadiran Anda telah dikonfirmasi."
          : "Thank you — your attendance has been confirmed."
        : result.error ||
            (isIndonesian
              ? "Konfirmasi kehadiran belum dapat disimpan."
              : "We could not save your RSVP yet."),
    );
  }

  async function submitWish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitee) return;
    const formElement = event.currentTarget;
    setWishState("Posting your wish…");
    const form = new FormData(formElement);
    const response = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: invitee.access_token,
        guestName: form.get("guestName"),
        message: form.get("message"),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setWishSubmitted(true);
      setWishState("Your warm wish is now public.");
      formElement.reset();
      setWishes((current) => [result.wish, ...current].slice(0, 5));
      setWishOffset(0);
      setWishTotal((current) => current + 1);
    } else {
      setWishState(result.error || "We could not post your wish yet.");
    }
  }

  async function loadWishPage(nextOffset: number) {
    const boundedOffset = Math.max(
      0,
      Math.min(nextOffset, Math.max(0, wishTotal - 1)),
    );
    setWishesLoading(true);
    try {
      const response = await fetch(
        `/api/wishes?offset=${boundedOffset}&limit=5`,
      );
      const result = await response.json();
      if (!response.ok) throw new Error("Unable to load wishes.");
      setWishes(result.wishes || []);
      setWishTotal(result.count || 0);
      setWishOffset(boundedOffset);
    } catch {
      setWishState("We could not load more wishes yet.");
    } finally {
      setWishesLoading(false);
    }
  }

  async function copyAccount() {
    await navigator.clipboard.writeText(content.bank.accountNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const calendarUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
    encodeURIComponent("Wedding of " + content.coupleFormal) +
    "&dates=20261011T030000Z/20261011T150000Z&details=" +
    encodeURIComponent("We look forward to celebrating with you.") +
    "&location=" +
    encodeURIComponent(content.receptionVenue);

  const currentNumber = Math.max(
    1,
    SECTION_LINKS.findIndex(([key]) => key === activeSection) + 1,
  );

  return (
    <main
      lang={language}
      className={"invitation-shell " + (opened ? "is-open" : "is-closed")}
    >
      <aside
        className="desktop-cinema"
        style={backgroundStyle(opened ? activeMedia : media("cover"))}
        aria-hidden="true"
      >
        <div className="desktop-cinema-shade" />
        <div className="desktop-cinema-top">
          <span>R</span>
          <i />
          <span>G</span>
        </div>
        <div className="desktop-cinema-caption">
          <p>
            {isIndonesian
              ? "Sebelas Oktober · Dua Ribu Dua Puluh Enam"
              : "Eleventh of October · Two Thousand Twenty Six"}
          </p>
          <h2>{content.coupleFormal}</h2>
        </div>
      </aside>

      <div className="story-column">
        {content.music.audioUrl && (
          <audio
            ref={audioRef}
            src={content.music.audioUrl}
            loop
            playsInline
            preload="metadata"
          />
        )}
        {!opened ? (
          <section
            className="invitation-cover"
            style={backgroundStyle(media("cover"))}
          >
            <div className="cover-content">
              <p className="eyebrow cover-intro">With joyful hearts,</p>
              <h1>
                <span>We invite you to celebrate</span>
                <em>The Beginning of Our Forever</em>
              </h1>
              <OrnamentalLine />
              <h2>{content.coupleShort}</h2>
              <p className="cover-date">
                {isIndonesian
                  ? INDONESIAN_COPY.intro.date
                  : content.weddingDate}
              </p>
              <div className="guest-card">
                <span>
                  {isIndonesian ? INDONESIAN_COPY.cover.dear : "Dear"}
                </span>
                <strong>{guestName}</strong>
                <small>
                  {isIndonesian
                    ? isPrivate
                      ? INDONESIAN_COPY.cover.privateNote
                      : INDONESIAN_COPY.cover.publicNote
                    : isPrivate
                      ? "We apologize if there's any misspelling of name"
                      : "Wedding Invitation"}
                </small>
              </div>
              <div
                className="language-selector"
                role="group"
                aria-label="Language / Bahasa"
              >
                <button
                  type="button"
                  className={language === "en" ? "active" : ""}
                  aria-pressed={language === "en"}
                  onClick={() => setLanguage("en")}
                >
                  English
                </button>
                <span aria-hidden="true" />
                <button
                  type="button"
                  className={language === "id" ? "active" : ""}
                  aria-pressed={language === "id"}
                  onClick={() => setLanguage("id")}
                >
                  Bahasa Indonesia
                </button>
              </div>
              <button className="pill-button light" onClick={openInvitation}>
                {isIndonesian
                  ? INDONESIAN_COPY.cover.open
                  : "Open invitation"}{" "}
                <ChevronUp size={15} />
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="story-scroll" ref={paneRef}>
              <InvitationSection
                sectionKey="intro"
                media={media("intro")}
                backgroundVideoSrc="/teaser-bg.mp4"
              >
                <div className="intro-mark">R · G</div>
                <p className="eyebrow">
                  {isIndonesian
                    ? INDONESIAN_COPY.intro.eyebrow
                    : "We invite you to celebrate"}
                </p>
                <h2 className="display-title">
                  {isIndonesian ? INDONESIAN_COPY.intro.title : "our next"}
                  <em>
                    {isIndonesian
                      ? INDONESIAN_COPY.intro.titleEmphasis
                      : "chapter"}
                  </em>
                </h2>
                <div className="intro-copy">
                  {introLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <OrnamentalLine />
                <h3 className="script-name">{content.coupleFormal}</h3>
                <p className="date-line">
                  {isIndonesian
                    ? INDONESIAN_COPY.intro.date
                    : content.weddingDate}
                </p>
                <p className="venue-line">{content.receptionVenue}</p>
                <button
                  className="scroll-cue"
                  onClick={() => goToSection("groom")}
                >
                  {isIndonesian
                    ? INDONESIAN_COPY.intro.scroll
                    : "Scroll up"}{" "}
                  <ChevronUp size={14} />
                </button>
              </InvitationSection>

              <InvitationSection
                sectionKey="groom"
                media={media("groom")}
                className="profile-section align-bottom"
              >
                <p className="eyebrow tracking">
                  {isIndonesian
                    ? INDONESIAN_COPY.groom.label
                    : content.groom.label}
                </p>
                <h2 className="profile-name">{content.groom.nickname}</h2>
                <p className="formal-name">( {content.groom.fullName} )</p>
                <div className="profile-family">
                  <span>
                    {isIndonesian
                      ? INDONESIAN_COPY.groom.familyLabel
                      : content.groom.familyLabel}
                  </span>
                  <strong>{content.groom.parents}</strong>
                </div>
                <a
                  className="social-link"
                  href={"https://instagram.com/" + content.groom.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Camera size={14} /> @{content.groom.instagram}
                </a>
              </InvitationSection>

              <InvitationSection
                sectionKey="bride"
                media={media("bride")}
                className="profile-section align-bottom"
              >
                <p className="eyebrow tracking">
                  {isIndonesian
                    ? INDONESIAN_COPY.bride.label
                    : content.bride.label}
                </p>
                <h2 className="profile-name">{content.bride.nickname}</h2>
                <p className="formal-name">( {content.bride.fullName} )</p>
                <div className="profile-family">
                  <span>
                    {isIndonesian
                      ? INDONESIAN_COPY.bride.familyLabel
                      : content.bride.familyLabel}
                  </span>
                  <strong>
                    {isIndonesian
                      ? INDONESIAN_COPY.bride.parents
                      : content.bride.parents}
                  </strong>
                </div>
                <a
                  className="social-link"
                  href={"https://instagram.com/" + content.bride.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Camera size={14} /> @{content.bride.instagram}
                </a>
              </InvitationSection>

              <InvitationSection
                sectionKey="journey"
                media={media("journey")}
                className="journey-section"
              >
                <p className="eyebrow tracking">
                  {isIndonesian
                    ? INDONESIAN_COPY.journey.eyebrow
                    : "How it all began"}
                </p>
                <h2 className="section-title">
                  {isIndonesian
                    ? INDONESIAN_COPY.journey.title
                    : "Our Journey"}
                  <em>
                    {isIndonesian
                      ? INDONESIAN_COPY.journey.titleEmphasis
                      : "to Forever"}
                  </em>
                </h2>
                <div className="timeline">
                  {journeyItems.map((item) => (
                    <article key={item.date}>
                      <span>{item.date}</span>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>
                {!isIndonesian && (
                  <p className="journey-signoff">Here&apos;s to forever.</p>
                )}
              </InvitationSection>

              <InvitationSection
                sectionKey="events"
                media={media("events")}
                className="events-section"
              >
                {!isIndonesian && (
                  <p className="eyebrow tracking">Save the celebration</p>
                )}
                <h2 className="section-title">
                  {isIndonesian
                    ? INDONESIAN_COPY.events.title
                    : "Come Celebrate"}
                  <em>
                    {isIndonesian
                      ? INDONESIAN_COPY.events.titleEmphasis
                      : "Our Love"}
                  </em>
                </h2>
                <p className="event-date">
                  {isIndonesian
                    ? INDONESIAN_COPY.events.weekday
                    : "Sunday"}{" "}
                  <b>11</b>{" "}
                  {isIndonesian
                    ? INDONESIAN_COPY.events.monthYear
                    : "October 2026"}
                </p>
                <div className="event-list">
                  {content.events.map((event, index) => {
                    const translatedEvent = isIndonesian
                      ? INDONESIAN_COPY.events.items[index]
                      : undefined;
                    return (
                      <article key={event.title}>
                        <span>{translatedEvent?.title || event.title}</span>
                        <h3>{translatedEvent?.time || event.time}</h3>
                        <p>{translatedEvent?.venue || event.venue}</p>
                        <a
                          href={event.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPin size={13} />
                          {isIndonesian
                            ? INDONESIAN_COPY.events.map
                            : "Show maps"}
                        </a>
                      </article>
                    );
                  })}
                </div>
              </InvitationSection>

              <InvitationSection
                sectionKey="countdown"
                media={media("countdown")}
              >
                <p className="eyebrow tracking">
                  {isIndonesian
                    ? INDONESIAN_COPY.countdown.eyebrow
                    : "Almost time"}
                </p>
                <h2 className="section-title">
                  {isIndonesian
                    ? INDONESIAN_COPY.countdown.title
                    : "Counting Down"}
                  <em>
                    {isIndonesian
                      ? INDONESIAN_COPY.countdown.titleEmphasis
                      : "to Forever"}
                  </em>
                </h2>
                <div className="countdown-grid">
                  {(
                    [
                      ["Days", countdown.days],
                      ["Hours", countdown.hours],
                      ["Minutes", countdown.minutes],
                      ["Seconds", countdown.seconds],
                    ] as const
                  ).map(([label, value], index) => (
                    <div key={label}>
                      <strong>{String(value).padStart(2, "0")}</strong>
                      <span>
                        {isIndonesian
                          ? INDONESIAN_COPY.countdown.labels[index]
                          : label}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  className="outline-button"
                  href={calendarUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CalendarDays size={15} />
                  {isIndonesian
                    ? INDONESIAN_COPY.countdown.save
                    : "Save the date"}
                </a>
              </InvitationSection>

              <InvitationSection sectionKey="dress" media={media("dress")}>
                {!isIndonesian && (
                  <p className="eyebrow tracking">A note on attire</p>
                )}
                <h2 className="section-title">
                  {isIndonesian ? INDONESIAN_COPY.dress.title : "What to"}
                  {!isIndonesian && <em>Wear</em>}
                </h2>
                {!isIndonesian && (
                  <p className="section-copy">
                    We invite you to dress up and make the evening as beautiful
                    as the celebration itself.
                  </p>
                )}
                <div
                  className="palette"
                  aria-label={
                    isIndonesian
                      ? INDONESIAN_COPY.dress.palette
                      : "Suggested color palette"
                  }
                >
                  {["#161616", "#5b5751", "#968d81", "#d1c7ba", "#ece6dd"].map(
                    (color) => (
                      <span key={color} style={{ backgroundColor: color }} />
                    ),
                  )}
                </div>
                <Image
                  className="dress-code-art"
                  src="/DRESSCODE.png"
                  width={1145}
                  height={1374}
                  sizes="(max-width: 520px) 78vw, 330px"
                  alt={
                    isIndonesian
                      ? INDONESIAN_COPY.dress.imageAlt
                      : "Dress code inspiration in neutral and earthy tones"
                  }
                />
                <p className="tiny-note">
                  {isIndonesian
                    ? INDONESIAN_COPY.dress.note
                    : "Formal evening attire · neutral and earthy tones"}
                </p>
              </InvitationSection>

              <InvitationSection
                sectionKey="rsvp"
                media={media("rsvp")}
                className="form-section"
              >
                <p className="eyebrow tracking">
                  {isIndonesian
                    ? INDONESIAN_COPY.rsvp.eyebrow
                    : "Kindly reply"}
                </p>
                <h2 className="section-title">
                  {isIndonesian
                    ? INDONESIAN_COPY.rsvp.title
                    : "Attendance"}
                  <em>
                    {isIndonesian
                      ? INDONESIAN_COPY.rsvp.titleEmphasis
                      : "Confirmation"}
                  </em>
                </h2>
                {!isPrivate ? (
                  <div className="submitted-form-state public-information-state">
                    <CalendarDays size={20} />
                    <strong>
                      {isIndonesian
                        ? INDONESIAN_COPY.rsvp.publicTitle
                        : "Wedding information"}
                    </strong>
                    <span>
                      {isIndonesian
                        ? INDONESIAN_COPY.rsvp.publicNote
                        : "RSVP is available only through a personal invitation link."}
                    </span>
                  </div>
                ) : !rsvpSubmitted ? (
                <form onSubmit={submitRsvp} className="invitation-form">
                  <label>
                    <span>
                      {isIndonesian ? INDONESIAN_COPY.rsvp.name : "Name"}
                    </span>
                    <input
                      name="guestName"
                      defaultValue={guestName}
                      required
                      readOnly={Boolean(invitee)}
                    />
                  </label>
                  <div className="attendance-picker-group">
                    <span className="picker-label">
                      {isIndonesian
                        ? INDONESIAN_COPY.rsvp.attendance
                        : "Attendance"}
                    </span>
                    <div
                      className="attendance-options-list"
                      role="radiogroup"
                      aria-label={
                        isIndonesian ? "Status kehadiran" : "Attendance status"
                      }
                    >
                      {attendanceOptions.map((option) => {
                        const isSelected = attendanceStatus === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`attendance-option ${isSelected ? "is-selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name="attendanceStatus"
                              value={option.value}
                              checked={isSelected}
                              onChange={() => setAttendanceStatus(option.value)}
                              required
                              className="attendance-radio-input"
                            />
                            <span className="attendance-radio-circle">
                              <span className="attendance-radio-dot" />
                            </span>
                            <span className="attendance-option-text">
                              {option.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  {attendanceStatus !== "not_attending" && (
                    <label>
                      <span>
                        {isIndonesian
                          ? INDONESIAN_COPY.rsvp.pax
                          : "How many will attend"}
                      </span>
                      <select
                        name="paxAttending"
                        defaultValue={
                          invitee?.pax_attending || invitee?.pax_allowed || 1
                        }
                      >
                        {Array.from(
                          { length: invitee?.pax_allowed || 1 },
                          (_, index) => index + 1,
                        ).map((pax) => (
                          <option value={pax} key={pax}>
                            {pax} {isIndonesian ? "orang" : "pax"}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button className="solid-button" type="submit">
                    {isIndonesian
                      ? INDONESIAN_COPY.rsvp.confirm
                      : "Confirm attendance"}{" "}
                    <Check size={15} />
                  </button>
                  {rsvpState && <p className="form-state">{rsvpState}</p>}
                </form>
                ) : (
                  <div className="submitted-form-state">
                    <Check size={20} />
                    <strong>
                      {isIndonesian
                        ? INDONESIAN_COPY.rsvp.submitted
                        : "RSVP already submitted"}
                    </strong>
                    <span>
                      {rsvpState ||
                        `Status: ${invitee?.status} · ${invitee?.pax_attending || 0} ${isIndonesian ? "orang" : "pax"}`}
                    </span>
                  </div>
                )}
              </InvitationSection>

              <InvitationSection
                sectionKey="wishes"
                media={media("wishes")}
                className="form-section wishes-section"
              >
                <p className="eyebrow tracking">A note from you</p>
                <h2 className="section-title">
                  Prayer
                  <em>& Wishes</em>
                </h2>
                {isPrivate && (!wishSubmitted ? (
                <form onSubmit={submitWish} className="invitation-form compact">
                  <input
                    name="guestName"
                    defaultValue={guestName}
                    aria-label="Your name"
                    required
                  />
                  <textarea
                    name="message"
                    rows={3}
                    maxLength={500}
                    placeholder="Write your warm wishes…"
                    required
                  />
                  <button className="outline-button" type="submit">
                    Post wish <Send size={14} />
                  </button>
                  {wishState && <p className="form-state">{wishState}</p>}
                </form>
                ) : (
                  <div className="submitted-form-state compact-state">
                    <Check size={18} />
                    <strong>Your wish has been received</strong>
                    <span>One wish is accepted for each invitation.</span>
                  </div>
                ))}
                <div className="wish-list">
                  {wishes.map((wish) => (
                    <article key={wish.id}>
                      <span>
                        {wish.guest_name
                          .split(" ")
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join("")}
                      </span>
                      <div>
                        <h3>{wish.guest_name}</h3>
                        <p>{wish.message}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="wish-arrows" aria-label="Wish pages">
                  <button
                    type="button"
                    aria-label="Previous five wishes"
                    onClick={() => loadWishPage(wishOffset - 5)}
                    disabled={wishOffset === 0 || wishesLoading}
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <span>
                    {Math.min(wishOffset + wishes.length, wishTotal)}/{wishTotal}
                  </span>
                  <button
                    type="button"
                    aria-label="Next five wishes"
                    onClick={() => loadWishPage(wishOffset + 5)}
                    disabled={
                      wishesLoading || wishOffset + wishes.length >= wishTotal
                    }
                  >
                    <ArrowRight size={15} />
                  </button>
                </div>
              </InvitationSection>

              <InvitationSection sectionKey="gift" media={media("gift")}>
                <p className="eyebrow tracking">With gratitude</p>
                <h2 className="section-title">
                  Your Thoughtfulness
                  <em>Means Everything</em>
                </h2>
                <p className="section-copy">
                  For those who would like to send a token of love, you may use
                  the account below.
                </p>
                <div className="bank-card">
                  <span>{content.bank.bankName}</span>
                  <strong>{content.bank.accountNumber}</strong>
                  <p>{content.bank.accountName}</p>
                  <button onClick={copyAccount}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy number"}
                  </button>
                </div>
              </InvitationSection>

              <InvitationSection
                sectionKey="gallery"
                media={media("gallery")}
                className="gallery-section"
              >
                <p className="eyebrow tracking">Frames from Seoul</p>
                <h2 className="section-title">
                  Our Pre-Wedding
                  <em>Memories</em>
                </h2>
                <div className="gallery-frame">
                  <div
                    className="gallery-placeholder"
                    style={{
                      backgroundImage: "url('" + activeGalleryImage.imageUrl + "')",
                    }}
                    role="img"
                    aria-label={"Pre-wedding image " + (galleryIndex + 1)}
                  />
                  <span>
                    {String((galleryIndex % galleryImages.length) + 1).padStart(2, "0")} /{" "}
                    {String(galleryImages.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="gallery-controls">
                  <button
                    aria-label="Previous image"
                    onClick={() =>
                      setGalleryIndex(
                        (current) =>
                          (current - 1 + galleryImages.length) % galleryImages.length,
                      )
                    }
                    disabled={galleryImages.length <= 1}
                  >
                    <ArrowLeft size={17} />
                  </button>
                  <p>Browse our memories</p>
                  <button
                    aria-label="Next image"
                    onClick={() =>
                      setGalleryIndex(
                        (current) => (current + 1) % galleryImages.length,
                      )
                    }
                    disabled={galleryImages.length <= 1}
                  >
                    <ArrowRight size={17} />
                  </button>
                </div>
              </InvitationSection>

              <InvitationSection
                sectionKey="video"
                media={media("video")}
                className="video-section"
              >
                <p className="eyebrow tracking">From the island of gods</p>
                <h2 className="section-title">
                  Our Pre-Wedding
                  <em>Video in Bali</em>
                </h2>
                <div className="video-card">
                  <div className="youtube-embed">
                    {videoStarted ? (
                      <iframe
                        src="https://www.youtube.com/embed/szlhyb0xmCI?si=4toL31284nZNow6d&autoplay=1&rel=0&playsinline=1&controls=1&fs=1"
                        title="Rudi and Gabriella pre-wedding video in Bali"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        className="video-poster"
                        onClick={playWeddingVideo}
                        aria-label="Play Rudi and Gabriella pre-wedding video"
                      >
                        <span>
                          <Play size={25} fill="currentColor" />
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </InvitationSection>

              <InvitationSection
                sectionKey="thanks"
                media={media("thanks")}
                className="closing-section"
              >
                <p className="eyebrow tracking">From our hearts</p>
                <h2 className="section-title">
                  With Love
                  <em>& Gratitude</em>
                </h2>
                <p className="closing-copy">
                  Having you with us on our special day
                  <br />
                  would be an honor and a joy.
                </p>
                <p className="closing-copy">
                  We look forward to celebrating
                  <br />
                  this beautiful moment with you.
                </p>
                <OrnamentalLine />
                <h3 className="script-name">{content.coupleFormal}</h3>
                <footer>
                  <span>Created by</span>
                  <strong>{content.footerCredit}</strong>
                </footer>
              </InvitationSection>
            </div>

            <div className="floating-controls">
              <button
                onClick={() => setMenuOpen(true)}
                aria-label={
                  isIndonesian
                    ? "Buka navigasi undangan"
                    : "Open invitation navigation"
                }
              >
                <Menu size={18} />
              </button>
              <span>
                {String(currentNumber).padStart(2, "0")} /{" "}
                {String(SECTION_LINKS.length).padStart(2, "0")}
              </span>
              <button
                onClick={toggleMusic}
                aria-label={
                  isIndonesian
                    ? muted
                      ? "Nyalakan musik"
                      : "Jeda musik"
                    : muted
                      ? "Turn music on"
                      : "Pause music"
                }
                title={
                  content.music.audioUrl
                    ? `${content.music.title} — ${content.music.artist}`
                    : "Background music file is not configured"
                }
                disabled={!content.music.audioUrl}
              >
                {muted ? <VolumeX size={17} /> : <Music2 size={17} />}
              </button>
            </div>

            {menuOpen && (
              <div className="menu-overlay" role="dialog" aria-modal="true">
                <button
                  className="menu-close"
                  onClick={() => setMenuOpen(false)}
                  aria-label={isIndonesian ? "Tutup menu" : "Close menu"}
                >
                  <X size={20} />
                </button>
                <p>
                  {isIndonesian
                    ? "Navigasi undangan"
                    : "Navigate the invitation"}
                </p>
                <nav>
                  {sectionLinks.map(([key, label], index) => (
                    <button
                      key={key}
                      className={activeSection === key ? "active" : ""}
                      onClick={() => goToSection(key)}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
