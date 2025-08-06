import { randomBytes } from "crypto"
import nodemailer from "nodemailer"

// Generate a secure random token
export async function generateResetToken(): Promise<string> {
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    randomBytes(32, (err, buf) => {
      if (err) {
        reject(err)
      } else {
        resolve(buf)
      }
    })
  })
  return buffer.toString("hex")
}

// Send password reset email
export async function sendResetEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })

  const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"AI Promote" <no-reply@aipromote.com>`,
    to: email,
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">Password Reset</h2>
        <p style="font-size: 16px; color: #555;">
          You requested a password reset. Click the link below to set a new password:
        </p>
        <p style="text-align: center;">
          <a 
            href="${resetLink}" 
            style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
          >
            Reset Password
          </a>
        </p>
        <p style="font-size: 14px; color: #777;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">
          This link will expire in 1 hour.
        </p>
      </div>
    `,
  })
}
