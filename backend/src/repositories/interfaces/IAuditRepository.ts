import { AuditLog } from '../../types/index.js';

export interface IAuditRepository {
  log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;
  list(limit?: number): Promise<AuditLog[]>;
}
