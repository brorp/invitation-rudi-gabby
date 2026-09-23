"use client";

import { upload } from "@imagekit/next";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Clipboard,
  Database,
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  Gauge,
  Heart,
  ImageUp,
  LayoutGrid,
  LogOut,
  MessageCircle,
  MessageSquareHeart,
  Music2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UploadCloud,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ChangeEvent,
  useMemo,
  useState,
} from "react";

import type { GalleryImage, Invitee, SiteSettings, Wish } from "@/lib/types";

type Tab = "overview" | "invitees" | "content" | "media" | "wishes";

type SortKey =
  | "full_name"
  | "status"
  | "pax"
  | "attendance_status"
  | "created_at";
type SortDir = "asc" | "desc";

type Props = {
  initialSettings: SiteSettings;
  initialInvitees: Invitee[];
  initialWishes: Wish[];
  supabaseConfigured: boolean;
  imageKitConfigured: boolean;
};

const NAV_ITEMS: Array<{
  key: Tab;
  label: string;
  icon: typeof Gauge;
}> = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "invitees", label: "Invitees", icon: UsersRound },
  { key: "content", label: "Content", icon: Pencil },
  { key: "media", label: "Page visuals", icon: FileImage },
  { key: "wishes", label: "Wishes", icon: MessageSquareHeart },
];

function whatsappInvitationMessage(inviteUrl: string) {
  return [
    "Dengan hati yang gembira, kami ingin mengajak kamu untuk ikut merayakan hari bahagia kami, pernikahan Rudi & Gabriella! ♡",
    "*Minggu, 11 Oktober 2026*",
    "📍 Sheraton Grand Jakarta Gandaria City Hotel",
    inviteUrl,
    "Jangan lupa konfirmasi kehadiran dan jumlah tamu yang datang lewat link di atas, ya!",
    "Sampai ketemu di hari bahagia kami. Can’t wait to see you there! ♡",
  ].join("\n\n");
}

