/**
 * Internal email helper — re-exports the private sendEmail function from email.ts
 * for use by the revenue engine and other server modules.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@femsider.com";

  if (!apiKey) {
    console.log(`[Email] Would send to ${options.to}: ${options.subject}`);
    return true;
  }

  try {
    const sgMail = await import("@sendgrid/mail");
    sgMail.default.setApiKey(apiKey);
    await sgMail.default.send({
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ""),
    });
    console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}
