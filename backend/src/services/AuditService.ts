import { repositories } from '../repositories/index.js';
import { AuditLog } from '../types/index.js';
import { Logger } from '../telemetry/logger.js';
import { db } from '../persistence/json-database.js';
import { sanitizeValue } from '../security/hasher.js';
import crypto from 'node:crypto';

export class AuditService {
  public static async logAction(
    actor: string,
    action: string,
    resource: string,
    details?: string,
    meta: {
      resourceId?: string;
      requestId?: string;
      ip?: string;
      userAgent?: string;
      result?: 'SUCCESS' | 'FAILURE';
    } = {}
  ): Promise<AuditLog> {
    const entry: Omit<AuditLog, 'id' | 'timestamp'> = {
      actor,
      action,
      resource,
      resourceId: meta.resourceId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      result: meta.result || 'SUCCESS',
      details,
    };

    Logger.info(`AUDIT: [${action}] ${resource} by ${actor}`, {
      actor,
      requestId: meta.requestId,
      details,
    });

    // Also persist to activities collection for dashboard telemetry
    this.recordActivity(
      actor,
      action,
      details || '',
      meta.result === 'FAILURE' ? 'FAILED' : 'SUCCESS'
    );

    return repositories.audit.log(entry);
  }

  public static recordActivity(user: string, type: string, details: string, status = 'SUCCESS'): void {
    try {
      const activities = db.getActivities();
      const newActivity = {
        id: 'ACT_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
        timestamp: new Date().toISOString(),
        user: sanitizeValue(user || 'Guest User', 120),
        type: sanitizeValue(type || 'UNKNOWN', 80),
        details: sanitizeValue(details || '', 500),
        status,
      };
      activities.unshift(newActivity);
      if (activities.length > 500) activities.length = 500;
      db.saveActivities(activities);
    } catch {
      // Non-blocking telemetry
    }
  }

  public static async getLogs(limit = 100): Promise<AuditLog[]> {
    return repositories.audit.list(limit);
  }
}
