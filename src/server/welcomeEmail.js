function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function createWelcomeEmail({ name, loginUrl, logoUrl = 'https://idilewa.com/assets/idilewa-email-logo.png' }) {
  const displayName = String(name).replace(/\s+/g, ' ').trim().slice(0, 80);
  const safeName = escapeHtml(displayName);
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeLogoUrl = escapeHtml(logoUrl);
  const learningPaths = [
    {
      number: '01',
      title: 'Learn a language',
      description: 'Build everyday vocabulary in Yorùbá, Igbo, Hausa and Kiswahili with guided learning paths.',
      color: '#eaf6ec',
    },
    {
      number: '02',
      title: 'Listen, speak and explore',
      description: 'Try voice lessons, hear tones and greetings, and grow your confidence one practice at a time.',
      color: '#e7f5fb',
    },
    {
      number: '03',
      title: 'Discover stories and culture',
      description: 'Read and listen to African stories, proverbs and cultural learning made to be shared.',
      color: '#fff0e8',
    },
    {
      number: '04',
      title: 'Create with code',
      description: 'Explore playful coding and K–8 STEM activities, with pathways for families and educators.',
      color: '#fff5d9',
    },
  ];
  const learningPathRows = learningPaths.map((path) => `
              <tr><td style="padding:0 0 10px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${path.color};border-radius:12px">
                  <tr><td width="52" valign="top" style="padding:16px 0 16px 16px;font-size:13px;font-weight:700;letter-spacing:1px;color:#28734d">${path.number}</td>
                    <td style="padding:15px 16px 15px 4px">
                      <div style="font-size:15px;font-weight:700;line-height:1.4;color:#20372b">${path.title}</div>
                      <div style="padding-top:5px;font-size:13px;line-height:1.6;color:#526358">${path.description}</div>
                    </td>
                  </tr>
                </table>
              </td></tr>`).join('');
  return {
    subject: 'Welcome to Idilewa — keep your language close',
    text: `Ẹ káàbọ̀, ${displayName}!\n\nWelcome to Idilewa, a learning space for African languages, culture and technology. Your learning space is ready whenever you are.\n\nFOUR WAYS TO BEGIN\n\n01 · Learn a language\nBuild everyday vocabulary in Yorùbá, Igbo, Hausa and Kiswahili with guided learning paths.\n\n02 · Listen, speak and explore\nTry voice lessons, hear tones and greetings, and grow your confidence one practice at a time.\n\n03 · Discover stories and culture\nRead and listen to African stories, proverbs and cultural learning made to be shared.\n\n04 · Create with code\nExplore playful coding and K–8 STEM activities, with pathways for families and educators.\n\nYour journey is yours to shape. Start with one activity, then return whenever you are ready to keep learning.\n\nSign in to open your learning space: ${loginUrl}\n\nIf you did not create this account, you can safely ignore this email. Your password is never included in email.\n\nWith warmth,\nThe Idilewa team`,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Welcome to Idilewa</title>
  </head>
  <body style="margin:0;background:#f3f6f1;color:#20372b;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your Idilewa learning space is ready. Explore languages, stories and coding at your own pace.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f1;padding:36px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e4ebe2;border-radius:20px;overflow:hidden">
          <tr><td style="padding:30px 36px;background:#173f32;color:#fff">
            <img src="${safeLogoUrl}" width="150" alt="Idilewa" style="display:block;width:150px;max-width:100%;height:auto" />
            <div style="margin-top:10px;font-size:13px;color:#dce9df">LANGUAGE · CULTURE · CURIOSITY</div>
          </td></tr>
          <tr><td style="padding:38px 36px 18px">
            <div style="font-size:14px;font-weight:700;color:#28734d">Ẹ KÁÀBỌ̀ — YOU’RE HOME</div>
            <h1 style="margin:12px 0 16px;font-size:30px;line-height:1.2;color:#173f32">Welcome, ${safeName}.</h1>
            <p style="margin:0;font-size:16px;line-height:1.7;color:#526358">Idilewa is a learning space for African languages, culture and technology. Bring your curiosity; your learning space is ready whenever you are.</p>
          </td></tr>
          <tr><td style="padding:14px 36px 30px">
            <div style="padding-bottom:14px;font-size:18px;font-weight:700;color:#20372b">Four ways to begin</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              ${learningPathRows}
            </table>
            <div style="padding-top:10px;font-size:14px;line-height:1.7;color:#526358">Your journey is yours to shape. Start with one activity, then return whenever you are ready to keep learning.</div>
            <div style="padding-top:24px">
              <a href="${safeLoginUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#28734d;color:#fff;text-decoration:none;font-size:15px;font-weight:700">Sign in to your learning space</a>
            </div>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.65;color:#718076">If you did not create this account, you can safely ignore this email. Your password is never included in email.</p>
          </td></tr>
          <tr><td style="padding:20px 36px;background:#f8faf7;border-top:1px solid #e8eee6;font-size:13px;line-height:1.6;color:#718076">
            With warmth,<br><strong style="color:#365443">The Idilewa team</strong>
            <div style="padding-top:10px">Keep your language close.</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
