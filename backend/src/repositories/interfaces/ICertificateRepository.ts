import { Certificate } from '../../types/index.js';

export interface ICertificateRepository {
  findByCode(code: string): Promise<Certificate | null>;
  findById(id: string): Promise<Certificate | null>;
  list(): Promise<Certificate[]>;
  create(certificate: Omit<Certificate, 'createdAt' | 'updatedAt'>): Promise<Certificate>;
  update(id: string, updates: Partial<Certificate>): Promise<Certificate | null>;
  revoke(id: string, reason?: string): Promise<Certificate | null>;
  reinstate(id: string): Promise<Certificate | null>;
  delete(id: string): Promise<boolean>;
}
