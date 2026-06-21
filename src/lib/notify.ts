const RESEND_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Best-effort admin notification when a user signs in. Sends via the Resend
 * HTTP API. No-ops silently if the env vars aren't configured, and never
 * throws — a notification failure must not break the sign-in flow.
 *
 * Requires: RESEND_API_KEY, SIGNIN_NOTIFY_TO, SIGNIN_NOTIFY_FROM.
 */
export async function notifySignIn(userEmail: string | undefined) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SIGNIN_NOTIFY_TO;
  const from = process.env.SIGNIN_NOTIFY_FROM;
  if (!apiKey || !to || !from) return;

  const email = escapeHtml(userEmail ?? "unknown");
  const when = new Date().toUTCString();

  try {
    await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New FilmStack sign-in: ${email}`,
        html: `<p>A user just signed in to FilmStack.</p>
<p><strong>Email:</strong> ${email}<br/>
<strong>Time:</strong> ${when}</p>`,
      }),
    });
  } catch {
    // best-effort only — swallow errors so sign-in is never blocked
  }
}
