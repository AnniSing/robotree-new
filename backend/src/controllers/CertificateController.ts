import { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CertificateService } from '../services/CertificateService.js';
import { repositories } from '../repositories/index.js';
import { getParam } from '../utils/params.js';
import { PROJECT_ROOT } from '../utils/paths.js';

export class CertificateController {
  public static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = getParam(req, 'id').trim();
      const cert = await repositories.certificates.findByCode(rawId);

      if (!cert) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Certificate reference ID or Enrollment Number not found in official registry.',
        });
        return;
      }

      const isRevoked = String(cert.status).toUpperCase() === 'REVOKED';
      const certNumber = cert.certificateNumber || cert.code || cert.id;
      const hasUploadedFile = Boolean(cert.certificateFile);
      const fileUrl = hasUploadedFile
        ? `/api/certificates/download/${encodeURIComponent(cert.id || cert.code)}`
        : undefined;

      res.json({
        success: true,
        isRevoked,
        certificate: {
          id: cert.id || cert.code,
          code: cert.code || cert.id,
          certificateNumber: certNumber,
          enrollmentNo: cert.enrollmentNo || (cert as any).enrollmentNumber || '',
          enrollmentNumber: (cert as any).enrollmentNumber || cert.enrollmentNo || '',
          studentName: cert.studentName,
          studentEmail: cert.studentEmail || '',
          courseTitle: cert.courseTitle || cert.course,
          course: cert.courseTitle || cert.course,
          issueDate: cert.issueDate,
          time: (cert as any).time || '11:00 AM TO 1:00 PM',
          venue: (cert as any).venue || 'ROBOTREE ASANSOL',
          status: cert.status || 'VERIFIED',
          issuer: cert.issuer,
          grade: cert.grade,
          hasUploadedFile,
          fileUrl,
          certificateFile: cert.certificateFile,
          fileOriginalName: cert.fileOriginalName,
          revokedAt: cert.revokedAt,
          revokedReason: cert.revokedReason,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = getParam(req, 'id').trim();
      const cert = await repositories.certificates.findByCode(rawId);

      if (!cert) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Certificate reference ID or Enrollment Number not found in official registry.',
        });
        return;
      }

      if (cert.status === 'REVOKED') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'This certificate has been revoked and can no longer be downloaded.',
        });
        return;
      }

      const isInline = req.query.view === 'inline';

      if (cert.certificateFile) {
        const cleanPath = cert.certificateFile.replace(/^assets\//, '');
        const assetsRoot = path.resolve(PROJECT_ROOT, 'assets');
        const fullPath = path.resolve(assetsRoot, cleanPath);
        if (fullPath.startsWith(assetsRoot + path.sep) && fs.existsSync(fullPath)) {
          const rawName = (cert.fileOriginalName || cert.id || cert.code || 'Certificate')
            .replace(/["\r\n]/g, '')
            .trim() || 'Certificate';
          const cleanFileName = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `${isInline ? 'inline' : 'attachment'}; filename="${cleanFileName}"`);
          res.sendFile(fullPath);
          return;
        }
      }

      const pdfBytes = await CertificateService.generatePdf(cert);
      const fallbackName = (cert.id || cert.code || 'Certificate').trim();
      const cleanFallback = fallbackName.toLowerCase().endsWith('.pdf') ? fallbackName : `${fallbackName}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${isInline ? 'inline' : 'attachment'}; filename="${cleanFallback}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(Buffer.from(pdfBytes));
    } catch (err) {
      next(err);
    }
  }

  public static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied: Only system administrators are authorized to generate certificates.',
        });
        return;
      }

      const studentName = req.body.studentName;
      const course = req.body.courseTitle || req.body.courseName || req.body.course || 'Robotics & AI Masterclass';
      const issueDate = req.body.issueDate;
      const enrollmentNo = req.body.enrollmentNo || req.body.enrollmentNumber || '';
      const cert = await CertificateService.issueCertificate(
        {
          studentName,
          enrollmentNo,
          enrollmentNumber: enrollmentNo,
          course,
          courseTitle: course,
          issueDate,
          studentEmail: req.body.studentEmail || req.user?.email,
          issuer: 'Robotree Academic Accreditation Board',
        },
        req.user?.email || 'System Administrator'
      );

      res.json({
        success: true,
        message: 'Certificate generated successfully.',
        certificate: cert,
        certId: cert.id || cert.code,
        downloadUrl: `/api/certificates/download/${encodeURIComponent(cert.id || cert.code)}`,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async issueAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentName, issueDate, grade, certificateNumber, code, fileBase64, fileOriginalName, venue, time } = req.body;
      const enrollmentNo = (req.body.enrollmentNo || req.body.enrollmentNumber || '').trim();
      const studentEmail = req.body.studentEmail || req.body.email || '';
      const course = req.body.courseTitle || req.body.courseName || req.body.course || 'Robotics & AI Masterclass';
      const cert = await CertificateService.issueCertificate(
        {
          studentName,
          studentEmail,
          enrollmentNo,
          enrollmentNumber: enrollmentNo,
          course,
          courseTitle: course,
          certificateNumber: certificateNumber || code,
          issueDate,
          grade: grade || 'A+',
          venue,
          time,
          fileBase64,
          fileOriginalName,
          issuer: 'Robotree Academic Accreditation Board',
        },
        req.user?.email || 'Administrator'
      );

      res.status(201).json({
        success: true,
        message: 'Accredited certificate issued successfully.',
        certificate: cert,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certId = getParam(req, 'id').trim();
      const reason = req.body?.reason || req.query?.reason || 'Administrative revocation';
      const cert = await CertificateService.revokeCertificate(
        certId,
        req.user?.email || 'Administrator',
        String(reason)
      );
      res.json({
        success: true,
        message: 'Certificate marked as revoked.',
        certificate: cert,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async reinstate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certId = getParam(req, 'id').trim();
      const cert = await CertificateService.reinstateCertificate(
        certId,
        req.user?.email || 'Administrator'
      );
      res.json({
        success: true,
        message: 'Certificate reinstated successfully.',
        certificate: cert,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certId = getParam(req, 'id').trim();
      if (req.query?.action === 'revoke') {
        return CertificateController.revoke(req, res, next);
      }
      await CertificateService.deleteCertificate(certId, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Certificate permanently deleted and removed from registry.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async generateWorkshopPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied: Only system administrators are authorized to generate certificates.',
        });
        return;
      }

      const studentName = String(req.body?.studentName || 'Student Name').trim();
      const year = new Date().getFullYear();
      const randSuffix = crypto.randomInt(1000, 10000);
      const certId = String(req.body?.certId || `RBT-WS-${year}-${randSuffix}`).trim();
      const pdfBytes = await CertificateService.generateWorkshopPdf(studentName, certId);

      const safeFilename = `Robotree_Workshop_Certificate_${studentName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(Buffer.from(pdfBytes));
    } catch (err) {
      next(err);
    }
  }
}
