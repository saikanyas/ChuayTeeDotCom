// supabase/functions/push-notify/index.ts
// Supabase Edge Function – daily push reminder for ช่วยที.com
// Deploy: supabase functions deploy push-notify
// Trigger via pg_cron every minute, or via HTTP webhook from your scheduler.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Web Push (VAPID) via web-push-js on deno ───────────────────────────────
// Using a lightweight VAPID signing approach with Deno's built-in crypto.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@chuaytee.com";

const PUSH_PAYLOAD = JSON.stringify({
  title: "ช่วยที.com",
  body: "อย่าลืมบันทึกรายการวันนี้นะ 💰",
  icon: "/icons/icon-192.png",
  badge: "/icons/badge-72.png",
  tag: "daily-reminder",
});

// ── Helpers ────────────────────────────────────────────────────────────────

/** Bangkok time as HH:MM string */
function bangkokHHMM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Base64url encode a Uint8Array */
function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Decode base64url to Uint8Array */
function fromB64url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Build a VAPID Authorization header value */
async function vapidAuth(audience: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64url(
    new TextEncoder().encode(
      JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: VAPID_SUBJECT })
    )
  );
  const signingInput = `${header}.${claims}`;

  const privateKeyBytes = fromB64url(VAPID_PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    // VAPID private keys are raw 32-byte EC scalars; wrap in PKCS8 if needed.
    // Assuming the env var holds a PKCS8 DER base64url for simplicity.
    privateKeyBytes.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  return `vapid t=${header}.${claims}.${b64url(sig)}, k=${VAPID_PUBLIC_KEY}`;
}

/** Send a Web Push notification to a single subscription */
async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const authHeader = await vapidAuth(audience);

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      TTL: "86400",
    },
    body: PUSH_PAYLOAD,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Push failed ${res.status}: ${text}`);
  }
}

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  try {
    const currentTime = bangkokHHMM(); // e.g. "20:00"

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch users whose reminder_time matches current minute (±0; cron fires every minute)
    const { data: users, error } = await supabase
      .from("notification_settings")
      .select("user_id, push_subscription, reminder_time")
      .eq("enabled", true)
      .not("push_subscription", "is", null)
      // Compare stored TIME (HH:MM:SS) prefix against current HH:MM
      .like("reminder_time", `${currentTime}%`);

    if (error) throw error;

    const results = await Promise.allSettled(
      (users ?? []).map(async (row) => {
        const sub = row.push_subscription as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };
        await sendPush(sub);
        return row.user_id;
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({ ok: true, time: currentTime, sent, failed }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("push-notify error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
