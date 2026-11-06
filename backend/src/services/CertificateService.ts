import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repositories } from '../repositories/index.js';
import { Certificate, CertificateStatus } from '../types/index.js';
import { generateCertificateCode, generateVerificationHash } from '../security/tokens.js';
import { NotFoundError } from '../errors/AppError.js';
import { AuditService } from './AuditService.js';
import { PROJECT_ROOT } from '../utils/paths.js';
import { storageService } from './StorageService.js';

export interface IssueCertificateDto {
  studentName: string;
  studentEmail?: string;
  enrollmentNo?: string;
  enrollmentNumber?: string;
  course: string;
  courseTitle?: string;
  certificateNumber?: string;
  issueDate?: string;
  issuer?: string;
  grade?: string;
  fileBase64?: string;
  fileOriginalName?: string;
  venue?: string;
  time?: string;
}

export class CertificateService {
  public static async issueCertificate(dto: IssueCertificateDto, actor = 'System Administrator'): Promise<Certificate> {
    const rawNumber = dto.certificateNumber?.trim();
    const issueDate = dto.issueDate || new Date().toISOString().split('T')[0];
    const courseTitle = dto.courseTitle || dto.course;
    const isWorkshop = /workshop/i.test(courseTitle || '');
    const defaultPrefix = isWorkshop ? 'RBT-WS' : 'RRT';
    const code = rawNumber
      ? rawNumber.toUpperCase()
      : generateCertificateCode(new Date(issueDate).getFullYear() || new Date().getFullYear(), defaultPrefix);
    const certificateNumber = rawNumber ? rawNumber.toUpperCase() : code;
    const verificationHash = generateVerificationHash(code, dto.studentName, issueDate);
    const enrollmentNo = (dto.enrollmentNo || dto.enrollmentNumber || '').trim();

    let certificateFile: string | undefined = undefined;
    let fileOriginalName: string | undefined = undefined;

    if (dto.fileBase64) {
      try {
        const matches = dto.fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const rawBase64 = matches ? matches[2] : dto.fileBase64;
        const buffer = Buffer.from(rawBase64, 'base64');
        const origName = dto.fileOriginalName || `${code}.pdf`;
        certificateFile = await storageService.saveFile(buffer, origName, 'certificates');
        fileOriginalName = origName;
      } catch (err) {
        console.error('Failed to save uploaded certificate file:', err);
      }
    }

    const certificate = await repositories.certificates.create({
      id: code,
      code,
      certificateNumber,
      enrollmentNo: enrollmentNo || undefined,
      enrollmentNumber: enrollmentNo || undefined,
      certificateFile,
      fileOriginalName,
      studentName: dto.studentName.trim(),
      studentEmail: dto.studentEmail?.trim().toLowerCase() || '',
      course: dto.course.trim(),
      courseTitle,
      issueDate,
      grade: dto.grade || 'A+',
      venue: dto.venue || 'ROBOTREE ASANSOL',
      time: dto.time || '11:00 AM TO 1:00 PM',
      status: 'ISSUED',
      verificationHash,
      issuer: dto.issuer || 'Robotree Academic Directorate',
    });

    await AuditService.logAction(actor, 'CERTIFICATE_ISSUED', 'certificates', `Issued ${code} to ${dto.studentName}${enrollmentNo ? ` (Enrollment: ${enrollmentNo})` : ''}`, {
      resourceId: code,
    });

    return certificate;
  }

