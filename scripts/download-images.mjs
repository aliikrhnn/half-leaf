import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://nargilestore.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'nargilestore');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    };
    mod.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(fetchHtml(res.headers.location.startsWith('http') ? res.headers.location : BASE_URL + res.headers.location));
      }
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout: ' + url)));
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve('skip');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const mod = url.startsWith('https') ? https : http;
    const options = {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' },
      timeout: 30000,
    };
    const file = fs.createWriteStream(dest);
    mod.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        return resolve('failed_' + res.statusCode);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve('ok'); });
      file.on('error', (e) => { fs.unlinkSync(dest); reject(e); });
    }).on('error', (e) => { try { fs.unlinkSync(dest); } catch {} reject(e); })
      .on('timeout', () => { file.close(); try { fs.unlinkSync(dest); } catch {}; reject(new Error('timeout')); });
  });
}

function extractImages(html, pageUrl) {
  const imgs = new Set();
  // src attributes
  const srcRe = /src=["']([^"']+\.(jpg|jpeg|png|webp|gif))["']/gi;
  let m;
  while ((m = srcRe.exec(html)) !== null) {
    let url = m[1];
    if (url.startsWith('//')) url = 'https:' + url;
    else if (url.startsWith('/')) url = BASE_URL + url;
    else if (!url.startsWith('http')) continue;
    if (url.includes('nargilestore.com')) imgs.add(url);
  }
  // data-src (lazy load)
  const dataSrcRe = /data-src=["']([^"']+\.(jpg|jpeg|png|webp|gif))["']/gi;
  while ((m = dataSrcRe.exec(html)) !== null) {
    let url = m[1];
    if (url.startsWith('//')) url = 'https:' + url;
    else if (url.startsWith('/')) url = BASE_URL + url;
    else if (!url.startsWith('http')) continue;
    if (url.includes('nargilestore.com')) imgs.add(url);
  }
  // srcset
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html)) !== null) {
    const parts = m[1].split(',');
    for (const p of parts) {
      const urlPart = p.trim().split(' ')[0];
      if (!urlPart || !/\.(jpg|jpeg|png|webp|gif)/i.test(urlPart)) continue;
      let url = urlPart;
      if (url.startsWith('//')) url = 'https:' + url;
      else if (url.startsWith('/')) url = BASE_URL + url;
      else if (!url.startsWith('http')) continue;
      if (url.includes('nargilestore.com')) imgs.add(url);
    }
  }
  return [...imgs];
}

function extractProductLinks(html) {
  const links = new Set();
  const re = /href=["'](https?:\/\/(?:www\.)?nargilestore\.com\/[a-z0-9\-]+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = m[1].replace('www.', '');
    // Skip utility pages
    if (/\/(contact|about|blog|alisveris|giris|kayit|hesap|adres|siparis|kargo|iade|bize-ulasin|privacy|checkout|cart|compare|wishlist|search|sitemap)/.test(url)) continue;
    links.add(url);
  }
  return [...links];
}

function urlToFilePath(imgUrl) {
  try {
    const u = new URL(imgUrl);
    const rel = u.pathname; // e.g. /image/cache/catalog/ALPHA-HOOKAH/foo-550x550.jpg
    return path.join(OUTPUT_DIR, rel.replace(/^\//, '').replace(/\//g, path.sep));
  } catch {
    return null;
  }
}

async function scrapeAndDownload() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const visited = new Set();
  const allImages = new Set();
  const queue = [BASE_URL];
  let pageCount = 0;
  let downloadCount = 0;
  let skipCount = 0;
  let failCount = 0;

  console.log('Starting scrape of nargilestore.com...\n');

  // Phase 1: Collect all URLs & images from homepage + category pages
  while (queue.length > 0 && pageCount < 500) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    pageCount++;

    process.stdout.write(`\r[${pageCount}] Scanning: ${url.substring(0, 80).padEnd(80)}`);

    let html;
    try {
      html = await fetchHtml(url);
    } catch (e) {
      continue;
    }

    // Collect images from this page
    const imgs = extractImages(html, url);
    for (const img of imgs) allImages.add(img);

    // Add new product/category links to queue
    const links = extractProductLinks(html);
    for (const link of links) {
      if (!visited.has(link)) queue.push(link);
    }

    await delay(150); // be polite
  }

  console.log(`\n\nScan complete. Found ${allImages.size} unique images across ${pageCount} pages.`);
  console.log(`Downloading to: ${OUTPUT_DIR}\n`);

  // Phase 2: Download all images
  const imgList = [...allImages];
  for (let i = 0; i < imgList.length; i++) {
    const imgUrl = imgList[i];
    const dest = urlToFilePath(imgUrl);
    if (!dest) { failCount++; continue; }

    process.stdout.write(`\r[${i + 1}/${imgList.length}] DL: ${path.basename(dest).substring(0, 60).padEnd(60)} OK:${downloadCount} SKIP:${skipCount} FAIL:${failCount}`);

    try {
      const result = await downloadFile(imgUrl, dest);
      if (result === 'ok') downloadCount++;
      else if (result === 'skip') skipCount++;
      else failCount++;
    } catch {
      failCount++;
    }

    if ((i + 1) % 20 === 0) await delay(500);
  }

  console.log(`\n\nDone!`);
  console.log(`  Downloaded: ${downloadCount}`);
  console.log(`  Skipped (already exist): ${skipCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total images: ${imgList.length}`);
  console.log(`\nImages saved to: ${OUTPUT_DIR}`);

  // Save URL map for reference
  const mapPath = path.join(OUTPUT_DIR, '_url-map.json');
  const urlMap = {};
  for (const imgUrl of allImages) {
    const dest = urlToFilePath(imgUrl);
    if (dest) urlMap[imgUrl] = dest.replace(path.join(__dirname, '..', 'public'), '').replace(/\\/g, '/');
  }
  fs.writeFileSync(mapPath, JSON.stringify(urlMap, null, 2));
  console.log(`URL map saved to: ${mapPath}`);
}

scrapeAndDownload().catch(console.error);
