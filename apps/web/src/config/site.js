const isProduction = process.env.NODE_ENV === 'production';
const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const fallbackUrl = isProduction ? '' : 'http://localhost:3106';

function normalizeSiteUrl(value) {
  if (!value) {
    throw new Error('生产环境必须配置 NEXT_PUBLIC_SITE_URL，例如 https://www.example.com');
  }

  let url;
  try {
    url = new URL(value.replace(/\/+$/, ''));
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL 必须是合法的绝对 URL');
  }

  const isAllowedProtocol = url.protocol === 'https:' || (!isProduction && url.protocol === 'http:');
  const isOriginOnly = url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;

  if (!isAllowedProtocol || !isOriginOnly || url.origin === 'null') {
    throw new Error('NEXT_PUBLIC_SITE_URL 必须是不含路径、查询参数或 hash 的 HTTPS origin');
  }

  return url.origin;
}

export const SITE_URL = normalizeSiteUrl(configuredUrl || fallbackUrl);

export function getSiteUrl(path = '/') {
  if (!path.startsWith('/') || path.includes('?') || path.includes('#')) {
    throw new Error(`站内 SEO 路径无效：${path}`);
  }
  return new URL(path, `${SITE_URL}/`).toString();
}
