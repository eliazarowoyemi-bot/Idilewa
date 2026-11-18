function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function createEmailBrandMarkup(logoUrl, { inverse = false } = {}) {
  let safeLogoUrl;
  try {
    const parsedLogoUrl = new URL(logoUrl);
    if (parsedLogoUrl.protocol !== 'https:') throw new Error('Invalid logo URL.');
    safeLogoUrl = escapeHtml(parsedLogoUrl.href);
  } catch {
    throw new Error('A secure Idilewa logo URL is required.');
  }

  const nameColor = inverse ? '#ffffff' : '#173f32';
  const taglineColor = inverse ? '#dce9df' : '#607066';

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td valign="middle" style="padding-right:10px"><img src="${safeLogoUrl}" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border:0;border-radius:8px" /></td>
      <td valign="middle">
        <div style="font-size:20px;line-height:1;font-weight:800;letter-spacing:-.4px;color:${nameColor}">Ìdíléwa</div>
        <div style="padding-top:5px;font-size:11px;font-weight:600;letter-spacing:.4px;color:${taglineColor}">Our Language. Our Future.</div>
      </td>
    </tr>
  </table>`;
}
