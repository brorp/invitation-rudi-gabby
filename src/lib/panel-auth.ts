import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "rudi_gabby_panel";
const SESSION_SECONDS = 60 * 60 * 12;

function secret() {
  return process.env.PANEL_SESSION_SECRET || process.env.PANEL_PASSWORD || "";
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isPanelConfigured() {
  return Boolean(process.env.PANEL_PASSWORD && secret());
}

export function verifyPanelPassword(value: string) {
  const expected = process.env.PANEL_PASSWORD;
  if (!expected) return false;
  return safeEqual(value, expected);
}

export function createPanelSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = String(expires);
  return `${payload}.${signature(payload)}`;
}

export function verifyPanelSession(token?: string) {
  if (!token || !secret()) return false;
  const [expires, tokenSignature] = token.split(".");
  if (!expires || !tokenSignature || Number(expires) < Date.now() / 1000) {
    return false;
  }
  return safeEqual(tokenSignature, signature(expires));
}

export async function isPanelAuthenticated() {
  const store = await cookies();
  return verifyPanelSession(store.get(COOKIE_NAME)?.value);
}

export async function requirePanelSession() {
  return isPanelAuthenticated();
}

export const panelCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_SECONDS,
};

