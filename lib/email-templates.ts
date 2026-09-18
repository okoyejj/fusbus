export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character] ?? character);
}

function layout(name: string, message: string, actionLabel: string, actionUrl: string, logoUrl: string) {
  const safeName = escapeHtml(name.trim() || "there");
  const safeMessage = escapeHtml(message);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeActionUrl = escapeHtml(actionUrl);
  const safeLogoUrl = escapeHtml(logoUrl);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f5f4;font-family:Arial,sans-serif;color:#1c1917">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f5f5f4">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px">
          <tr><td><img src="${safeLogoUrl}" width="160" alt="FusBus" style="display:block;max-width:160px;height:auto;margin-bottom:28px"></td></tr>
          <tr><td style="font-size:18px;font-weight:700;padding-bottom:16px">Hello ${safeName},</td></tr>
          <tr><td style="font-size:16px;line-height:1.6;padding-bottom:24px">${safeMessage}</td></tr>
          <tr><td style="padding-bottom:28px"><a href="${safeActionUrl}" style="display:inline-block;background:#14532d;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">${safeActionLabel}</a></td></tr>
          <tr><td style="font-size:14px;line-height:1.6;color:#57534e">Kind regards,<br>The FusBus Cameroon team</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmail(input: { name: string; applicationUrl: string; logoUrl: string }): EmailContent {
  const message = "Thank you for registering with FusBus Cameroon. Your entrepreneur account is ready, and you can now complete your application.";
  return {
    subject: "Welcome to FusBus Cameroon",
    text: `Hello ${input.name.trim() || "there"},\n\n${message}\n\nComplete your application: ${input.applicationUrl}\n\nKind regards,\nThe FusBus Cameroon team`,
    html: layout(input.name, message, "Complete your application", input.applicationUrl, input.logoUrl)
  };
}

export function passwordResetEmail(input: { name: string; resetUrl: string; logoUrl: string }): EmailContent {
  const message = "We received a request to reset your FusBus password. Please use the secure link below within one hour. If you did not make this request, you can safely ignore this email.";
  return {
    subject: "Reset your FusBus password",
    text: `Hello ${input.name.trim() || "there"},\n\n${message}\n\nReset your password: ${input.resetUrl}\n\nKind regards,\nThe FusBus Cameroon team`,
    html: layout(input.name, message, "Reset your password", input.resetUrl, input.logoUrl)
  };
}
