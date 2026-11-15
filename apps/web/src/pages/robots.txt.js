import { SITE_URL } from '../config/site';

export async function getServerSideProps({ res }) {
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /v2.4/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    ''
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  res.write(robots);
  res.end();

  return { props: {} };
}

export default function Robots() {
  return null;
}