  public static async verifyCertificate(codeOrId: string): Promise<{
    verified: boolean;
    status: CertificateStatus | 'NOT_FOUND';
    certificate?: {
      code: string;
      id?: string;
      certificateNumber?: string;
      enrollmentNo?: string;
      enrollmentNumber?: string;
      studentName: string;
      studentEmail?: string;
      course: string;
      courseTitle: string;
      issueDate: string;
      status: CertificateStatus;
      issuer: string;
      grade?: string;
      venue?: string;
      time?: string;
      hasUploadedFile?: boolean;
      fileUrl?: string;
      fileOriginalName?: string;
    };
    message?: string;
  }> {
    const cert = await repositories.certificates.findByCode(codeOrId);

    if (!cert) {
      return {
        verified: false,
        status: 'NOT_FOUND',
        message: 'No certificate found matching the reference code or enrollment number.',
      };
    }

    const certNumber = cert.certificateNumber || cert.code || cert.id;
    const hasUploadedFile = Boolean(cert.certificateFile);
    const fileUrl = hasUploadedFile
      ? `/api/certificates/download/${encodeURIComponent(cert.id || cert.code)}`
      : undefined;

    if (cert.status === 'REVOKED') {
      return {
        verified: false,
        status: 'REVOKED',
        certificate: {
          code: cert.code || cert.id,
          id: cert.id || cert.code,
          certificateNumber: certNumber,
          enrollmentNo: cert.enrollmentNo || cert.enrollmentNumber,
          enrollmentNumber: cert.enrollmentNumber || cert.enrollmentNo,
          studentName: cert.studentName,
          studentEmail: cert.studentEmail,
          course: cert.course,
          courseTitle: cert.courseTitle || cert.course,
          issueDate: cert.issueDate,
          status: 'REVOKED',
          issuer: cert.issuer,
          grade: cert.grade,
          venue: cert.venue,
          time: cert.time,
          hasUploadedFile,
          fileUrl,
          fileOriginalName: cert.fileOriginalName,
        },
        message: 'This certificate has been formally revoked by Robotree Robotics LLP.',
      };
    }

    return {
      verified: true,
      status: cert.status,
      certificate: {
        code: cert.code || cert.id,
        id: cert.id || cert.code,
        certificateNumber: certNumber,
        enrollmentNo: cert.enrollmentNo || cert.enrollmentNumber,
        enrollmentNumber: cert.enrollmentNumber || cert.enrollmentNo,
        studentName: cert.studentName,
        studentEmail: cert.studentEmail,
        course: cert.course,
        courseTitle: cert.courseTitle || cert.course,
        issueDate: cert.issueDate,
        status: cert.status,
        issuer: cert.issuer,
        grade: cert.grade,
        venue: cert.venue,
        time: cert.time,
        hasUploadedFile,
        fileUrl,
        fileOriginalName: cert.fileOriginalName,
      },
    };
  }

  public static async getCertificate(codeOrId: string): Promise<Certificate> {
    const cert = await repositories.certificates.findByCode(codeOrId);
    if (!cert) {
      throw new NotFoundError(`Certificate not found: ${codeOrId}`);
    }
    return cert;
  }

  public static async revokeCertificate(codeOrId: string, actor = 'System Administrator', reason?: string): Promise<Certificate> {
    const cert = await repositories.certificates.revoke(codeOrId, reason);
    if (!cert) {
      throw new NotFoundError(`Certificate not found: ${codeOrId}`);
    }

    await AuditService.logAction(actor, 'CERTIFICATE_REVOKED', 'certificates', `Revoked ${codeOrId}. Reason: ${reason || 'N/A'}`, {
      resourceId: codeOrId,
    });

    return cert;
  }

  public static async reinstateCertificate(codeOrId: string, actor = 'System Administrator'): Promise<Certificate> {
    const cert = await repositories.certificates.reinstate(codeOrId);
    if (!cert) {
      throw new NotFoundError(`Certificate not found: ${codeOrId}`);
    }

    await AuditService.logAction(actor, 'CERTIFICATE_REINSTATED', 'certificates', `Reinstated ${codeOrId} to active status`, {
      resourceId: codeOrId,
    });

    return cert;
  }

  public static async deleteCertificate(codeOrId: string, actor = 'System Administrator'): Promise<boolean> {
    const deleted = await repositories.certificates.delete(codeOrId);
    if (!deleted) {
      throw new NotFoundError(`Certificate not found: ${codeOrId}`);
    }

    await AuditService.logAction(actor, 'CERTIFICATE_DELETED', 'certificates', `Permanently deleted ${codeOrId}`, {
      resourceId: codeOrId,
    });

    return true;
  }

  public static async listCertificates(): Promise<Certificate[]> {
    return repositories.certificates.list();
  }

