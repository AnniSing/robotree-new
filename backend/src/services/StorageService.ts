import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PROJECT_ROOT } from '../utils/paths.js';
import { ValidationError } from '../errors/AppError.js';

export interface IStorageService {
  saveFile(buffer: Buffer, originalFilename: string, subfolder: string): Promise<string>;
  deleteFile(relativeUrl: string): Promise<boolean>;
  fileExists(relativeUrl: string): Promise<boolean>;
}

export class LocalStorageService implements IStorageService {
  private baseDir: string;
  private readonly allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

  constructor(baseDir = path.join(PROJECT_ROOT, 'assets')) {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalFilename: string, subfolder = 'uploads'): Promise<string> {
    const targetDir = path.join(this.baseDir, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(originalFilename).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.jpg';
    if (!this.allowedExtensions.has(ext)) {
      throw new ValidationError(`Disallowed file type: only image extensions (${Array.from(this.allowedExtensions).join(', ')}) are permitted.`);
    }

    const safeBase = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const filename = `${safeBase ? safeBase + '_' : ''}${uniqueId}${ext}`;
    const filePath = path.join(targetDir, filename);

    // Verify magic bytes for images (JPEG, PNG, WEBP)
    if (!this.isValidImageMagicBytes(buffer, ext)) {
      throw new ValidationError('Security Error: Uploaded file does not match claimed image format.');
    }

    await fs.promises.writeFile(filePath, buffer);
    return `assets/${subfolder}/${filename}`;
  }

  async deleteFile(relativeUrl: string): Promise<boolean> {
    const cleanRel = relativeUrl.replace(/^assets\//, '');
    const resolvedBase = path.resolve(this.baseDir);
    const fullPath = path.resolve(resolvedBase, cleanRel);
    if (!fullPath.startsWith(resolvedBase + path.sep)) {
      throw new Error('Security Error: Path traversal detected.');
    }
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }

  async fileExists(relativeUrl: string): Promise<boolean> {
    const cleanRel = relativeUrl.replace(/^assets\//, '');
    const resolvedBase = path.resolve(this.baseDir);
    const fullPath = path.resolve(resolvedBase, cleanRel);
    if (!fullPath.startsWith(resolvedBase + path.sep)) {
      return false;
    }
    return fs.existsSync(fullPath);
  }

  private isValidImageMagicBytes(buffer: Buffer, ext: string): boolean {
    if (buffer.length < 4) return false;
    // JPEG: FF D8 FF
    if (ext === '.jpg' || ext === '.jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    // PNG: 89 50 4E 47
    if (ext === '.png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    // WEBP: RIFF....WEBP
    if (ext === '.webp') {
      return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    }
    // PDF: %PDF
    if (ext === '.pdf') {
      return buffer.toString('ascii', 0, 4) === '%PDF';
    }
    return true;
  }
}

export const storageService = new LocalStorageService();
