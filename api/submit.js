import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60, // per 60 seconds
});

const allowedOrigins = [
  "https://nxtedgestudio.com",
  "https://goault.com",
  "https://edgeforms.nxtedgestudio.com",
  "https://ault-v2.netlify.app",
];

const readTemplate = (filename) => {
  const filePath = path.join(process.cwd(), "emails", filename);
  return fs.readFileSync(filePath, "utf-8");
};

const fillTemplate = (template, data) => {
  return Object.entries(data).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value || "-"),
    template
  );
};

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }

  // Handle preflight (CORS OPTIONS request)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end(); // No Content
  }

  // Set CORS headers for actual request
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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

  const timestamp = new Date().toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const internalHtml = fillTemplate(readTemplate("goault-internal.html"), {
    ...data,
    timestamp,
  });

  const replyHtml = fillTemplate(readTemplate("goault-welcome.html"), {
    fullName: data.fullName || "there",
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // ✅ 1. Send to internal team
    await transporter.sendMail({
      from: `"Form Submission" <${process.env.SMTP_USER}>`, // Use SMTP_USER as the sender
      to: process.env.TO_EMAIL,
      subject: `New AULT Form Submission — ${data.fullName || "Unknown"}`,
      html: internalHtml,
      headers: {
        "X-Form-Submission": "EdgeForm",
        "X-Form-Origin": origin,
        "X-Form-Submitted-At": new Date().toISOString(),
      },
    });

    // ✅ 2. Auto-reply to user
    if (data.email) {
      try {
        await transporter.sendMail({
          from: `"AULT" <${process.env.SMTP_USER}>`,
          replyTo: `"AULT" <${process.env.FROM_EMAIL}>`, // Use FROM_EMAIL as the reply-to address
          to: data.email,
          subject: "Your Journey To More Begins Here",
          html: replyHtml,
          headers: {
            "X-Auto-Reply": "true",
          },
        });
      } catch (err) {
        console.error("Auto-reply send error:", err);
      }
    }

    return res.status(200).json({ success: true, message: "Email sent" });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
