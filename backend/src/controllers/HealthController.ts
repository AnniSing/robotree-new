import { Request, Response } from 'express';
import os from 'node:os';
import { db } from '../persistence/json-database.js';

export class HealthController {
  public static getLive(req: Request, res: Response): void {
    res.json({
      success: true,
      status: 'ok',
      service: 'Robotree Backend',
      timestamp: new Date().toISOString(),
    });
  }

  public static getReady(req: Request, res: Response): void {
    try {
      // Readiness check: Verify database access
      const courses = db.getCourses();
      res.json({
        success: true,
        status: 'ready',
        database: 'connected',
        coursesCount: courses.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: err.message,
      });
    }
  }

  public static getDiagnostics(req: Request, res: Response): void {
    const memory = process.memoryUsage();
    const events = db.getEvents();
    let totalPhotos = 0;
    events.forEach((e: any) => {
      totalPhotos += Array.isArray(e.images) ? e.images.length : (e.image ? 1 : 0);
    });

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      },
      metrics: {
        totalGalleryPhotos: totalPhotos,
        totalRegisteredUsers: db.getUsers().length,
        totalCertificatesIssued: db.getCertificates().length,
        totalInquiries: db.getInquiries().length,
        totalCourses: db.getCourses().length,
        totalTeamMembers: db.getTeam().length,
      },
    });
  }
}
