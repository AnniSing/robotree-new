/* Robotree Automated Database Snapshot Backup Utility */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');

function createBackup() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`[ERROR] Data directory does not exist at: ${DATA_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDir = path.join(BACKUP_DIR, `snapshot_${timestamp}`);
  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  let totalCopied = 0;

  for (const file of files) {
    const src = path.join(DATA_DIR, file);
    const dest = path.join(targetDir, file);
    fs.copyFileSync(src, dest);
    totalCopied++;
  }

  const manifest = {
    backupId: `snapshot_${timestamp}`,
    timestamp: new Date().toISOString(),
    filesCount: totalCopied,
    files: files
  };
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`[SUCCESS] Database snapshot created successfully!`);
  console.log(`Location: ${targetDir}`);
  console.log(`Files Backed Up: ${totalCopied}`);

  // Keep only the last 30 snapshots to avoid disk exhaustion
  const allBackups = fs
    .readdirSync(BACKUP_DIR)
    .filter((d) => d.startsWith('snapshot_'))
    .sort()
    .reverse();

  if (allBackups.length > 30) {
    for (const oldBackup of allBackups.slice(30)) {
      const oldPath = path.join(BACKUP_DIR, oldBackup);
      fs.rmSync(oldPath, { recursive: true, force: true });
      console.log(`[PRUNED] Removed old snapshot: ${oldBackup}`);
    }
  }
}

createBackup();
