import { createEmailBrandMarkup } from './emailBrand.js';

const ACTIVITY_COPY = {
  'sign-in': {
    subject: 'A sign-in to your Idilewa account',
    heading: 'You signed in to Idilewa',
    message: 'Your Idilewa account was just signed in to. If this was you, no action is needed.',
  },
  'sign-out': {
    subject: 'You signed out of Idilewa',
    heading: 'You signed out of Idilewa',
    message: 'Your Idilewa account was just signed out of on this device.',
  },
};

export function createAuthActivityEmail({ event, logoUrl, timestamp }) {
  const copy = ACTIVITY_COPY[event];
  const eventDate = new Date(timestamp);
  if (!copy || !Number.isFinite(eventDate.getTime())) {
    throw new Error('A supported authentication event and timestamp are required.');
  }
  const brandMarkup = createEmailBrandMarkup(logoUrl);
  const formattedDate = eventDate.toISOString();
  return {
    subject: copy.subject,
    text: `${copy.heading}\n\n${copy.message}\n\nTime: ${formattedDate}\n\nIf this wasn't you, reset your password from the Idilewa sign-in page and contact support.\n\nThe Idilewa team`,
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.heading}</title></head>
  <body style="margin:0;padding:32px 14px;background:#f3f6f1;color:#20372b;font:16px/1.6 Arial,Helvetica,sans-serif">
    <main style="max-width:560px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e4ebe2;border-radius:18px">
      ${brandMarkup}
      <h1 style="margin:0 0 12px;color:#173f32;font-size:26px">${copy.heading}</h1>
      <p style="margin:0 0 18px;color:#526358">${copy.message}</p>
      <p style="margin:0;color:#718076;font-size:13px">Time: ${formattedDate}</p>
      <p style="margin:22px 0 0;color:#718076;font-size:13px">If this wasn't you, reset your password from the Idilewa sign-in page and contact support.</p>
      <p style="margin:24px 0 0;color:#718076;font-size:13px">The Idilewa team · Keep your language close.</p>
    </main>
  </body>
</html>`,
  };
}
