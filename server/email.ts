/**
 * Email helper using SendGrid for transactional emails.
 * Falls back to console logging if SENDGRID_API_KEY is not set.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@femsider.com";

  if (!apiKey) {
    // Graceful fallback — log the email in development
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

// ─── Welcome Email ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(user: { name: string | null; email: string | null }): Promise<boolean> {
  if (!user.email) return false;

  const name = user.name || "there";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">FEMSIDER</h1>
    </div>
    <!-- Card -->
    <div style="background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;">
      <h2 style="color:#fff;font-size:22px;margin:0 0 12px;">Welcome, ${name}! 🎉</h2>
      <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 24px;">
        You've just joined the most exclusive transformative content community. Here's what you can do:
      </p>
      <!-- Features -->
      <div style="margin-bottom:24px;">
        ${[
          ["🎬", "Browse exclusive videos", "Discover uncensored transformative content"],
          ["💬", "Join the Forum", "Connect with the community, ask questions, share experiences"],
          ["🏆", "Earn Reputation", "Get points for every post, reply, and like — climb the leaderboard"],
          ["💰", "Affiliate Program", "Earn 30% commission for every friend you refer"],
        ].map(([icon, title, desc]) => `
        <div style="display:flex;gap:12px;margin-bottom:16px;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:24px;flex-shrink:0;">${icon}</span>
          <div>
            <p style="color:#fff;font-weight:600;margin:0 0 4px;font-size:14px;">${title}</p>
            <p style="color:#888;margin:0;font-size:13px;">${desc}</p>
          </div>
        </div>`).join("")}
      </div>
      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}/subscriptions" 
           style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#a855f7);color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;">
          🚀 Get Komunita+ — 50% OFF Today
        </a>
        <p style="color:#666;font-size:12px;margin:8px 0 0;">Limited time offer. Cancel anytime.</p>
      </div>
      <!-- Trial offer -->
      <div style="background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:10px;padding:16px;text-align:center;">
        <p style="color:#00d4ff;font-size:13px;margin:0;font-weight:600;">✨ Special Welcome Offer</p>
        <p style="color:#aaa;font-size:13px;margin:6px 0 0;">Use code <strong style="color:#fff;">WELCOME50</strong> for 50% off your first month</p>
      </div>
    </div>
    <!-- Footer -->
    <p style="color:#555;font-size:12px;text-align:center;margin-top:24px;">
      You received this because you signed up at FEMSIDER.<br>
      <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}" style="color:#00d4ff;">Visit FEMSIDER</a>
    </p>
  </div>
</body>
</html>`;

  return sendEmail({
    to: user.email,
    subject: "Welcome to FEMSIDER! 🎉 Here's your exclusive access",
    html,
  });
}

// ─── Weekly Digest Email ──────────────────────────────────────────────────────
export async function sendWeeklyDigestEmail(opts: {
  user: { name: string | null; email: string | null };
  pointsEarned: number;
  newBadges: string[];
  leaderboardRank: number;
  newTopics: number;
}): Promise<boolean> {
  if (!opts.user.email) return false;

  const name = opts.user.name || "there";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">FEMSIDER</h1>
      <p style="color:#888;margin:8px 0 0;font-size:14px;">Your Weekly Digest</p>
    </div>
    <div style="background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;">
      <h2 style="color:#fff;font-size:20px;margin:0 0 20px;">Hey ${name}, here's your week! 📊</h2>
      <!-- Stats grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        ${[
          ["⭐", `+${opts.pointsEarned}`, "Points earned"],
          ["🏆", `#${opts.leaderboardRank}`, "Leaderboard rank"],
          ["🎖️", `${opts.newBadges.length}`, "New badges"],
          ["💬", `${opts.newTopics}`, "New forum topics"],
        ].map(([icon, value, label]) => `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">${icon}</div>
          <div style="color:#fff;font-size:22px;font-weight:700;">${value}</div>
          <div style="color:#888;font-size:12px;">${label}</div>
        </div>`).join("")}
      </div>
      ${opts.newBadges.length > 0 ? `
      <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:16px;margin-bottom:20px;">
        <p style="color:#a855f7;font-weight:600;margin:0 0 8px;font-size:14px;">🎖️ New Badges Earned!</p>
        <p style="color:#ccc;font-size:13px;margin:0;">${opts.newBadges.join(" · ")}</p>
      </div>` : ""}
      <div style="text-align:center;">
        <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}/leaderboard"
           style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#a855f7);color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:50px;text-decoration:none;">
          View Leaderboard
        </a>
      </div>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin-top:24px;">
      FEMSIDER Weekly Digest · <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}/settings" style="color:#00d4ff;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;

  return sendEmail({
    to: opts.user.email,
    subject: `Your FEMSIDER Weekly: +${opts.pointsEarned} pts, Rank #${opts.leaderboardRank}`,
    html,
  });
}

// ─── Password Reset / Account Recovery Email ─────────────────────────────────
export async function sendAccountRecoveryEmail(user: { name: string | null; email: string | null }): Promise<boolean> {
  if (!user.email) return false;

  const name = user.name || "there";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">FEMSIDER</h1>
    </div>
    <div style="background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;">
      <h2 style="color:#fff;font-size:20px;margin:0 0 12px;">Account Recovery, ${name}</h2>
      <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        We received a request to help you recover access to your FEMSIDER account.
      </p>
      <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Since FEMSIDER uses <strong style="color:#fff;">Google Sign-In</strong>, you can recover your account by:
      </p>
      <ol style="color:#aaa;font-size:14px;line-height:2;padding-left:20px;margin:0 0 24px;">
        <li>Going to <a href="https://accounts.google.com/signin/recovery" style="color:#00d4ff;">accounts.google.com</a> to recover your Google account</li>
        <li>Once recovered, sign in to FEMSIDER with the same Google account</li>
        <li>Your profile, points, and content will be waiting for you</li>
      </ol>
      <div style="text-align:center;">
        <a href="${process.env.VITE_APP_URL || "https://femsider.manus.space"}"
           style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#a855f7);color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:50px;text-decoration:none;">
          Back to FEMSIDER
        </a>
      </div>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin-top:24px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;

  return sendEmail({
    to: user.email,
    subject: "FEMSIDER Account Recovery",
    html,
  });
}
