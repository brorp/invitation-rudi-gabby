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

const ATTENDANCE_OPTIONS = [
  { value: "both", label: "We'll attend both!" },
  { value: "holy_matrimony_only", label: "Holy Matrimony only" },
  { value: "reception_only", label: "Reception only" },
  { value: "not_attending", label: "Regretfully cannot attend" },
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
}: {
  sectionKey: string;
  media: SectionMedia;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={sectionKey}
      data-section={sectionKey}
      className={"invitation-section " + className}
      style={backgroundStyle(media)}
    >
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
  const [opened, setOpened] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(true);
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
  const content = settings.content;
  const guestName = invitee?.full_name || "Our Beloved Guest";

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
    setRsvpState("Sending your confirmation…");
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
        ? "Thank you — your attendance has been confirmed."
        : result.error || "We could not save your RSVP yet.",
    );
  }

  async function submitWish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitee) return;
    setWishState("Posting your wish…");
    const form = new FormData(event.currentTarget);
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
      event.currentTarget.reset();
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
    <main className={"invitation-shell " + (opened ? "is-open" : "is-closed")}>
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
          <p>Eleventh of October · Two Thousand Twenty Six</p>
          <h2>{content.coupleFormal}</h2>
        </div>
      </aside>

      <div className="story-column">
        {!opened ? (
          <section
            className="invitation-cover"
            style={backgroundStyle(media("cover"))}
          >
            <div className="cover-content">
              <p className="eyebrow">With joyful hearts, we invite you to</p>
              <h1>
                celebrate
                <em>the beginning of our forever.</em>
              </h1>
              <OrnamentalLine />
              <h2>{content.coupleShort}</h2>
              <p className="cover-date">{content.weddingDate}</p>
              <div className="guest-card">
                <span>Dear</span>
                <strong>{guestName}</strong>
                <small>
                  {isPrivate
                    ? "We apologize if there's any misspelling of name"
                    : "Wedding information · public view"}
                </small>
              </div>
              <button className="pill-button light" onClick={openInvitation}>
                Open invitation <ChevronUp size={15} />
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="story-scroll" ref={paneRef}>
              <InvitationSection sectionKey="intro" media={media("intro")}>
                <div className="intro-mark">R · G</div>
                <p className="eyebrow">We invite you to celebrate</p>
                <h2 className="display-title">
                  our next
                  <em>chapter</em>
                </h2>
                <div className="intro-copy">
                  {content.intro.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <OrnamentalLine />
                <h3 className="script-name">{content.coupleFormal}</h3>
                <p className="date-line">{content.weddingDate}</p>
                <p className="venue-line">{content.receptionVenue}</p>
                <button
                  className="scroll-cue"
                  onClick={() => goToSection("groom")}
                >
                  Scroll up <ChevronUp size={14} />
                </button>
              </InvitationSection>

              <InvitationSection
                sectionKey="groom"
                media={media("groom")}
                className="profile-section align-bottom"
              >
                <p className="eyebrow tracking">{content.groom.label}</p>
                <h2 className="profile-name">{content.groom.nickname}</h2>
                <p className="formal-name">( {content.groom.fullName} )</p>
                <div className="profile-family">
                  <span>{content.groom.familyLabel}</span>
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
                <p className="eyebrow tracking">{content.bride.label}</p>
                <h2 className="profile-name">{content.bride.nickname}</h2>
                <p className="formal-name">( {content.bride.fullName} )</p>
                <div className="profile-family">
                  <span>{content.bride.familyLabel}</span>
                  <strong>{content.bride.parents}</strong>
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
                <p className="eyebrow tracking">How it all began</p>
                <h2 className="section-title">
                  Our Journey
                  <em>to Forever</em>
                </h2>
                <div className="timeline">
                  <article>
                    <span>July 2013</span>
                    <h3>So Close, Yet Strangers</h3>
                    <p>
                      For two years, we walked the halls of the same school —
                      in the same place, at the same time — yet our paths never
                      crossed. Our story was waiting for the right time.
                    </p>
                  </article>
                  <article>
                    <span>May 2023</span>
                    <h3>When Our Paths Finally Crossed</h3>
                    <p>
                      Ten years later, social media brought two familiar
                      strangers together. A connection became countless
                      moments, shared challenges, and home.
                    </p>
                  </article>
                  <article>
                    <span>October 2026</span>
                    <h3>Our Forever Begins</h3>
                    <p>
                      Thirteen years after those hallways, we are ready for our
                      greatest adventure yet. Our story together is only
                      beginning.
                    </p>
                  </article>
                </div>
                <p className="journey-signoff">Here&apos;s to forever.</p>
              </InvitationSection>

              <InvitationSection
                sectionKey="events"
                media={media("events")}
                className="events-section"
              >
                <p className="eyebrow tracking">Save the celebration</p>
                <h2 className="section-title">
                  Come Celebrate
                  <em>Our Love</em>
                </h2>
                <p className="event-date">
                  Sunday <b>11</b> October 2026
                </p>
                <div className="event-list">
                  {content.events.map((event) => (
                    <article key={event.title}>
                      <span>{event.title}</span>
                      <h3>{event.time}</h3>
                      <p>{event.venue}</p>
                      <a href={event.mapUrl} target="_blank" rel="noreferrer">
                        <MapPin size={13} /> Show maps
                      </a>
                    </article>
                  ))}
                </div>
              </InvitationSection>

              <InvitationSection
                sectionKey="countdown"
                media={media("countdown")}
              >
                <p className="eyebrow tracking">Almost time</p>
                <h2 className="section-title">
                  Counting Down
                  <em>to Forever</em>
                </h2>
                <div className="countdown-grid">
                  {(
                    [
                      ["Days", countdown.days],
                      ["Hours", countdown.hours],
                      ["Minutes", countdown.minutes],
                      ["Seconds", countdown.seconds],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <strong>{String(value).padStart(2, "0")}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <a
                  className="outline-button"
                  href={calendarUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CalendarDays size={15} /> Save the date
                </a>
              </InvitationSection>

              <InvitationSection sectionKey="dress" media={media("dress")}>
                <p className="eyebrow tracking">A note on attire</p>
                <h2 className="section-title">
                  What to
                  <em>Wear</em>
                </h2>
                <p className="section-copy">
                  We invite you to dress up and make the evening as beautiful
                  as the celebration itself.
                </p>
                <div className="palette" aria-label="Suggested color palette">
                  {["#161616", "#5b5751", "#968d81", "#d1c7ba", "#ece6dd"].map(
                    (color) => (
                      <span key={color} style={{ backgroundColor: color }} />
                    ),
                  )}
                </div>
                <div className="dress-silhouettes" aria-hidden="true">
                  <div className="dress-one" />
                  <div className="dress-two" />
                </div>
                <p className="tiny-note">
                  Formal evening attire · neutral and earthy tones
                </p>
              </InvitationSection>

              <InvitationSection
                sectionKey="rsvp"
                media={media("rsvp")}
                className="form-section"
              >
                <p className="eyebrow tracking">Kindly reply</p>
                <h2 className="section-title">
                  Attendance
                  <em>Confirmation</em>
                </h2>
                {!isPrivate ? (
                  <div className="submitted-form-state public-information-state">
                    <CalendarDays size={20} />
                    <strong>Wedding information</strong>
                    <span>
                      RSVP is available only through a personal invitation link.
                    </span>
                  </div>
                ) : !rsvpSubmitted ? (
                <form onSubmit={submitRsvp} className="invitation-form">
                  <label>
                    <span>Name</span>
                    <input
                      name="guestName"
                      defaultValue={guestName}
                      required
                      readOnly={Boolean(invitee)}
                    />
                  </label>
                  <div className="attendance-picker-group">
                    <span className="picker-label">Attendance</span>
                    <div
                      className="attendance-options-list"
                      role="radiogroup"
                      aria-label="Attendance status"
                    >
                      {ATTENDANCE_OPTIONS.map((option) => {
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
                      <span>How many will attend</span>
                      <select
                        name="paxAttending"
                        defaultValue={invitee?.pax_attending || 1}
                      >
                        {Array.from(
                          { length: invitee?.pax_allowed || 2 },
                          (_, index) => index + 1,
                        ).map((pax) => (
                          <option value={pax} key={pax}>
                            {pax} pax
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button className="solid-button" type="submit">
                    Confirm attendance <Check size={15} />
                  </button>
                  {rsvpState && <p className="form-state">{rsvpState}</p>}
                </form>
                ) : (
                  <div className="submitted-form-state">
                    <Check size={20} />
                    <strong>RSVP already submitted</strong>
                    <span>
                      {rsvpState ||
                        `Status: ${invitee?.status} · ${invitee?.pax_attending || 0} pax`}
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
                    className={
                      "gallery-placeholder gallery-position-" +
                      (galleryIndex % 3)
                    }
                    style={{
                      backgroundImage:
                        "url('" + media("gallery").imageUrl + "')",
                    }}
                    role="img"
                    aria-label={"Pre-wedding image " + (galleryIndex + 1)}
                  />
                  <span>{String(galleryIndex + 1).padStart(2, "0")} / 11</span>
                </div>
                <div className="gallery-controls">
                  <button
                    aria-label="Previous image"
                    onClick={() =>
                      setGalleryIndex((current) => (current + 10) % 11)
                    }
                  >
                    <ArrowLeft size={17} />
                  </button>
                  <p>Click image for preview</p>
                  <button
                    aria-label="Next image"
                    onClick={() =>
                      setGalleryIndex((current) => (current + 1) % 11)
                    }
                  >
                    <ArrowRight size={17} />
                  </button>
                </div>
              </InvitationSection>

              <InvitationSection sectionKey="video" media={media("video")}>
                <p className="eyebrow tracking">From the island of gods</p>
                <h2 className="section-title">
                  Our Pre-Wedding
                  <em>Video in Bali</em>
                </h2>
                <button className="video-play" aria-label="Play video">
                  <Play size={24} fill="currentColor" />
                </button>
                <p className="section-copy">
                  The film will be added here soon. This section is ready for a
                  video URL from the panel.
                </p>
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
                aria-label="Open invitation navigation"
              >
                <Menu size={18} />
              </button>
              <span>
                {String(currentNumber).padStart(2, "0")} /{" "}
                {String(SECTION_LINKS.length).padStart(2, "0")}
              </span>
              <button
                onClick={() => setMuted((value) => !value)}
                aria-label={muted ? "Turn music on" : "Mute music"}
              >
                {muted ? <VolumeX size={17} /> : <Music2 size={17} />}
              </button>
            </div>

            {menuOpen && (
              <div className="menu-overlay" role="dialog" aria-modal="true">
                <button
                  className="menu-close"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
                <p>Navigate the invitation</p>
                <nav>
                  {SECTION_LINKS.map(([key, label], index) => (
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