  /**
   * Generates a high-quality PDF certificate buffer using pdf-lib
   */
  public static async generatePdf(certificate: Certificate): Promise<Uint8Array> {
    const templatePath = path.join(PROJECT_ROOT, 'assets', 'certificate_template.jpg');

    if (fs.existsSync(templatePath)) {
      const imgBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([1024, 768]);
      const jpgImage = await pdfDoc.embedJpg(imgBytes);

      page.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: 1024,
        height: 768,
      });

      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      // 1. Student Name (positioned directly and cleanly above the dotted line, zero white blocks)
      const studentName = String(certificate.studentName || 'STUDENT NAME').toUpperCase();
      let nameFontSize = 28;
      if (studentName.length > 28) {
        nameFontSize = 20;
      } else if (studentName.length > 20) {
        nameFontSize = 24;
      }
      const nameWidth = timesBold.widthOfTextAtSize(studentName, nameFontSize);

      page.drawText(studentName, {
        x: (1024 - nameWidth) / 2,
        y: 442,
        size: nameFontSize,
        font: timesBold,
        color: rgb(0.04, 0.12, 0.22),
      });

      // 2. Reference ID (seamlessly replaces placeholder text inside the official bottom card)
      const refCode = String(certificate.code || certificate.id || 'RRT-2026-0001').toUpperCase();
      page.drawRectangle({
        x: 550,
        y: 50,
        width: 190,
        height: 18,
        color: rgb(0.96, 0.97, 0.97), // Perfectly matches card surface color
      });

      const codeFontSize = 11.5;
      const codeWidth = boldFont.widthOfTextAtSize(refCode, codeFontSize);
      page.drawText(refCode, {
        x: 550 + (190 - codeWidth) / 2,
        y: 54,
        size: codeFontSize,
        font: boldFont,
        color: rgb(0.04, 0.12, 0.22),
      });

      // 3. Authentic Mentor & Director Signatures
      const mentorSig = 'Rishav Maji';
      const mentorSigWidth = italicFont.widthOfTextAtSize(mentorSig, 14);
      page.drawText(mentorSig, {
        x: 335 - mentorSigWidth / 2,
        y: 142,
        size: 14,
        font: italicFont,
        color: rgb(0.04, 0.12, 0.22),
      });

      const directorSig = 'Rahul Kr. Ghosh';
      const directorSigWidth = italicFont.widthOfTextAtSize(directorSig, 14);
      page.drawText(directorSig, {
        x: 665 - directorSigWidth / 2,
        y: 142,
        size: 14,
        font: italicFont,
        color: rgb(0.04, 0.12, 0.22),
      });

      return pdfDoc.save();
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Decorative Borders
    const primaryColor = rgb(0.06, 0.18, 0.35); // Deep Navy
    const goldColor = rgb(0.85, 0.65, 0.13);    // Elegant Gold
    const darkSlate = rgb(0.12, 0.15, 0.18);

