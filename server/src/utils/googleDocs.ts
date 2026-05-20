export function extractDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function getExportUrl(docIdOrUrl: string): string {
  const docId = extractDocId(docIdOrUrl) ?? docIdOrUrl;
  return `https://docs.google.com/document/d/${docId}/export?format=html`;
}

export function unwrapGoogleRedirect(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('google.com') && parsed.pathname === '/url') {
      const target = parsed.searchParams.get('q');
      if (target) return decodeURIComponent(target);
    }
  } catch {
    // keep original url
  }
  return url;
}

export function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com/i.test(url);
}

export function isProductLink(url: string): boolean {
  const normalized = unwrapGoogleRedirect(url).toLowerCase();
  return /\/products?\//.test(normalized) || /\/collections?\//.test(normalized);
}

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function extractDriveFileId(url: string): string | null {
  const directUrl = unwrapGoogleRedirect(url);
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = directUrl.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function getDriveDirectViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

async function readResponsePrefix(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
    }
  } finally {
    reader.cancel().catch(() => { });
  }

  const merged = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, maxBytes - offset);
    merged.set(slice, offset);
    offset += slice.length;
    if (offset >= maxBytes) break;
  }

  return new TextDecoder().decode(merged);
}

function isDriveLoginPage(contentType: string, finalUrl: string, bodyPrefix: string): boolean {
  const normalizedUrl = finalUrl.toLowerCase();
  if (normalizedUrl.includes('accounts.google.com') || normalizedUrl.includes('/signin')) {
    return true;
  }

  if (!contentType.includes('text/html')) {
    return false;
  }

  const snippet = bodyPrefix.toLowerCase();
  return (
    snippet.includes('accounts.google.com') ||
    snippet.includes('service login') ||
    snippet.includes('sign in to continue') ||
    snippet.startsWith('<!doctype html')
  );
}

export async function checkPublicAccess(url: string): Promise<boolean | null> {
  const directUrl = unwrapGoogleRedirect(url);
  if (!isGoogleDriveUrl(directUrl)) return null;

  const fileId = extractDriveFileId(directUrl);
  if (!fileId) return null;

  const viewUrl = getDriveDirectViewUrl(fileId);

  try {
    const response = await fetch(viewUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.startsWith('image/')) {
      return true;
    }

    const bodyPrefix = await readResponsePrefix(response, 2048);
    if (isDriveLoginPage(contentType, response.url, bodyPrefix)) {
      return false;
    }

    // Drive preview pages return HTML even for some shared files; treat HTML as not embeddable.
    if (contentType.includes('text/html')) {
      return false;
    }

    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchArticleHtml(docIdOrUrl: string): Promise<string> {
  const exportUrl = getExportUrl(docIdOrUrl);
  const response = await fetch(exportUrl, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Doc (HTTP ${response.status}). Ensure the document is publicly accessible.`);
  }

  return response.text();
}
