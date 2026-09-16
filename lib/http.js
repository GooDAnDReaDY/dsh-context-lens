export function writeJson(res, code, body) {
  try {
    res.writeHead(code, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(body));
  } catch {
    /* socket already closed */
  }
}

export function readBody(req, maxBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new Error('body too large'));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function header(request, name) {
  const value = request?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function isLoopbackAddress(value) {
  const address = String(value || '').toLowerCase().replace(/^\[|\]$/g, '');
  return address === 'localhost' || address === 'localhost.' || address === '::1'
    || address.startsWith('127.')
    || address.startsWith('::ffff:127.');
}

/** Reject cross-site writes while allowing local, LAN, and reverse-proxy UIs. */
export function isTrustedRequest(request) {
  const secFetchSite = header(request, 'sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const host = header(request, 'x-forwarded-host') || header(request, 'host');
  const origin = header(request, 'origin');
  if (origin) {
    try {
      const url = new URL(origin);
      if (host && url.host.toLowerCase() === host.toLowerCase()) {
        return true;
      }
      if (isLoopbackAddress(url.hostname) && isLoopbackAddress(request?.socket?.remoteAddress)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  const referer = header(request, 'referer');
  if (referer) {
    try {
      const url = new URL(referer);
      if (host && url.host.toLowerCase() === host.toLowerCase()) {
        return true;
      }
      if (isLoopbackAddress(url.hostname) && isLoopbackAddress(request?.socket?.remoteAddress)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Requests without origin/referer (e.g. curl, loopback tests, or internal calls)
  if (isLoopbackAddress(request?.socket?.remoteAddress)) {
    return true;
  }

  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') {
    return true;
  }

  return false;
}

export const UPDATE_HEADER = 'x-dsh-plugin-update';
export const ALT_UPDATE_HEADER = 'x-dsh-context-lens-update';

export function isTrustedUpdateRequest(request) {
  const updHdr = header(request, UPDATE_HEADER) || header(request, ALT_UPDATE_HEADER);
  if (updHdr !== '1') return false;
  if (!isLoopbackAddress(request?.socket?.remoteAddress)) return false;
  const site = header(request, 'sec-fetch-site');
  if (site !== undefined && site !== 'same-origin') return false;
  const origin = header(request, 'origin');
  const host = header(request, 'host');
  if (origin === undefined || host === undefined) return false;
  try {
    const url = new URL(origin);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && isLoopbackAddress(url.hostname) && url.host === host;
  } catch {
    return false;
  }
}