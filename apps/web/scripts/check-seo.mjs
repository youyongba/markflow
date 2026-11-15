import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(webRoot, '.next');
const pagesDir = path.join(buildDir, 'server', 'pages');
const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

assert.ok(configuredUrl, 'NEXT_PUBLIC_SITE_URL 未配置');
const siteUrl = new URL(configuredUrl);
assert.equal(siteUrl.protocol, 'https:', 'SEO 检查要求正式 HTTPS origin');
assert.equal(siteUrl.pathname, '/');
assert.equal(siteUrl.search, '');
assert.equal(siteUrl.hash, '');
const origin = siteUrl.origin;

const read = (file) => readFile(path.join(webRoot, file), 'utf8');
const readPage = (file) => readFile(path.join(pagesDir, file), 'utf8');
const canonicalFor = (route) => route === '/' ? `${origin}/` : `${origin}${route}`;

function attributes(tag) {
  return Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g)).map((match) => [match[1], match[2]]));
}

function metaTags(html, key, value) {
  return (html.match(/<meta\b[^>]*>/g) || []).filter((tag) => attributes(tag)[key] === value);
}

function canonicalTags(html) {
  return (html.match(/<link\b[^>]*>/g) || []).filter((tag) => attributes(tag).rel === 'canonical');
}

function jsonLd(html) {
  return (html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g) || [])
    .map((tag) => JSON.parse(tag.replace(/^<script\b[^>]*>/, '').replace(/<\/script>$/, '')));
}

function checkPublicPage(html, route) {
  assert.equal((html.match(/<title\b[^>]*>/g) || []).length, 1, `${route} 应有唯一 title`);
  assert.equal(metaTags(html, 'name', 'description').length, 1, `${route} 应有唯一 description`);
  assert.equal(metaTags(html, 'name', 'robots').length, 1, `${route} 应有唯一 robots`);
  assert.equal(metaTags(html, 'name', 'keywords').length, 0, `${route} 不应输出 meta keywords`);
  assert.equal(canonicalTags(html).length, 1, `${route} 应有唯一 canonical`);
  assert.equal(attributes(canonicalTags(html)[0]).href, canonicalFor(route), `${route} canonical 错误`);
  assert.equal(attributes(metaTags(html, 'property', 'og:url')[0]).content, canonicalFor(route), `${route} og:url 错误`);
  assert.equal(attributes(metaTags(html, 'property', 'og:image')[0]).content, `${origin}/images/markflow-og.png`);
  assert.equal(attributes(metaTags(html, 'property', 'og:locale')[0]).content, 'zh_CN');
  assert.equal((html.match(/<h1\b[^>]*>/g) || []).length, 1, `${route} 应有唯一 H1`);
  assert.ok(html.includes('lang="zh-CN"'), `${route} 应使用中文 lang`);
  assert.ok(!html.includes('noindex'), `${route} 应允许索引`);
}

await stat(path.join(buildDir, 'BUILD_ID'));
const [home, manual, about, dashboard] = await Promise.all([
  readPage('index.html'),
  readPage('manual.html'),
  readPage('about.html'),
  readPage('dashboard.html')
]);

checkPublicPage(home, '/');
checkPublicPage(manual, '/manual');
checkPublicPage(about, '/about');
assert.ok(home.includes('开始使用 MarkFlow'));
assert.ok(home.includes('Markdown 文档管理、'));
assert.ok(!home.includes('Markdown 工作台 - MarkFlow'), '公开首页不应再渲染工作台');
assert.ok(!home.includes('/v2.4/'), '公开首页静态 HTML 不应包含工作台 API 请求');
assert.deepEqual(new Set(jsonLd(home).map((schema) => schema['@type'])), new Set(['WebSite', 'SoftwareApplication']));
assert.ok(manual.includes('ADR：记录架构决策'));
assert.ok(manual.includes('为什么 PDF 导出需要允许弹窗？'));
assert.ok(about.includes('作者<strong>小洪</strong>'));

const faq = jsonLd(manual).find((schema) => schema['@type'] === 'FAQPage');
assert.ok(faq, '手册缺少 FAQPage');
assert.ok(faq.mainEntity.length >= 6);
for (const entity of faq.mainEntity) {
  assert.ok(manual.includes(entity.name), `FAQ 问题必须同时可见：${entity.name}`);
  assert.ok(manual.includes(entity.acceptedAnswer.text), `FAQ 答案必须同时可见：${entity.name}`);
}

assert.ok(dashboard.includes('Markdown 工作台 - MarkFlow'));
assert.equal(attributes(metaTags(dashboard, 'name', 'robots')[0]).content, 'noindex,nofollow');
assert.equal(canonicalTags(dashboard).length, 0, '工作台不应生成公开 canonical');

const utilityPages = await Promise.all([
  'auth/login.html',
  'auth/forgot-password.html',
  'auth/reset-password.html',
  'reset-password.html',
  's/[token].html'
].map(readPage));
for (const html of utilityPages) {
  assert.equal(attributes(metaTags(html, 'name', 'robots')[0]).content, 'noindex,nofollow', '工具页均应 noindex');
}

const seoHeadSource = await read('src/components/seo/SeoHead.js');
assert.ok(!seoHeadSource.includes('asPath') && !seoHeadSource.includes('useRouter'), 'canonical 不应读取带追踪参数的 router.asPath');
assert.ok(!seoHeadSource.includes('keywords'));

async function renderEndpoint(page) {
  let body = '';
  const headers = {};
  const res = {
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    write(chunk) { body += chunk; },
    end() {}
  };
  const endpoint = await require(path.join(pagesDir, page));
  await endpoint.getServerSideProps({ res });
  return { body, headers };
}

const robots = await renderEndpoint('robots.txt.js');
assert.match(robots.headers['content-type'], /^text\/plain/);
assert.ok(robots.body.includes('User-agent: *'));
assert.ok(robots.body.includes('Allow: /'));
assert.ok(robots.body.includes('Disallow: /v2.4/'));
assert.ok(!robots.body.includes('Disallow: /dashboard'));
assert.ok(!robots.body.includes('Disallow: /auth'));
assert.ok(robots.body.includes(`Sitemap: ${origin}/sitemap.xml`));

const sitemap = await renderEndpoint('sitemap.xml.js');
assert.match(sitemap.headers['content-type'], /^application\/xml/);
const locations = Array.from(sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]);
assert.deepEqual(locations, [canonicalFor('/'), canonicalFor('/manual'), canonicalFor('/about')]);
assert.ok(!sitemap.body.includes('<lastmod>'));

const routesManifest = JSON.parse(await read('.next/routes-manifest.json'));
const redirects = new Map(routesManifest.redirects.map((redirect) => [redirect.source, redirect]));
assert.equal(redirects.get('/home')?.destination, '/');
assert.equal(redirects.get('/home')?.statusCode, 308);
assert.equal(redirects.get('/auth/register')?.destination, '/auth/login');
assert.equal(redirects.get('/auth/register')?.statusCode, 308);

const ogImage = await readFile(path.join(webRoot, 'public/images/markflow-og.png'));
assert.equal(ogImage.readUInt32BE(16), 1200);
assert.equal(ogImage.readUInt32BE(20), 630);
assert.ok((await stat(path.join(webRoot, 'public/images/markflow-workbench.webp'))).size > 10000);

console.log(`SEO 检查通过：3 个公开页、noindex、JSON-LD、重定向、robots 与 sitemap 均使用 ${origin}`);
