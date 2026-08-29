"use client";

import { KeyRound, LockKeyhole } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PanelLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/panel/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      router.refresh();
    } else {
      setMessage(result.error || "Unable to sign in.");
      setLoading(false);
    }
  }

  return (
    <main className="panel-login-page">
      <section className="panel-login-card">
        <div className="panel-login-brand">
          <span>R</span>
          <i />
          <span>G</span>
        </div>
        <div className="panel-login-icon">
          <LockKeyhole size={22} />
        </div>
        <p>Private administration</p>
        <h1>Wedding Panel</h1>
        <p className="panel-login-copy">
          Manage invitees, attendance, wishes, content, and every page visual.
        </p>
        <form onSubmit={login}>
          <label>
            <span>Panel password</span>
            <div>
              <KeyRound size={16} />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={!configured}
              />
            </div>
          </label>
          <button type="submit" disabled={loading || !configured}>
            {loading ? "Checking…" : "Enter panel"}
          </button>
          {!configured && (
            <p className="panel-auth-message">
              Add PANEL_PASSWORD and PANEL_SESSION_SECRET to .env.local first.
            </p>
          )}
          {message && <p className="panel-auth-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}

