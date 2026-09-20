import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';

const root = new URL('./dist/', import.meta.url).pathname;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const files = await walk(root);
const htmlFiles = files.filter((file) => file.endsWith('.html') && !file.endsWith('404.html'));
const seen = { title: new Map(), canonical: new Map(), h1: new Map() };
const errors = [];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const [key, pattern] of Object.entries({
    title: /<title>([^<]+)<\/title>/i,
    canonical: /<link rel="canonical" href="([^"]+)"/i,
    h1: /<h1[^>]*>([\s\S]*?)<\/h1>/i,
  })) {
    const match = html.match(pattern);
    if (!match) errors.push(`${file}: missing ${key}`);
    else {
      const value = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (seen[key].has(value)) errors.push(`${file}: duplicate ${key} with ${seen[key].get(value)}: ${value}`);
      else seen[key].set(value, file);
    }
  }
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) errors.push(`${file}: expected 1 h1, got ${h1Count}`);
  const callFloatCount = (html.match(/class="call-float"/g) || []).length;
  if (callFloatCount !== 1) errors.push(`${file}: expected 1 floating call button, got ${callFloatCount}`);
  if (!html.includes('href="tel:01067699050"')) errors.push(`${file}: missing direct phone link`);
  if (!html.includes('010-6769-9050')) errors.push(`${file}: missing displayed phone number`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
    const url = match[1].split('#')[0].split('?')[0];
    if (!url || url === '/') continue;
    const target = url.endsWith('/') ? join(root, url, 'index.html') : join(root, url);
    try { await access(normalize(target)); } catch { errors.push(`${file}: broken local reference ${url}`); }
  }
  if (/naver[^<]*\.html/i.test(html)) errors.push(`${file}: unexpected Naver verification reference`);
}

const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const sitemapCount = (sitemap.match(/<loc>/g) || []).length;
if (sitemapCount !== htmlFiles.length) errors.push(`sitemap has ${sitemapCount} URLs for ${htmlFiles.length} pages`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} indexed pages: unique title/canonical/H1, local links, sitemap, and no Naver verification HTML.`);
