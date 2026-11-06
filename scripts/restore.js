/* Robotree Disaster Recovery Database Restore Utility */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');

function restoreBackup(snapshotName) {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error(`[ERROR] No backups directory found at ${BACKUP_DIR}`);
    process.exit(1);
  }

  let targetSnapshot = snapshotName;
  if (!targetSnapshot) {
    const allBackups = fs
      .readdirSync(BACKUP_DIR)
      .filter((d) => d.startsWith('snapshot_'))
      .sort()
      .reverse();

    if (!allBackups.length) {
      console.error(`[ERROR] No snapshots available to restore.`);
      process.exit(1);
    }
    targetSnapshot = allBackups[0];
    console.log(`[INFO] No snapshot specified. Using latest snapshot: ${targetSnapshot}`);
  }

  const snapshotDir = path.join(BACKUP_DIR, targetSnapshot);
  if (!fs.existsSync(snapshotDir)) {
    console.error(`[ERROR] Snapshot directory not found: ${snapshotDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const files = fs.readdirSync(snapshotDir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
  let totalRestored = 0;

  for (const file of files) {
    const src = path.join(snapshotDir, file);
    const dest = path.join(DATA_DIR, file);
    fs.copyFileSync(src, dest);
    totalRestored++;
  }

  console.log(`[SUCCESS] Database successfully restored from ${targetSnapshot}!`);
  console.log(`Restored ${totalRestored} database files into ${DATA_DIR}`);
}

const requestedSnapshot = process.argv[2];
restoreBackup(requestedSnapshot);
