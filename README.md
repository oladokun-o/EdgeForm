Sure! Here's a full copy-paste-ready version of your `README.md` for the EdgeForms repo:

---

````md
# EdgeForms

**Universal form endpoint to receive submissions via email — no backend needed.**

EdgeForms is a lightweight, zero-backend form submission handler.  
Accept form data from any frontend — static sites, landing pages, or web apps — and receive it directly in your email inbox.  
Built with Node.js and SMTP, deployable on Vercel with a single endpoint.

---

## ✨ Features

- 📩 Accepts any form field structure
- 🔐 Spam protection (honeypot + rate limiting)
- 💌 Sends form data to your configured email via SMTP
- ⚡️ Works instantly on Vercel (serverless-ready)
- 🧩 Easy to integrate with HTML, React, Svelte, Astro, etc.

---

## 🚀 Quick Usage

```html
<form action="https://edgeforms.vercel.app/api/submit" method="POST">
  <input name="name" placeholder="Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <textarea name="message" placeholder="Your message"></textarea>
  <input type="text" name="_gotcha" style="display:none" />
  <button type="submit">Send</button>
</form>
````

> You can use **any field names** — EdgeForms will handle and email them.

---

## 📁 Folder Structure

```
/
├── api/
│   └── submit.js       # Vercel serverless function
├── public/
│   └── index.html      # Landing page with live form demo
├── .env                # SMTP config
├── vercel.json         # Deployment config
├── package.json
└── README.md
```

---

## 🔐 Environment Variables

Create a `.env` file with:

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
TO_EMAIL=where_you_want_submissions@example.com
```

---

## 🛠 Development

Install dependencies:

```bash
npm install
```

Run locally with [Vercel CLI](https://vercel.com/docs/cli):

```bash
vercel dev
```

Then open `http://localhost:3000` to view the form and test submissions.