import nodemailer from "nodemailer";
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60, // per 60 seconds
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const data = req.body;

  try {
    await rateLimiter.consume(
      req.headers["x-forwarded-for"] || req.socket.remoteAddress
    );
  } catch {
    return res.status(429).json({ error: "Too many requests" });
  }

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No form data submitted" });
  }

  if (data._gotcha) {
    return res.status(400).json({ error: "Spam detected" });
  }

  try {
    // Format all fields into HTML
    const html = Object.entries(data)
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
      .join("");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Form Submission" <${process.env.FROM_EMAIL}>`,
      to: process.env.TO_EMAIL,
      subject: "New Form Submission",
      html,
    });

    return res.status(200).json({ success: true, message: "Email sent" });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
