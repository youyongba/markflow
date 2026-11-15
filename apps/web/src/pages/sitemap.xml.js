import { getSiteUrl } from '../config/site';

const publicPaths = ['/', '/manual', '/about'];

export async function getServerSideProps({ res }) {
  const urls = publicPaths
    .map((path) => `  <url><loc>${getSiteUrl(path)}</loc></url>`)
    .join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
