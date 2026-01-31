# Wix Website Scraper for Small Business Migration

A Node.js tool using Puppeteer to scrape content and images from Wix websites. Created for BEAM to help small businesses migrate their web content to new platforms.

---

## Overview

Wix sites render content dynamically via JavaScript, making traditional scraping tools ineffective. This scraper uses a headless browser to:

1. Load each page and wait for JavaScript to render
2. Auto-scroll to trigger lazy-loaded images
3. Extract all text content (titles, paragraphs, product descriptions)
4. Download all images at high resolution
5. Save structured data as JSON for easy import

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Create a new directory for the project
mkdir website-scraper && cd website-scraper

# Initialize npm
npm init -y

# Install Puppeteer
npm install puppeteer
```

### Create the Scraper

Create `scrape.js` with the template below, then customize the `PAGES` array for your target site.

### Run

```bash
node scrape.js
```

---

## Full Scraper Template

```javascript
/**
 * Wix Website Scraper
 *
 * Scrapes images and content from JavaScript-rendered websites (Wix, Squarespace, etc.)
 *
 * CUSTOMIZATION:
 * 1. Update BASE_URL to target website
 * 2. Update PAGES array with all pages to scrape (get from sitemap.xml)
 * 3. Run: node scrape.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ============================================================
// CONFIGURATION - CUSTOMIZE THIS SECTION
// ============================================================

const BASE_URL = 'https://www.example-wix-site.com';

// Get pages from sitemap: https://yoursite.com/sitemap.xml
// or https://yoursite.com/pages-sitemap.xml
const PAGES = [
  { slug: '', name: 'Home' },
  { slug: 'about', name: 'About', category: 'Info' },
  { slug: 'products', name: 'Products', category: 'Products' },
  { slug: 'gallery', name: 'Gallery', category: 'Gallery' },
  { slug: 'contact', name: 'Contact', category: 'Info' },
  // Add all pages from the sitemap...
];

const OUTPUT_DIR = path.join(__dirname, 'scraped-content');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

// ============================================================
// SCRAPER CODE - NO CHANGES NEEDED BELOW
// ============================================================

const scrapedData = {
  scrapedAt: new Date().toISOString(),
  source: BASE_URL,
  pages: [],
  allImages: []
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

function getImageFilename(url, pageSlug, index) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname) || '.jpg';
    const baseName = path.basename(pathname, ext).substring(0, 50);
    const cleanBase = baseName.replace(/[^a-zA-Z0-9-_]/g, '_') || 'image';
    return `${pageSlug}_${cleanBase}_${index}${ext}`;
  } catch {
    return `${pageSlug}_image_${index}.jpg`;
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 200);
    });
  });
}

async function scrapePage(browser, pageInfo) {
  const page = await browser.newPage();
  const url = pageInfo.slug ? `${BASE_URL}/${pageInfo.slug}` : BASE_URL;

  console.log(`\n📄 Scraping: ${pageInfo.name} (${url})`);

  try {
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for dynamic content
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to trigger lazy loading
    await autoScroll(page);

    // Wait for images to load
    await new Promise(r => setTimeout(r, 2000));

    // Extract content
    const pageData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText ||
                    document.querySelector('[data-testid="richTextElement"] h1')?.innerText ||
                    document.title;

      const textElements = document.querySelectorAll('p, [data-testid="richTextElement"], h2, h3, h4, h5, h6');
      const textContent = Array.from(textElements)
        .map(el => el.innerText?.trim())
        .filter(text => text && text.length > 10)
        .filter((text, index, self) => self.indexOf(text) === index);

      const images = Array.from(document.querySelectorAll('img'))
        .map(img => ({
          src: img.src || img.dataset.src,
          alt: img.alt || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        }))
        .filter(img => {
          if (!img.src) return false;
          if (img.width && img.width < 100) return false;
          // Filter Wix static images (actual content)
          if (img.src.includes('static.wixstatic.com/media/') &&
              !img.src.includes('_icon') &&
              !img.src.includes('logo')) {
            return true;
          }
          return img.src.includes('wixstatic');
        });

      const itemTitles = Array.from(document.querySelectorAll('[data-hook="product-item-name"], .product-title, h2, h3'))
        .map(el => el.innerText?.trim())
        .filter(text => text && text.length > 2 && text.length < 100);

      return { title, textContent, images, itemTitles };
    });

    // Download images
    const pageSlug = pageInfo.slug || 'home';
    const pageImagesDir = path.join(IMAGES_DIR, pageSlug);
    ensureDir(pageImagesDir);

    const downloadedImages = [];
    for (let i = 0; i < pageData.images.length; i++) {
      const img = pageData.images[i];
      if (!img.src) continue;

      try {
        // Get high-res Wix image
        let imgUrl = img.src;
        if (imgUrl.includes('wixstatic.com')) {
          imgUrl = imgUrl.split('/v1/')[0] + '/v1/fill/w_1920,h_1920,al_c,q_90/' +
                   imgUrl.split('/').pop().split('?')[0];
        }

        const filename = getImageFilename(imgUrl, pageSlug, i);
        const filepath = path.join(pageImagesDir, filename);

        console.log(`  📷 Downloading: ${filename}`);
        await downloadImage(imgUrl, filepath);

        downloadedImages.push({
          originalUrl: img.src,
          localPath: path.relative(OUTPUT_DIR, filepath),
          alt: img.alt,
          filename
        });

        scrapedData.allImages.push({
          page: pageInfo.name,
          category: pageInfo.category,
          ...downloadedImages[downloadedImages.length - 1]
        });
      } catch (err) {
        console.log(`  ⚠️ Failed: ${err.message}`);
      }
    }

    const result = {
      name: pageInfo.name,
      slug: pageSlug,
      url,
      category: pageInfo.category || 'General',
      title: pageData.title,
      content: pageData.textContent,
      itemTitles: pageData.itemTitles,
      images: downloadedImages,
      imageCount: downloadedImages.length
    };

    scrapedData.pages.push(result);
    console.log(`  ✅ Found ${pageData.textContent.length} text blocks, ${downloadedImages.length} images`);

    await page.close();
    return result;

  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    await page.close();
    return null;
  }
}

function generateSummary(data) {
  let md = `# Scraped Content Summary\n\n`;
  md += `Scraped on: ${data.scrapedAt}\n`;
  md += `Source: ${data.source}\n\n`;
  md += `## Statistics\n`;
  md += `- Total pages: ${data.pages.length}\n`;
  md += `- Total images: ${data.allImages.length}\n\n`;

  const categories = {};
  for (const page of data.pages) {
    const cat = page.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(page);
  }

  md += `## Content by Category\n\n`;
  for (const [category, pages] of Object.entries(categories)) {
    md += `### ${category}\n\n`;
    for (const page of pages) {
      md += `#### ${page.name}\n`;
      md += `- URL: ${page.url}\n`;
      md += `- Images: ${page.imageCount}\n`;
      if (page.content && page.content.length > 0) {
        md += `- Sample content:\n`;
        md += `  > ${page.content[0]?.substring(0, 200)}...\n`;
      }
      md += `\n`;
    }
  }

  return md;
}

async function scrape() {
  console.log('🚀 Starting scraper...\n');
  console.log(`📁 Output: ${OUTPUT_DIR}`);

  ensureDir(OUTPUT_DIR);
  ensureDir(IMAGES_DIR);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const pageInfo of PAGES) {
      await scrapePage(browser, pageInfo);
      await new Promise(r => setTimeout(r, 1000)); // Be polite
    }

    // Save JSON data
    const jsonPath = path.join(OUTPUT_DIR, 'scraped-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(scrapedData, null, 2));

    // Save markdown summary
    const summaryPath = path.join(OUTPUT_DIR, 'SUMMARY.md');
    fs.writeFileSync(summaryPath, generateSummary(scrapedData));

    console.log('\n' + '='.repeat(50));
    console.log('📊 SCRAPING COMPLETE');
    console.log('='.repeat(50));
    console.log(`Pages: ${scrapedData.pages.length}`);
    console.log(`Images: ${scrapedData.allImages.length}`);
    console.log(`Output: ${OUTPUT_DIR}`);

  } finally {
    await browser.close();
  }
}

scrape().catch(console.error);
```

---

## How to Get Page URLs

### Option 1: Sitemap (Recommended)

Most Wix sites have a sitemap at:
- `https://yoursite.com/sitemap.xml`
- `https://yoursite.com/pages-sitemap.xml`

Open in browser and copy all URLs.

### Option 2: Manual Navigation

Browse the site and note all page URLs from the navigation menu.

---

## Output Structure

```
scraped-content/
├── scraped-data.json      # All data in structured JSON
├── SUMMARY.md             # Human-readable overview
└── images/
    ├── home/              # Images from homepage
    ├── about/             # Images from about page
    ├── products/          # Images from products page
    └── ...                # One folder per page
```

---

## JSON Data Format

```json
{
  "scrapedAt": "2026-01-28T20:18:27.836Z",
  "source": "https://www.example.com",
  "pages": [
    {
      "name": "Products",
      "slug": "products",
      "url": "https://www.example.com/products",
      "category": "Products",
      "title": "Our Products",
      "content": [
        "Paragraph 1 text...",
        "Paragraph 2 text..."
      ],
      "images": [
        {
          "originalUrl": "https://...",
          "localPath": "images/products/filename.jpg",
          "alt": "Product description",
          "filename": "products_filename.jpg"
        }
      ],
      "imageCount": 15
    }
  ],
  "allImages": [...]
}
```

---

## Customization Tips

### Adding Categories

Group pages by category for easier organization:

```javascript
{ slug: 'mantels', name: 'Fireplace Mantels', category: 'Products' },
{ slug: 'columns', name: 'Columns', category: 'Products' },
{ slug: 'about', name: 'About Us', category: 'Info' },
```

### Filtering Images

Modify the image filter in `page.evaluate()` to match your site's structure:

```javascript
.filter(img => {
  // Skip small images (likely icons)
  if (img.width && img.width < 100) return false;
  // Only keep images from specific CDN
  return img.src.includes('wixstatic.com') ||
         img.src.includes('your-cdn.com');
});
```

### Handling Other Platforms

The scraper works with any JavaScript-rendered site. Adjust:
- Wait times (increase for slower sites)
- Image URL patterns (different CDNs)
- Content selectors (h1, p, etc.)

---

## Troubleshooting

### "page.waitForTimeout is not a function"
Newer Puppeteer versions removed this. Use:
```javascript
await new Promise(r => setTimeout(r, 3000));
```

### Images not downloading
Check if images are behind authentication or have hotlink protection. Try:
1. Setting a user agent
2. Adding referrer headers
3. Using the browser's network tab to inspect requests

### Timeout errors
Increase timeout for slow pages:
```javascript
await page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 120000  // 2 minutes
});
```

---

## Use Cases for Small Businesses

1. **Website Migration**: Moving from Wix to WordPress, Shopify, or custom site
2. **Backup**: Creating local copies of all website content
3. **Content Audit**: Cataloging all products, images, and descriptions
4. **Rebranding**: Extracting content to rewrite in new brand voice
5. **Multi-platform Publishing**: Syncing content across platforms

---

## Legal Note

Only scrape websites you have permission to scrape. This tool is intended for:
- Migrating your own websites
- Helping clients migrate their websites (with permission)
- Backing up content you own

---

## Support

Created for BEAM to help small businesses with digital presence.

For issues or improvements, contribute to the BEAM repository.
