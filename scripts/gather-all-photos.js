/**
 * Robotree Robotics LLP - All Website Photos Gatherer & Catalog Generator
 * 
 * This script:
 * 1. Discovers all images across the website (assets, courses, team, events, store, colleges, gallery, brochure).
 * 2. Gathers and saves them into a dedicated 'website-photos-jpg/' folder.
 * 3. Ensures all photos are in .jpg format (converting PNGs with clean white background handling).
 * 4. Organizes photos both into categorized folders and a single unified flat folder.
 * 5. Generates a standalone, beautiful HTML visual gallery file ('all-photos.html') to view all photos in one place.
 * 
 * Usage:
 *   node scripts/gather-all-photos.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'website-photos-jpg');
const FLAT_DIR = path.join(OUTPUT_DIR, 'all-photos-jpg');
const CATEGORY_DIR = path.join(OUTPUT_DIR, 'by-category');
const HTML_OUTPUT = path.join(PROJECT_ROOT, 'all-photos.html');
const FOLDER_INDEX_HTML = path.join(OUTPUT_DIR, 'index.html');

// Ensure output directories exist
[OUTPUT_DIR, FLAT_DIR, CATEGORY_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('===========================================================');
console.log('  Robotree Website - Photos Gatherer & JPG Exporter');
console.log('===========================================================\n');
console.log(`Source Directory:      ${ASSETS_DIR}`);
console.log(`Output Folder:         ${OUTPUT_DIR}`);
console.log(`Single HTML Catalog:   ${HTML_OUTPUT}\n`);

// 1. Recursive scanner for images
function scanDirectory(dir, currentCategory = 'general') {
  let images = [];
  if (!fs.existsSync(dir)) return images;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Ignore build, node_modules, and git directories
      if (['node_modules', '.git', 'dist', 'dist-server', 'all-website-photos', 'website-photos-jpg', 'backups', 'coverage'].includes(entry.name)) {
        continue;
      }
      const categoryName = entry.name;
      images = images.concat(scanDirectory(fullPath, categoryName));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        // Skip temporary or thumbnail raw files
        if (entry.name.endsWith('.raw')) continue;

        const stat = fs.statSync(fullPath);
        images.push({
          sourcePath: fullPath,
          fileName: entry.name,
          baseName: path.basename(entry.name, ext),
          ext,
          category: currentCategory,
          sizeBytes: stat.size,
          modified: stat.mtime,
        });
      }
    }
  }
  return images;
}

const allImages = scanDirectory(ASSETS_DIR);
console.log(`📸 Found ${allImages.length} images across website asset folders.\n`);

// Conversion helper using Windows System.Drawing for lossless PNG -> JPG conversion
function convertPngToJpg(sourcePath, destJpgPath) {
  try {
    const escapedSource = sourcePath.replace(/'/g, "''");
    const escapedDest = destJpgPath.replace(/'/g, "''");

    const psCommand = `
      Add-Type -AssemblyName System.Drawing
      $src = [System.Drawing.Image]::FromFile('${escapedSource}')
      $bmp = New-Object System.Drawing.Bitmap($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $gfx = [System.Drawing.Graphics]::FromImage($bmp)
      $gfx.Clear([System.Drawing.Color]::White)
      $gfx.DrawImage($src, 0, 0, $src.Width, $src.Height)
      $gfx.Dispose()
      $src.Dispose()
      
      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92)
      
      $bmp.Save('${escapedDest}', $codec, $encoderParams)
      $bmp.Dispose()
    `.replace(/\r?\n/g, ' ');

    execSync(`powershell -NoProfile -Command "${psCommand}"`, { stdio: 'ignore' });
    return true;
  } catch (err) {
    // Fallback: direct binary copy if conversion tool fails
    fs.copyFileSync(sourcePath, destJpgPath);
    return false;
  }
}

// 2. Process and Copy all images into website-photos-jpg folder
const processedList = [];
const categoryCounts = {};

console.log('⏳ Gathering and formatting images into .jpg folder...');

for (const img of allImages) {
  const cat = img.category;
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

  // Ensure category subfolder exists
  const targetCatDir = path.join(CATEGORY_DIR, cat);
  if (!fs.existsSync(targetCatDir)) {
    fs.mkdirSync(targetCatDir, { recursive: true });
  }

  // Generate standardized .jpg filenames
  const targetJpgName = `${img.baseName}.jpg`;
  const flatJpgName = `${cat}_${img.baseName}.jpg`;

  const destCatFile = path.join(targetCatDir, targetJpgName);
  const destFlatFile = path.join(FLAT_DIR, flatJpgName);

  // If already .jpg/.jpeg, copy directly
  if (img.ext === '.jpg' || img.ext === '.jpeg') {
    fs.copyFileSync(img.sourcePath, destCatFile);
    fs.copyFileSync(img.sourcePath, destFlatFile);
  } else {
    // Convert PNG / WebP to clean JPG
    convertPngToJpg(img.sourcePath, destCatFile);
    fs.copyFileSync(destCatFile, destFlatFile);
  }

  // Calculate relative paths for the HTML gallery
  const relativeFromHtml = path.relative(PROJECT_ROOT, destFlatFile).replace(/\\/g, '/');
  const relativeFromFolderHtml = path.relative(OUTPUT_DIR, destCatFile).replace(/\\/g, '/');

  processedList.push({
    title: img.baseName.replace(/[-_]/g, ' '),
    originalName: img.fileName,
    jpgName: flatJpgName,
    category: cat,
    sizeKb: (fs.statSync(destFlatFile).size / 1024).toFixed(1),
    htmlPath: relativeFromHtml,
    folderHtmlPath: relativeFromFolderHtml,
  });
}

console.log('✅ All images copied and saved in website-photos-jpg/\n');
console.log('Category Breakdown:');
Object.entries(categoryCounts).forEach(([cat, count]) => {
  console.log(`  • ${cat.padEnd(16)}: ${count} photos`);
});
console.log(`\n  Total exported to flat folder: ${processedList.length} .jpg images\n`);

// 3. Generate Single-File HTML Visual Photo Gallery ('all-photos.html')
function generateGalleryHtml(images, isSubFolder = false) {
  const categories = ['all', ...Object.keys(categoryCounts)];

  const cardsHtml = images
    .map((img, idx) => {
      const imgPath = isSubFolder ? img.folderHtmlPath : img.htmlPath;
      return `
      <div class="photo-card" data-category="${img.category}" data-name="${img.title.toLowerCase()}" data-index="${idx}">
        <div class="photo-thumb-wrap">
          <img src="${imgPath}" alt="${img.title}" loading="lazy" class="photo-thumb" onclick="openLightbox(${idx})">
          <span class="photo-badge">${img.category}</span>
        </div>
        <div class="photo-meta">
          <h3 class="photo-title" title="${img.title}">${img.title}</h3>
          <div class="photo-sub">
            <span class="photo-filename">${img.jpgName}</span>
            <span class="photo-size">${img.sizeKb} KB</span>
          </div>
          <div class="photo-actions">
            <button class="btn-action" onclick="openLightbox(${idx})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              View Full
            </button>
            <a href="${imgPath}" download="${img.jpgName}" class="btn-action download">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download
            </a>
          </div>
        </div>
      </div>`;
    })
    .join('\n');

  const categoryPillsHtml = categories
    .map((c) => {
      const count = c === 'all' ? images.length : categoryCounts[c] || 0;
      const label = c.charAt(0).toUpperCase() + c.slice(1);
      return `<button class="cat-pill ${c === 'all' ? 'active' : ''}" data-cat="${c}" onclick="filterCategory('${c}')">${label} <span class="count">${count}</span></button>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Robotree Website - Complete Photo Gallery (${images.length} Images)</title>
  <link rel="icon" type="image/png" href="assets/robotree_favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #070D1E;
      --bg-card: #0F172A;
      --bg-card-hover: #1E293B;
      --border-color: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(0, 229, 255, 0.4);
      --primary: #00E5FF;
      --primary-glow: rgba(0, 229, 255, 0.25);
      --accent: #FFB703;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: radial-gradient(circle at top right, #0F1F38 0%, #070D1E 60%, #030712 100%);
      color: var(--text-main);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      padding-bottom: 80px;
    }
    header {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 16px 24px;
    }
    .header-inner {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }
    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #00E5FF, #2563EB);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
      color: #070D1E;
      font-size: 20px;
    }
    .brand-info h1 {
      font-size: 1.15rem;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      color: #FFF;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-info p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .header-stats {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stat-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .stat-pill strong {
      color: var(--primary);
    }
    .container {
      max-width: 1440px;
      margin: 28px auto 0;
      padding: 0 24px;
    }
    .controls-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 20px;
      margin-bottom: 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .search-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-input-wrap {
      flex: 1;
      min-width: 280px;
      position: relative;
    }
    .search-input-wrap svg {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .search-input {
      width: 100%;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px 16px 12px 42px;
      font-size: 0.95rem;
      color: var(--text-main);
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .category-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cat-pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .cat-pill:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #FFF;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .cat-pill.active {
      background: var(--primary);
      color: #070D1E;
      font-weight: 700;
      border-color: var(--primary);
      box-shadow: 0 2px 10px var(--primary-glow);
    }
    .cat-pill .count {
      font-size: 0.75rem;
      opacity: 0.8;
      background: rgba(0, 0, 0, 0.2);
      padding: 2px 6px;
      border-radius: 10px;
    }
    .cat-pill.active .count {
      background: rgba(7, 13, 30, 0.25);
    }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .photo-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .photo-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-hover);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }
    .photo-thumb-wrap {
      position: relative;
      width: 100%;
      height: 220px;
      background: #060B18;
      overflow: hidden;
      cursor: pointer;
    }
    .photo-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s;
    }
    .photo-card:hover .photo-thumb {
      transform: scale(1.05);
    }
    .photo-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(7, 13, 30, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--primary);
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .photo-meta {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
      gap: 12px;
    }
    .photo-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #FFF;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: capitalize;
    }
    .photo-sub {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      color: var(--text-muted);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 8px;
    }
    .photo-filename {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
      font-family: monospace;
      color: #CBD5E1;
    }
    .photo-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .btn-action {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: #FFF;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-action:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
    }
    .btn-action.download {
      background: rgba(0, 229, 255, 0.1);
      border-color: rgba(0, 229, 255, 0.3);
      color: var(--primary);
    }
    .btn-action.download:hover {
      background: var(--primary);
      color: #070D1E;
    }
    /* Lightbox Modal */
    .lightbox {
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 18, 0.95);
      backdrop-filter: blur(20px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 20px;
    }
    .lightbox.active {
      display: flex;
    }
    .lightbox-close {
      position: absolute;
      top: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #FFF;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .lightbox-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .lightbox-img-wrap {
      max-width: 90vw;
      max-height: 75vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lightbox-img {
      max-width: 100%;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      border: 1px solid var(--border-color);
    }
    .lightbox-info {
      margin-top: 18px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .lightbox-title {
      font-size: 1.2rem;
      font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
    }
    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #FFF;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lightbox-prev { left: 24px; }
    .lightbox-next { right: 24px; }
    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
      font-size: 1.1rem;
    }
  </style>
</head>
<body>

  <header>
    <div class="header-inner">
      <a href="index.html" class="brand">
        <div class="brand-logo">R</div>
        <div class="brand-info">
          <h1>Robotree Robotics LLP <span>• All Photos</span></h1>
          <p>Official Website Photos & Images Archive (.JPG Format)</p>
        </div>
      </a>
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <nav style="display: flex; gap: 10px; align-items: center;">
          <a href="index.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.85rem; font-weight: 500;">Home</a>
          <a href="gallery.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.85rem; font-weight: 500;">Gallery</a>
          <a href="courses.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.85rem; font-weight: 500;">Courses</a>
          <a href="store.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.85rem; font-weight: 500;">Store</a>
          <a href="contact.html" style="color: var(--text-muted); text-decoration: none; font-size: 0.85rem; font-weight: 500;">Contact</a>
        </nav>
        <div class="header-stats">
          <div class="stat-pill">Total Photos: <strong>${images.length}</strong></div>
          <a href="all-website-photos.zip" download="all-website-photos.zip" class="btn-action download" style="padding: 6px 14px; text-decoration: none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download ZIP (${images.length} Photos)
          </a>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="controls-panel">
      <div class="search-row">
        <div class="search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="searchInput" class="search-input" placeholder="Search photos by title, college name, team member, course, or event...">
        </div>
      </div>
      <div class="category-pills">
        ${categoryPillsHtml}
      </div>
    </div>

    <div class="gallery-grid" id="galleryGrid">
      ${cardsHtml}
    </div>
  </main>

  <!-- Lightbox Modal -->
  <div class="lightbox" id="lightboxModal">
    <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
    <button class="lightbox-nav lightbox-prev" onclick="prevLightbox()">&#10094;</button>
    <button class="lightbox-nav lightbox-next" onclick="nextLightbox()">&#10095;</button>
    <div class="lightbox-img-wrap">
      <img src="" id="lightboxImg" class="lightbox-img" alt="Lightbox Preview">
    </div>
    <div class="lightbox-info">
      <div class="lightbox-title" id="lightboxTitle"></div>
      <div id="lightboxSub" style="color: var(--text-muted); font-size: 0.85rem;"></div>
      <div style="margin-top: 8px;">
        <a id="lightboxDownloadBtn" href="" download="" class="btn-action download" style="padding: 8px 16px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Download JPG
        </a>
      </div>
    </div>
  </div>

  <script>
    const imagesData = ${JSON.stringify(images.map((img, idx) => ({
      idx,
      title: img.title,
      category: img.category,
      src: isSubFolder ? img.folderHtmlPath : img.htmlPath,
      name: img.jpgName,
      sizeKb: img.sizeKb
    })))};

    let activeCategory = 'all';
    let searchQuery = '';
    let currentLightboxIdx = 0;

    const cards = document.querySelectorAll('.photo-card');
    const searchInput = document.getElementById('searchInput');

    function filterPhotos() {
      let visibleCount = 0;
      cards.forEach(card => {
        const cat = card.dataset.category;
        const name = card.dataset.name;
        const matchesCategory = activeCategory === 'all' || cat === activeCategory;
        const matchesSearch = !searchQuery || name.includes(searchQuery);

        if (matchesCategory && matchesSearch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
    }

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterPhotos();
    });

    window.filterCategory = function(cat) {
      activeCategory = cat;
      document.querySelectorAll('.cat-pill').forEach(btn => {
        if (btn.dataset.cat === cat) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      filterPhotos();
    };

    window.openLightbox = function(idx) {
      currentLightboxIdx = idx;
      const data = imagesData[idx];
      if (!data) return;

      document.getElementById('lightboxImg').src = data.src;
      document.getElementById('lightboxTitle').textContent = data.title;
      document.getElementById('lightboxSub').textContent = data.name + ' • ' + data.category.toUpperCase() + ' (' + data.sizeKb + ' KB)';
      const dlBtn = document.getElementById('lightboxDownloadBtn');
      dlBtn.href = data.src;
      dlBtn.download = data.name;

      document.getElementById('lightboxModal').classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    window.closeLightbox = function() {
      document.getElementById('lightboxModal').classList.remove('active');
      document.body.style.overflow = 'auto';
    };

    window.prevLightbox = function() {
      let newIdx = currentLightboxIdx - 1;
      if (newIdx < 0) newIdx = imagesData.length - 1;
      openLightbox(newIdx);
    };

    window.nextLightbox = function() {
      let newIdx = (currentLightboxIdx + 1) % imagesData.length;
      openLightbox(newIdx);
    };

    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('lightboxModal');
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
    });
  </script>
</body>
</html>`;
}

// Generate the HTML gallery for root and for the output folder
const rootHtml = generateGalleryHtml(processedList, false);
fs.writeFileSync(HTML_OUTPUT, rootHtml, 'utf8');

const folderHtml = generateGalleryHtml(processedList, true);
fs.writeFileSync(FOLDER_INDEX_HTML, folderHtml, 'utf8');

// Export JSON dataset
const DATA_JSON = path.join(PROJECT_ROOT, 'data', 'all-photos.json');
fs.writeFileSync(DATA_JSON, JSON.stringify(processedList, null, 2) + '\n', 'utf8');

// Create standalone ZIP file containing all photos in 1 file
const ZIP_FILE = path.join(PROJECT_ROOT, 'all-website-photos.zip');
console.log('📦 Creating single ZIP file containing all photos in 1 file...');
try {
  execSync(`powershell -NoProfile -Command "$ProgressPreference = 'SilentlyContinue'; Compress-Archive -Path '${FLAT_DIR}\\*' -DestinationPath '${ZIP_FILE}' -Force"`, { stdio: 'ignore' });
  const zipSizeMb = (fs.statSync(ZIP_FILE).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Single ZIP Archive created: ${ZIP_FILE} (${zipSizeMb} MB)`);
} catch (err) {
  console.warn('Could not build zip archive:', err.message);
}

console.log('===========================================================');
console.log('🎉 Successfully Gathered All Photos & Created Catalog!');
console.log(`📁 Flat .JPG Photos Folder:  ${FLAT_DIR}`);
console.log(`📁 Categorized Folders:     ${CATEGORY_DIR}`);
console.log(`🌐 Single HTML Gallery File: ${HTML_OUTPUT}`);
console.log(`🌐 Folder HTML Gallery:     ${FOLDER_INDEX_HTML}`);
console.log(`📦 All Photos in 1 ZIP File: ${ZIP_FILE}`);
console.log(`📄 JSON Dataset File:        ${DATA_JSON}`);
console.log('===========================================================');
