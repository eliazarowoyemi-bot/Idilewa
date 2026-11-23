export function getApiRoutePath(req, prefix) {
  const pathname = new URL(req.url || '/', 'https://idilewa.local').pathname;
  const prefixWithSlash = `${prefix.replace(/\/+$/, '')}/`;
  if (pathname.startsWith(prefixWithSlash)) {
    return pathname.slice(prefixWithSlash.length).replace(/\/+$/, '');
  }

  const path = req.query?.['...path'] ?? req.query?.path;
  if (Array.isArray(path)) return path.join('/');
  return typeof path === 'string' ? path.replace(/^\/+|\/+$/g, '') : '';
}
