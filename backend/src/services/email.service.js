const { Resend } = require("resend");

let client = null;

function resendClient() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function isConfigured() {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key) && !/placeholder|replace_with|your_/i.test(key);
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || "StockFlow <onboarding@resend.dev>";

  if (!isConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    if (process.env.EMAIL_LOG_PREVIEW !== "false") {
      console.info(`[email preview] to=${to} subject="${subject}"`);
    }
    return { delivered: false, preview: true };
  }

  const { data, error } = await resendClient().emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
  });
  if (error) {
    const detail = error.message || String(error);
    const hint =
      /verify a domain|own email address|testing emails/i.test(detail)
        ? " Verify a domain in Resend and set EMAIL_FROM, or use the Resend account owner email for testing."
        : "";
    throw new Error(`Resend rejected email: ${detail}.${hint}`);
  }
  return { delivered: true, id: data?.id || null };
}

module.exports = { sendEmail, isConfigured };