    // Outer border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderWidth: 3,
      borderColor: primaryColor,
    });

    // Inner gold border
    page.drawRectangle({
      x: 26,
      y: 26,
      width: width - 52,
      height: height - 52,
      borderWidth: 1.5,
      borderColor: goldColor,
    });

    // Header Title
    const orgTitle = 'ROBOTREE ROBOTICS LLP';
    const orgTitleWidth = timesBold.widthOfTextAtSize(orgTitle, 26);
    page.drawText(orgTitle, {
      x: (width - orgTitleWidth) / 2,
      y: height - 80,
      size: 26,
      font: timesBold,
      color: primaryColor,
    });

    const subHeader = 'ISO 9001:2015 CERTIFIED ACADEMIC DIRECTIORATE';
    const subHeaderWidth = helvetica.widthOfTextAtSize(subHeader, 10);
    page.drawText(subHeader, {
      x: (width - subHeaderWidth) / 2,
      y: height - 100,
      size: 10,
      font: helvetica,
      color: goldColor,
    });

    // Certificate of Excellence
    const certTitle = 'CERTIFICATE OF COMPLETION';
    const certTitleWidth = timesBold.widthOfTextAtSize(certTitle, 22);
    page.drawText(certTitle, {
      x: (width - certTitleWidth) / 2,
      y: height - 150,
      size: 22,
      font: timesBold,
      color: goldColor,
    });

    // Presentation text
    const presText = 'This is proudly presented to';
    const presTextWidth = timesItalic.widthOfTextAtSize(presText, 14);
    page.drawText(presText, {
      x: (width - presTextWidth) / 2,
      y: height - 190,
      size: 14,
      font: timesItalic,
      color: darkSlate,
    });

    // Student Name
    const studentName = certificate.studentName.toUpperCase();
    const studentNameWidth = timesBold.widthOfTextAtSize(studentName, 30);
    page.drawText(studentName, {
      x: (width - studentNameWidth) / 2,
      y: height - 240,
      size: 30,
      font: timesBold,
      color: primaryColor,
    });

    // Underline below student name
    page.drawLine({
      start: { x: (width - studentNameWidth) / 2 - 20, y: height - 248 },
      end: { x: (width + studentNameWidth) / 2 + 20, y: height - 248 },
      thickness: 1,
      color: goldColor,
    });

    // Fulfillment text
    const fulfillment = `for successfully completing all practical lab projects and theoretical milestones in`;
    const fulfillWidth = timesRoman.widthOfTextAtSize(fulfillment, 13);
    page.drawText(fulfillment, {
      x: (width - fulfillWidth) / 2,
      y: height - 280,
      size: 13,
      font: timesRoman,
      color: darkSlate,
    });

    // Course Title
    const courseTitle = certificate.courseTitle || certificate.course;
    const courseWidth = timesBold.widthOfTextAtSize(courseTitle, 18);
    page.drawText(courseTitle, {
      x: (width - courseWidth) / 2,
      y: height - 315,
      size: 18,
      font: timesBold,
      color: primaryColor,
    });

    // Footer Info: Issue Date, Cert ID, Directorate Signature
    const certCode = certificate.code || certificate.id;
    page.drawText(`Certificate ID: ${certCode}`, {
      x: 60,
      y: 80,
      size: 10,
      font: helvetica,
      color: darkSlate,
    });

    page.drawText(`Issue Date: ${certificate.issueDate}`, {
      x: 60,
      y: 65,
      size: 10,
      font: helvetica,
      color: darkSlate,
    });

    page.drawText(`Official Verification: https://robotree.org/certificate.html?certId=${certCode}`, {
      x: 60,
      y: 50,
      size: 9,
      font: helvetica,
      color: rgb(0.3, 0.35, 0.4),
    });

    // Signature line
    page.drawLine({
      start: { x: width - 260, y: 80 },
      end: { x: width - 60, y: 80 },
      thickness: 1,
      color: primaryColor,
    });

    page.drawText('DIRECTOR OF ACADEMIC TRAINING', {
      x: width - 245,
      y: 65,
      size: 9,
      font: helvetica,
      color: primaryColor,
    });

    page.drawText('Robotree Robotics LLP', {
      x: width - 210,
      y: 50,
      size: 9,
      font: helvetica,
      color: darkSlate,
    });

    return pdfDoc.save();
  }

  public static async generateWorkshopPdf(studentName: string, certId: string): Promise<Uint8Array> {
    const templateJpeg = path.join(PROJECT_ROOT, 'certificate-generator', 'public', 'certificate.jpeg');
    const templatePng = path.join(PROJECT_ROOT, 'certificate-generator', 'public', 'certificate.png');
    const templatePath = fs.existsSync(templateJpeg) ? templateJpeg : templatePng;

    if (!fs.existsSync(templatePath)) {
      throw new NotFoundError('Certificate template asset not found');
    }

    const imgBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([1024, 771]);

    let image;
    try {
      image = await pdfDoc.embedJpg(imgBytes);
    } catch {
      image = await pdfDoc.embedPng(imgBytes);
    }

    page.drawImage(image, {
      x: 0,
      y: 0,
      width: 1024,
      height: 771,
    });

    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const safeName = (studentName || 'Student Name').trim();
    let fontSize = 38;
    if (safeName.length > 20) {
      fontSize = Math.max(24, 38 - (safeName.length - 20) * 0.9);
    }

    const textWidth = timesBold.widthOfTextAtSize(safeName, fontSize);
    const nameX = (1024 - textWidth) / 2;
    const nameY = 352;

    page.drawText(safeName, {
      x: nameX,
      y: nameY,
      size: fontSize,
      font: timesBold,
      color: rgb(0.04, 0.14, 0.24),
    });

    const idText = `ID: ${certId || 'RBT-WS-2026-0001'}`;
    const idWidth = regularFont.widthOfTextAtSize(idText, 11);
    page.drawText(idText, {
      x: 1024 - idWidth - 30,
      y: 22,
      size: 11,
      font: regularFont,
      color: rgb(0.06, 0.17, 0.28),
    });

    return pdfDoc.save();
  }
}
