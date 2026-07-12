import { Resend } from "resend"

let resend: Resend | null = null

/**
 * Initialize Resend with the API key.
 * Call this once at startup after env vars are loaded.
 */
export function initSendGrid(apiKey: string) {
  resend = new Resend(apiKey)
}

/**
 * Send the temporary password to the user's email.
 */
export async function sendTempPasswordEmail(toEmail: string, tempPassword: string): Promise<void> {
  if (!resend) {
    throw new Error("Resend client is not initialized")
  }

  await resend.emails.send({
    to: toEmail,
    from: "AssetOps <onboarding@resend.dev>",
    subject: "Your Temporary Password — AssetOps",
    text: [
      "Hi,",
      "",
      "We received a password reset request for your AssetOps account.",
      "",
      `Your temporary password is: ${tempPassword}`,
      "",
      "Please log in and change your password immediately.",
      "",
      "If you did not request this, please contact your administrator.",
      "",
      "— The AssetOps Team",
    ].join("\n"),
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #07080f; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
        <div style="padding: 32px 32px 24px; background: linear-gradient(135deg, #0d0f1a, #07080f); border-bottom: 1px solid rgba(255,255,255,0.06);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #e0572e, #f97316); display: flex; align-items: center; justify-content: center; font-size: 18px;">⚡</div>
            <span style="font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.3px;">AssetOps</span>
          </div>
        </div>

        <div style="padding: 32px;">
          <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #fff;">Password Reset</h2>
          <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
            We received a request to reset your AssetOps account password. Here is your temporary password:
          </p>

          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Temporary Password</p>
            <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 22px; font-weight: 700; color: #e0572e; letter-spacing: 2px;">${tempPassword}</p>
          </div>

          <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px; line-height: 1.6;">
            ⚠️ <strong style="color: #fbbf24;">Log in and change your password immediately</strong> — this temporary password expires after first use.
          </p>
          <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.6;">
            If you did not request this reset, please contact your administrator right away.
          </p>
        </div>

        <div style="padding: 16px 32px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="margin: 0; font-size: 12px; color: #475569;">© 2025 AssetOps · Enterprise Asset Management</p>
        </div>
      </div>
    `,
  })
}
