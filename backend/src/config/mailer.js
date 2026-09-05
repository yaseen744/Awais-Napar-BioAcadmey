import nodemailer from "nodemailer";

let transporter = null;

export function isMailerConfigured() {
  return Boolean(process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_APP_PASSWORD, // Gmail "App Password", not the normal login password
      },
    });
  }
  return transporter;
}

// Sends the login OTP to the admin's inbox (NOT the student's), along with
// who is trying to log in, so the admin can verbally hand over the code.
export async function sendLoginOtpEmail({ toEmails, otp, studentName, studentEmail }) {
  if (!isMailerConfigured()) {
    throw new Error(
      "Email is not configured on the server. Set SMTP_EMAIL and SMTP_APP_PASSWORD."
    );
  }
  if (!toEmails || toEmails.length === 0) {
    throw new Error("No admin email found to send the OTP to.");
  }

  const mail = {
    from: `"Awais Napar Bioacademy" <${process.env.SMTP_EMAIL}>`,
    to: toEmails.join(","),
    subject: `Login code for ${studentName} — ${otp}`,
    text:
      `${studentName} (${studentEmail}) is trying to log in.\n\n` +
      `Their one-time login code is: ${otp}\n\n` +
      `This code expires in 10 minutes. Share it with them only if you recognize them.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <p><b>${studentName}</b> (${studentEmail}) is trying to log in.</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; background:#f4f4f4; padding: 12px 16px; border-radius: 6px; display:inline-block;">
          ${otp}
        </p>
        <p style="color:#666; font-size: 13px;">This code expires in 10 minutes. Share it with them only if you recognize them.</p>
      </div>
    `,
  };

  await getTransporter().sendMail(mail);
}
