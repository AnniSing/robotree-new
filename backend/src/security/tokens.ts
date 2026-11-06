import crypto from 'node:crypto';

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function generateCertificateCode(year = new Date().getFullYear(), prefix = 'RRT'): string {
  const randomNum = crypto.randomInt(1000, 10000);
  return `${prefix}-${year}-${randomNum}`;
}

export function generateVerificationHash(certificateId: string, studentName: string, issueDate: string): string {
  const secret = process.env.SESSION_SECRET || 'robotree-secret-seed';
  return crypto
    .createHmac('sha256', secret)
    .update(`${certificateId}|${studentName.trim().toUpperCase()}|${issueDate}`)
    .digest('hex');
}
