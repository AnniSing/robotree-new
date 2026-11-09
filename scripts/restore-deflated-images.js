import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function restoreDirectory(dir) {
  let restored = 0;
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile()) {
        const buf = fs.readFileSync(fullPath);
        if (buf.length > 2 && buf[0] === 0x78 && buf[1] === 0x9c) {
          try {
            const inflated = zlib.inflateSync(buf);
            fs.writeFileSync(fullPath, inflated);
            restored++;
          } catch (err) {
            console.error(`Error inflating ${fullPath}:`, err.message);
          }
        }
      }
    }
  }
  traverse(dir);
  return restored;
}

const assetsRestored = restoreDirectory('robotree.in-main/assets');
console.log(`Successfully restored ${assetsRestored} images in assets/`);
const photosRestored = restoreDirectory('robotree.in-main/website-photos-jpg');
console.log(`Successfully restored ${photosRestored} images in website-photos-jpg/`);
