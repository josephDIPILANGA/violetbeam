import nodemailer from "nodemailer";

type VerificationEmailInput = {
  to: string;
  name: string;
  verificationUrl: string;
};

function getEmailConfig() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error("Email configuration is incomplete.");
  }

  return { host, port, user, pass, from };
}

export async function sendVerificationEmail({ to, name, verificationUrl }: VerificationEmailInput) {
  const { host, port, user, pass, from } = getEmailConfig();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `VioletBeam <${from}>`,
    to,
    subject: "Verify your VioletBeam email",
    text: `Hello ${name}, verify your VioletBeam account here: ${verificationUrl}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background:#fdfbff; padding:32px;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #eee7f6; border-radius:24px; padding:32px;">
          <p style="font-size:12px; letter-spacing:0.28em; color:#8d5f9e; text-transform:uppercase; font-weight:800;">VioletBeam</p>
          <h1 style="font-size:32px; line-height:1.05; margin:12px 0; color:#1c1c1c;">Verify your email</h1>
          <p style="font-size:15px; line-height:1.8; color:#666;">Hello ${name}, confirm your email address to activate your account and save your future compositions.</p>
          <a href="${verificationUrl}" style="display:inline-block; margin-top:24px; padding:14px 22px; border-radius:999px; background:#8d5f9e; color:#ffffff; font-size:12px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; text-decoration:none;">Verify email</a>
          <p style="margin-top:28px; font-size:12px; line-height:1.7; color:#999;">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
}
