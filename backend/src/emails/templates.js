const APP_URL = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const BRAND = "#1F6F5C";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "soon";
  return date.toUTCString();
}

function layout({ preheader, title, intro, ctaLabel, ctaUrl, footer }) {
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeCtaUrl = escapeHtml(ctaUrl);
  const safePreheader = escapeHtml(preheader || intro);
  const safeFooter = escapeHtml(footer);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f7f6;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${safePreheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7f6;margin:0;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #d9e2df;border-radius:8px;">
            <tr>
              <td style="background-color:${BRAND};padding:24px 32px;border-radius:8px 8px 0 0;">
                <h1 style="margin:0;font-size:24px;line-height:1.3;color:#ffffff;font-weight:700;">StockFlow</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px 0;font-size:22px;line-height:1.35;color:#102a24;">${safeTitle}</h2>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#334155;">${safeIntro}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                  <tr>
                    <td align="center" style="border-radius:6px;background-color:${BRAND};">
                      <a href="${safeCtaUrl}" style="display:inline-block;padding:14px 24px;font-size:16px;line-height:1;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">${safeCtaLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:#475569;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;word-break:break-all;"><a href="${safeCtaUrl}" style="color:${BRAND};text-decoration:underline;">${safeCtaUrl}</a></p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">${safeFooter}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function invitationEmail({ email, role, businessName, expiresAt, token }) {
  const url = `${APP_URL()}/accept-invite?token=${encodeURIComponent(token)}`;
  const business = businessName || "your workspace";
  const safeRole = role || "user";
  const expires = formatDate(expiresAt);
  const subject = `You're invited to ${business} on StockFlow`;
  const intro = `You've been invited to join ${business} as ${safeRole}. Accept the invitation to create your account.`;
  const footer = `This invitation was sent to ${email} and expires on ${expires}. If you weren't expecting it, you can ignore this email.`;
  return {
    subject,
    html: layout({
      preheader: `Invitation to join ${business} as ${safeRole}`,
      title: "You've been invited",
      intro,
      ctaLabel: "Accept invitation",
      ctaUrl: url,
      footer,
    }),
    text: [
      subject,
      "",
      intro,
      "",
      `Accept invitation: ${url}`,
      "",
      footer,
    ].join("\n"),
  };
}

function passwordResetEmail({ name, token, expiresAt }) {
  const url = `${APP_URL()}/reset-password?token=${encodeURIComponent(token)}`;
  const recipient = name ? `Hi ${name},` : "Hi,";
  const expires = formatDate(expiresAt);
  const subject = "Reset your StockFlow password";
  const intro = `${recipient} we received a request to reset your StockFlow password. Use the button below to choose a new password.`;
  const footer = `This link expires on ${expires}. If you didn't request a password reset, you can safely ignore this email.`;
  return {
    subject,
    html: layout({
      preheader: "Reset your StockFlow password",
      title: "Reset your password",
      intro,
      ctaLabel: "Reset password",
      ctaUrl: url,
      footer,
    }),
    text: [subject, "", intro, "", `Reset password: ${url}`, "", footer].join("\n"),
  };
}

function passwordChangedEmail({ name, changedAt }) {
  const recipient = name ? `Hi ${name},` : "Hi,";
  const when = formatDate(changedAt || new Date());
  const subject = "Your StockFlow password was changed";
  const intro = `${recipient} your StockFlow password was changed on ${when}. If this was you, no further action is needed.`;
  const footer =
    "If you did not make this change, reset your password immediately and contact your workspace owner.";
  const supportUrl = `${APP_URL()}/login`;
  return {
    subject,
    html: layout({
      preheader: "Your StockFlow password was changed",
      title: "Password changed",
      intro,
      ctaLabel: "Sign in to StockFlow",
      ctaUrl: supportUrl,
      footer,
    }),
    text: [subject, "", intro, "", `Sign in: ${supportUrl}`, "", footer].join("\n"),
  };
}

module.exports = { invitationEmail, passwordResetEmail, passwordChangedEmail };
