import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export async function sendAuthEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const r = getResend();
  const from = process.env.EMAIL_FROM;
  if (!r || !from) {
    console.warn("[uptime-funk] RESEND_API_KEY or EMAIL_FROM missing; email not sent");
    return;
  }
  void r.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}