function jsonFetch(url: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

export function PanelDashboard({
  initialSettings,
  initialInvitees,
  initialWishes,
  supabaseConfigured,
  imageKitConfigured,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [invitees, setInvitees] = useState(initialInvitees);
  const [wishes, setWishes] = useState(initialWishes);
  const [settings, setSettings] = useState(initialSettings);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Invitee | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filteredInvitees = useMemo(() => {
    const query = search.toLowerCase();
    const filtered = invitees.filter((invitee) => {
      if (!query) return true;
      return (
        invitee.full_name.toLowerCase().includes(query) ||
        Boolean(invitee.phone?.toLowerCase().includes(query)) ||
        (invitee.status || "pending").toLowerCase().includes(query) ||
        Boolean(invitee.attendance_status?.toLowerCase().includes(query)) ||
        Boolean(invitee.notes?.toLowerCase().includes(query)) ||
        invitee.id.toLowerCase().includes(query) ||
        String(invitee.pax_attending ?? "").includes(query) ||
        String(invitee.pax_allowed).includes(query)
      );
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "full_name") {
        cmp = a.full_name.localeCompare(b.full_name);
      } else if (sortKey === "status") {
        cmp = (a.status || "pending").localeCompare(b.status || "pending");
      } else if (sortKey === "pax") {
        cmp = (a.pax_attending ?? 0) - (b.pax_attending ?? 0);
      } else if (sortKey === "attendance_status") {
        cmp = (a.attendance_status ?? "").localeCompare(b.attendance_status ?? "");
      } else if (sortKey === "created_at") {
        cmp = a.created_at.localeCompare(b.created_at);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [invitees, search, sortKey, sortDir]);

  const wishByInvitee = useMemo(() => {
    const byInvitee = new Map<string, Wish>();
    for (const wish of wishes) {
      if (wish.invitee_id && !byInvitee.has(wish.invitee_id)) {
        byInvitee.set(wish.invitee_id, wish);
      }
    }
    return byInvitee;
  }, [wishes]);

  const stats = useMemo(() => {
    const confirmed = invitees.filter(
      (item) => (item.status || "pending") !== "pending",
    ).length;
    const pax = invitees.reduce(
      (total, item) => total + (item.pax_attending || 0),
      0,
    );
    return { confirmed, pax, wishCount: wishes.length };
  }, [invitees, wishes]);

  function updateContent<K extends keyof SiteSettings["content"]>(
    key: K,
    value: SiteSettings["content"][K],
  ) {
    setSettings((current) => ({
      ...current,
      content: { ...current.content, [key]: value },
    }));
  }

  function updateBank(key: keyof SiteSettings["content"]["bank"], value: string) {
    setSettings((current) => ({
      ...current,
      content: {
        ...current.content,
        bank: { ...current.content.bank, [key]: value },
      },
    }));
  }

  async function addInvitee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    const form = new FormData(formElement);
    const response = await jsonFetch("/api/panel/invitees", {
      method: "POST",
      body: JSON.stringify({
        full_name: form.get("full_name"),
        phone: form.get("phone"),
        pax_allowed: Number(form.get("pax_allowed")),
        notes: form.get("notes"),
      }),
    });
    const result = await response.json();
    if (response.ok) {
      setInvitees((current) => [result.invitee, ...current]);
      setAddOpen(false);
      setMessage("Invitee added.");
      formElement.reset();
    } else setMessage(result.error || "Unable to add invitee.");
  }

  async function importInvitees(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/panel/invitees/import", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Import failed.");
      setInvitees((current) => [...(result.invitees || []), ...current]);
      setMessage(
        `${result.imported} invitees imported${result.skipped ? ` · ${result.skipped} skipped` : ""}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  async function updateInvitee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const response = await jsonFetch("/api/panel/invitees/" + editing.id, {
      method: "PATCH",
      body: JSON.stringify({
        full_name: form.get("full_name"),
        phone: form.get("phone"),
        pax_allowed: Number(form.get("pax_allowed")),
        notes: form.get("notes"),
      }),
    });
    const result = await response.json();
    if (response.ok) {
      setInvitees((current) =>
        current.map((item) =>
          item.id === editing.id ? result.invitee : item,
        ),
      );
      setEditing(null);
      setMessage("Invitee updated.");
    } else setMessage(result.error || "Unable to update invitee.");
  }

  async function deleteInvitee(id: string) {
    if (!window.confirm("Delete this invitee and revoke their link?")) return;
    const response = await fetch("/api/panel/invitees/" + id, {
      method: "DELETE",
    });
    const result = await response.json();
    if (response.ok) {
      setInvitees((current) => current.filter((item) => item.id !== id));
      setMessage("Invitee deleted.");
    } else setMessage(result.error || "Unable to delete invitee.");
  }

  async function rotateInviteLink(invitee: Invitee) {
    if (
      !window.confirm(
        "Generate a new secure link? The current invitation link will stop working immediately.",
      )
    )
      return;
    const response = await jsonFetch("/api/panel/invitees/" + invitee.id, {
      method: "PATCH",
      body: JSON.stringify({
        full_name: invitee.full_name,
        phone: invitee.phone,
        pax_allowed: invitee.pax_allowed,
        notes: invitee.notes,
        rotateToken: true,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      setInvitees((current) =>
        current.map((item) =>
          item.id === invitee.id ? result.invitee : item,
        ),
      );
      setMessage("A new secure invitation link was generated.");
    } else setMessage(result.error || "Unable to regenerate the link.");
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    const response = await jsonFetch("/api/panel/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    if (response.ok) {
      setSettings((current) => ({ ...current, ...result.settings }));
      setMessage("Website settings saved.");
      router.refresh();
    } else setMessage(result.error || "Unable to save settings.");
    setSaving(false);
  }

  function updateMediaUrl(key: string, imageUrl: string, fileId?: string) {
    setSettings((current) => ({
      ...current,
      media: current.media.map((item) =>
        item.key === key
          ? {
              ...item,
              imageUrl,
              imageKitFileId: fileId || item.imageKitFileId,
            }
          : item,
      ),
    }));
  }

  async function uploadMedia(
    event: ChangeEvent<HTMLInputElement>,
    key: string,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setUploadingKey(key);
    setMessage("");
    try {
      const authResponse = await fetch("/api/panel/upload-auth");
      const auth = await authResponse.json();
      if (!authResponse.ok) throw new Error(auth.error || "Upload unavailable.");
      const result = await upload({
        file,
        fileName: file.name,
        folder: "/invitation-rudi-gabby",
        useUniqueFileName: true,
        publicKey: auth.publicKey,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
      });
      if (!result.url) throw new Error("ImageKit returned no image URL.");
      updateMediaUrl(key, result.url, result.fileId);
      setMessage("Image uploaded. Save website settings to publish it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingKey("");
      input.value = "";
    }
  }

  async function uploadGallery(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    setUploadingKey("gallery");
    setMessage("");
    try {
      const uploaded: GalleryImage[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not an image.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 10 MB.`);
        }
        const authResponse = await fetch("/api/panel/upload-auth");
        const auth = await authResponse.json();
        if (!authResponse.ok) {
          throw new Error(auth.error || "Upload unavailable.");
        }
        const result = await upload({
          file,
          fileName: file.name,
          folder: "/invitation-rudi-gabby/gallery",
          useUniqueFileName: true,
          publicKey: auth.publicKey,
          token: auth.token,
          signature: auth.signature,
          expire: auth.expire,
        });
        if (!result.url) throw new Error("ImageKit returned no image URL.");
        uploaded.push({
          id: result.fileId || crypto.randomUUID(),
          imageUrl: result.url,
          imageKitFileId: result.fileId,
        });
      }
      setSettings((current) => ({
        ...current,
        gallery:
          current.gallery.length === 1 &&
          current.gallery[0]?.id === "default-gallery-1"
            ? uploaded
            : [...current.gallery, ...uploaded],
      }));
      setMessage(
        `${uploaded.length} gallery image${uploaded.length === 1 ? "" : "s"} uploaded. Save visuals to publish.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingKey("");
      input.value = "";
    }
  }

  function removeGalleryImage(id: string) {
    setSettings((current) => ({
      ...current,
      gallery: current.gallery.filter((image) => image.id !== id),
    }));
  }

  async function uploadAudio(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setMessage("Please select an audio file.");
      input.value = "";
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setMessage("Audio file must be 20 MB or smaller.");
      input.value = "";
      return;
    }
    setUploadingKey("music");
    setMessage("");
    try {
      const authResponse = await fetch("/api/panel/upload-auth");
      const auth = await authResponse.json();
      if (!authResponse.ok) {
        throw new Error(auth.error || "Upload unavailable.");
      }
      const result = await upload({
        file,
        fileName: file.name,
        folder: "/invitation-rudi-gabby/audio",
        useUniqueFileName: true,
        publicKey: auth.publicKey,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
      });
      if (!result.url) throw new Error("ImageKit returned no audio URL.");
      updateContent("music", {
        ...settings.content.music,
        audioUrl: result.url,
      });
      setMessage("Music uploaded. Save changes to publish it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingKey("");
      input.value = "";
    }
  }

  async function deleteWish(id: string) {
    if (!window.confirm("Delete this wish?")) return;
    const response = await fetch("/api/panel/wishes/" + id, {
      method: "DELETE",
    });
    const result = await response.json();
    if (response.ok) {
      setWishes((current) => current.filter((wish) => wish.id !== id));
    } else setMessage(result.error || "Unable to delete wish.");
  }

  async function copyInviteLink(accessToken: string) {
    const url =
      window.location.origin + "/invite/" + encodeURIComponent(accessToken);
    await navigator.clipboard.writeText(url);
    setMessage("Invitation link copied.");
  }

  function makeWaLink(invitee: Invitee) {
    if (!invitee.phone) return null;
    const inviteUrl =
      window.location.origin + "/invite/" + encodeURIComponent(invitee.access_token);
    const text = whatsappInvitationMessage(inviteUrl);
    let phone = invitee.phone.replace(/[^\d]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    else if (phone.startsWith("8")) phone = "62" + phone;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  async function logout() {
    await fetch("/api/panel/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <main className="panel-shell">
      <aside className="panel-sidebar">
        <div className="panel-brand">
          <div>
            <span>R</span>
            <i />
            <span>G</span>
          </div>
          <p>Wedding Panel</p>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? "active" : ""}
              onClick={() => setTab(item.key)}
            >
              <item.icon size={17} />
              {item.label}
              {item.key === "wishes" && stats.wishCount > 0 && (
                <span>{stats.wishCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="panel-sidebar-footer">
          {invitees[0] ? (
            <a
              href={"/invite/" + encodeURIComponent(invitees[0].access_token)}
              target="_blank"
            >
              <ExternalLink size={15} /> Preview invitation
            </a>
          ) : (
            <button onClick={() => setMessage("Add an invitee to preview the invitation.")}>
              <ExternalLink size={15} /> Preview invitation
            </button>
          )}
          <button onClick={logout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <section className="panel-workspace">
        <header className="panel-topbar">
          <div>
            <p>Rudi & Gabriella</p>
            <h1>{NAV_ITEMS.find((item) => item.key === tab)?.label}</h1>
          </div>
        </header>

        {!supabaseConfigured && (
          <div className="panel-notice">
            <Database size={18} />
            <div>
              <strong>Database connection is waiting for credentials</strong>
              <p>
                Run supabase/schema.sql, then add the Supabase URL and service
                role key to .env.local.
              </p>
            </div>
          </div>
        )}

        {message && (
          <div className="panel-message">
            {message}
            <button onClick={() => setMessage("")} aria-label="Dismiss message">
              <X size={14} />
            </button>
          </div>
        )}

        {tab === "overview" && (
          <div className="panel-view">
            <div className="metric-grid">
              <article>
                <UsersRound size={19} />
                <span>Total invitees</span>
                <strong>{invitees.length}</strong>
                <p>Across all invitation links</p>
              </article>
              <article>
                <Check size={19} />
                <span>Responded</span>
                <strong>{stats.confirmed}</strong>
                <p>Attendance responses received</p>
              </article>
              <article>
                <UserRound size={19} />
                <span>Attending pax</span>
                <strong>{stats.pax}</strong>
                <p>Current confirmed headcount</p>
              </article>
              <article>
                <Heart size={19} />
                <span>Public wishes</span>
                <strong>{stats.wishCount}</strong>
                <p>Published guest comments</p>
              </article>
            </div>
          </div>
        )}

        {tab === "invitees" && (
          <div className="panel-view">
            <div className="panel-actions">
              <label className="panel-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, phone, status, notes…"
                />
              </label>
              <div className="panel-action-buttons">
                <a
                  className="panel-secondary"
                  href="/api/panel/invitees/template"
                  download
                >
                  <Download size={15} /> XLSX template
                </a>
                <label className="panel-secondary panel-import-button">
                  <FileSpreadsheet size={15} />
                  {importing ? "Importing…" : "Import XLSX"}
                  <input
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={importInvitees}
                    disabled={importing || !supabaseConfigured}
                  />
                </label>
                <button className="panel-primary" onClick={() => setAddOpen(true)}>
                  <Plus size={16} /> Add invitee
                </button>
              </div>
            </div>
            <div className="panel-table-wrap">
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>
                      <button
                        className="sort-th"
                        onClick={() => toggleSort("created_at")}
                        aria-label="Sort by date added"
                      >
                        ID
                        {sortKey === "created_at" ? (
                          sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                        ) : <ArrowUpDown size={10} />}
                      </button>
                    </th>
                    <th>
                      <button
                        className="sort-th"
                        onClick={() => toggleSort("full_name")}
                        aria-label="Sort by name"
                      >
                        Full name
                        {sortKey === "full_name" ? (
                          sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                        ) : <ArrowUpDown size={10} />}
                      </button>
                    </th>
                    <th>Submission identity</th>
                    <th>
                      <button
                        className="sort-th"
                        onClick={() => toggleSort("status")}
                        aria-label="Sort by status"
                      >
                        Status
                        {sortKey === "status" ? (
                          sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                        ) : <ArrowUpDown size={10} />}
                      </button>
                    </th>
                    <th>
                      <button
                        className="sort-th"
                        onClick={() => toggleSort("pax")}
                        aria-label="Sort by pax attending"
                      >
                        Pax
                        {sortKey === "pax" ? (
                          sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                        ) : <ArrowUpDown size={10} />}
                      </button>
                    </th>
                    <th>Wish</th>
                    <th>Send / Link</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredInvitees.map((invitee) => (
                    <tr key={invitee.id}>
                      <td>
                        <code className="table-id" title={invitee.id}>
                          {invitee.id.slice(0, 8)}
                        </code>
                      </td>
                      <td>
                        <strong>{invitee.full_name}</strong>
                        <span>{invitee.phone || "No phone number"}</span>
                      </td>
                      <td>
                        {invitee.submission_fingerprint ? (
                          <span
                            className="identity-hash"
                            title={invitee.submission_fingerprint}
                          >
                            {invitee.submission_fingerprint.slice(0, 12)}…
                          </span>
                        ) : (
                          <span className="not-submitted">Not submitted</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            "attendance-pill " + (invitee.status || "pending")
                          }
                        >
                          {invitee.status || "pending"}
                        </span>
                      </td>
                      <td>
                        {invitee.pax_attending ?? 0} / {invitee.pax_allowed}
                      </td>
                      <td>
                        <span
                          className="table-wish"
                          title={wishByInvitee.get(invitee.id)?.message}
                        >
                          {wishByInvitee.get(invitee.id)?.message || "No wish yet"}
                        </span>
                      </td>
                      <td>
                        <div className="link-cell">
                          {invitee.phone && (
                            <a
                              className="wa-link"
                              href={makeWaLink(invitee) ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Send WhatsApp to ${invitee.full_name}`}
                            >
                              <MessageCircle size={13} /> WA
                            </a>
                          )}
                          <button
                            className="copy-link"
                            onClick={() => copyInviteLink(invitee.access_token)}
                          >
                            <Clipboard size={13} /> Copy link
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            aria-label={"Edit " + invitee.full_name}
                            onClick={() => setEditing(invitee)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            aria-label={"Regenerate link for " + invitee.full_name}
                            onClick={() => rotateInviteLink(invitee)}
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            aria-label={"Delete " + invitee.full_name}
                            onClick={() => deleteInvitee(invitee.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvitees.length === 0 && (
                    <tr>
                      <td colSpan={8} className="empty-table">
                        No invitees yet. Add one to generate a personal link.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "content" && (
          <div className="panel-view content-view">
            <div className="settings-header">
              <div>
                <p>Edit the core invitation details. Section copy can be expanded in the next iteration.</p>
              </div>
              <button
                className="panel-primary"
                onClick={saveSettings}
                disabled={saving}
              >
                <Save size={16} /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
            <div className="settings-grid">
              <article className="panel-card settings-card">
                <h2>General</h2>
                <label>
                  <span>Short couple name</span>
                  <input
                    value={settings.content.coupleShort}
                    onChange={(event) =>
                      updateContent("coupleShort", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Formal couple name</span>
                  <input
                    value={settings.content.coupleFormal}
                    onChange={(event) =>
                      updateContent("coupleFormal", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Display date</span>
                  <input
                    value={settings.content.weddingDate}
                    onChange={(event) =>
                      updateContent("weddingDate", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Countdown date (ISO)</span>
                  <input
                    value={settings.content.weddingDateIso}
                    onChange={(event) =>
                      updateContent("weddingDateIso", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Reception venue</span>
                  <input
                    value={settings.content.receptionVenue}
                    onChange={(event) =>
                      updateContent("receptionVenue", event.target.value)
                    }
                  />
                </label>
              </article>
              <article className="panel-card settings-card">
                <h2>Wedding gift</h2>
                <label>
                  <span>Bank</span>
                  <input
                    value={settings.content.bank.bankName}
                    onChange={(event) =>
                      updateBank("bankName", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Account number</span>
                  <input
                    value={settings.content.bank.accountNumber}
                    onChange={(event) =>
                      updateBank("accountNumber", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Account holder</span>
                  <input
                    value={settings.content.bank.accountName}
                    onChange={(event) =>
                      updateBank("accountName", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Footer credit</span>
                  <input
                    value={settings.content.footerCredit}
                    onChange={(event) =>
                      updateContent("footerCredit", event.target.value)
                    }
                  />
                </label>
              </article>
              <article className="panel-card settings-card music-settings-card">
                <h2>Background music</h2>
                <p>
                  Configured for Beautiful Things by Benson Boone. Upload an
                  audio file you are licensed to use, or paste its direct URL.
                </p>
                <label>
                  <span>Song title</span>
                  <input
                    value={settings.content.music.title}
                    onChange={(event) =>
                      updateContent("music", {
                        ...settings.content.music,
                        title: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span>Artist</span>
                  <input
                    value={settings.content.music.artist}
                    onChange={(event) =>
                      updateContent("music", {
                        ...settings.content.music,
                        artist: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span>Direct audio URL</span>
                  <input
                    type="url"
                    value={settings.content.music.audioUrl}
                    placeholder="https://.../beautiful-things.mp3"
                    onChange={(event) =>
                      updateContent("music", {
                        ...settings.content.music,
                        audioUrl: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="upload-button music-upload-button">
                  <Music2 size={15} />
                  {uploadingKey === "music"
                    ? "Uploading…"
                    : "Upload licensed audio with ImageKit"}
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={uploadAudio}
                    disabled={!imageKitConfigured || Boolean(uploadingKey)}
                  />
                </label>
              </article>
            </div>
          </div>
        )}

        {tab === "media" && (
          <div className="panel-view media-view">
            <div className="settings-header">
              <p>
                Upload or paste a URL for every page background. Placeholder
                art stays available until the final photography arrives.
              </p>
              <button
                className="panel-primary"
                onClick={saveSettings}
                disabled={saving}
              >
                <Save size={16} /> {saving ? "Saving…" : "Publish visuals"}
              </button>
            </div>
            <article className="panel-card gallery-manager">
              <div className="gallery-manager-heading">
                <div>
                  <span>Page 11 / 13</span>
                  <h2>Gallery carousel</h2>
                  <p>
                    Upload several images at once. Their order here is the
                    carousel order on the invitation.
                  </p>
                </div>
                <label className="upload-button gallery-upload-button">
                  <ImageUp size={16} />
                  {uploadingKey === "gallery"
                    ? "Uploading…"
                    : "Upload multiple images"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={uploadGallery}
                    disabled={!imageKitConfigured || Boolean(uploadingKey)}
                  />
                </label>
              </div>
              <div className="gallery-manager-grid">
                {settings.gallery.map((image, index) => (
                  <div className="gallery-manager-item" key={image.id}>
                    <div
                      style={{ backgroundImage: `url('${image.imageUrl}')` }}
                      role="img"
                      aria-label={`Gallery image ${index + 1}`}
                    />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(image.id)}
                      aria-label={`Remove gallery image ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {settings.gallery.length === 0 && (
                  <p className="gallery-manager-empty">
                    No custom gallery photos yet. The page background remains
                    as the fallback image.
                  </p>
                )}
              </div>
            </article>
            <div className="media-grid">
              {settings.media.map((item, index) => (
                <article className="media-card" key={item.key}>
                  <div
                    className="media-preview"
                    style={{ backgroundImage: "url('" + item.imageUrl + "')" }}
                  >
                    <span>{String(index).padStart(2, "0")}</span>
                  </div>
                  <div className="media-card-body">
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.key}</span>
                    </div>
                    <input
                      value={item.imageUrl}
                      onChange={(event) =>
                        updateMediaUrl(item.key, event.target.value)
                      }
                      aria-label={item.label + " image URL"}
                    />
                    <label className="upload-button">
                      <UploadCloud size={15} />
                      {uploadingKey === item.key
                        ? "Uploading…"
                        : "Upload with ImageKit"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => uploadMedia(event, item.key)}
                        disabled={!imageKitConfigured || Boolean(uploadingKey)}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "wishes" && (
          <div className="panel-view">
            <div className="wish-admin-grid">
              {wishes.map((wish) => (
                <article className="wish-admin-card" key={wish.id}>
                  <div className="wish-admin-meta">
                    <div>
                      <strong>{wish.guest_name}</strong>
                      <span>
                        {new Intl.DateTimeFormat("en-ID", {
                          dateStyle: "medium",
                        }).format(new Date(wish.created_at))}
                      </span>
                    </div>
                    <span className="approved">Public</span>
                  </div>
                  <p>{wish.message}</p>
                  <div>
                    <button onClick={() => deleteWish(wish.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              ))}
              {wishes.length === 0 && (
                <div className="panel-empty-state">
                  <MessageSquareHeart size={25} />
                  <h2>No wishes yet</h2>
                  <p>Guest comments will appear here immediately.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {addOpen && (
        <div className="panel-modal-backdrop">
          <form className="panel-modal" onSubmit={addInvitee}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setAddOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span>New personal link</span>
            <h2>Add invitee</h2>
            <label>
              <span>Full name</span>
              <input
                name="full_name"
                placeholder="Ryan Pratama & Indri"
                required
              />
            </label>
            <div className="modal-row">
              <label>
                <span>Phone</span>
                <input name="phone" placeholder="+62…" />
              </label>
              <label>
                <span>Allowed pax</span>
                <input
                  name="pax_allowed"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue="2"
                />
              </label>
            </div>
            <label>
              <span>Internal notes</span>
              <textarea name="notes" rows={3} placeholder="Family / table / notes" />
            </label>
            <button className="panel-primary" type="submit">
              <Plus size={16} /> Create invitation link
            </button>
          </form>
        </div>
      )}

      {editing && (
        <div className="panel-modal-backdrop">
          <form className="panel-modal" onSubmit={updateInvitee}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditing(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span>Invitee record</span>
            <h2>Edit invitee</h2>
            <label>
              <span>Full name</span>
              <input
                name="full_name"
                defaultValue={editing.full_name}
                required
              />
            </label>
            <div className="modal-row">
              <label>
                <span>Phone</span>
                <input name="phone" defaultValue={editing.phone || ""} />
              </label>
              <label>
                <span>Allowed pax</span>
                <input
                  name="pax_allowed"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={editing.pax_allowed}
                />
              </label>
            </div>
            <label>
              <span>Internal notes</span>
              <textarea
                name="notes"
                rows={3}
                defaultValue={editing.notes || ""}
              />
            </label>
            <button className="panel-primary" type="submit">
              <Save size={16} /> Save invitee
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
