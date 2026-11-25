import { createEmailBrandMarkup } from './emailBrand.js';

const OTP_PATTERN = /^\d{6,8}$/;

const EMAIL_COPY = {
  recovery: {
    subject: 'Reset your Idilewa password',
    title: 'Reset your password',
    instruction: 'Enter this one-time code on the Idilewa password recovery page to choose a new password.',
  },
};

export function createAuthCodeEmail({ code, purpose, logoUrl = 'https://idilewa.com/assets/idilewa-mark.png' }) {
  const copy = EMAIL_COPY[purpose];
  if (!copy || !OTP_PATTERN.test(code || '')) {
    throw new Error('A valid email code and purpose are required.');
  }
  const brandMarkup = createEmailBrandMarkup(logoUrl);

  return {
    subject: copy.subject,
    text: `${copy.title}\n\n${copy.instruction}\n\nYour one-time passcode: ${code}\n\nThis code expires soon and can only be used once. If you did not request it, ignore this email.\n\nThe Idilewa team`,
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.title}</title></head>
  <body style="margin:0;padding:32px 14px;background:#f3f6f1;color:#20372b;font:16px/1.6 Arial,Helvetica,sans-serif">
    <main style="max-width:560px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e4ebe2;border-radius:18px">
      ${brandMarkup}
      <h1 style="margin:22px 0 12px;color:#173f32;font-size:27px">${copy.title}</h1>
      <p style="margin:0 0 22px;color:#526358">${copy.instruction}</p>
      <p style="margin:0;padding:18px;text-align:center;background:#eaf6ec;border-radius:12px;color:#173f32;font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p>
      <p style="margin:22px 0 0;color:#718076;font-size:13px">This code expires soon and can only be used once. If you did not request it, ignore this email.</p>
      <p style="margin:24px 0 0;color:#718076;font-size:13px">The Idilewa team · Keep your language close.</p>
    </main>
  </body>
</html>`,
  };
}
