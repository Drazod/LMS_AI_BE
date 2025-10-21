import { Request, Response } from 'express';
import { CertificateService } from '../services/CertificateService';
import { ApiResponse } from '../models/response';

export class CertificateController {
  private certificateService: CertificateService;

  constructor() {
    this.certificateService = new CertificateService();
  }

  /**
   * Generate certificate for course completion
   * POST /api/certificates/generate
   */
  async generateCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.body;

      if (!userId || !courseId) {
        res.status(400).json({
          success: false,
          message: 'User ID and Course ID are required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const certificate = await this.certificateService.generateCertificate(userId, courseId);

      res.status(201).json({
        success: true,
        message: 'Certificate generated successfully',
        data: certificate,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating certificate',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get certificate by ID
   * GET /api/certificates/:certificateId
   */
  async getCertificateById(req: Request, res: Response): Promise<void> {
    try {
      const certificateId = parseInt(req.params.certificateId);

      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const certificate = await this.certificateService.getCertificateById(certificateId);

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Certificate retrieved successfully',
        data: certificate,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving certificate',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get user's certificates
   * GET /api/certificates/user/:userId
   */
  async getUserCertificates(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const certificatePage = await this.certificateService.getUserCertificates(userId, page, size);

      res.status(200).json({
        success: true,
        message: 'User certificates retrieved successfully',
        data: certificatePage,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving user certificates',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Verify certificate authenticity
   * POST /api/certificates/verify
   */
  async verifyCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId, verificationCode } = req.body;

      if (!certificateId || !verificationCode) {
        res.status(400).json({
          success: false,
          message: 'Certificate ID and verification code are required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const verification = await this.certificateService.verifyCertificate(certificateId, verificationCode);

      res.status(200).json({
        success: true,
        message: 'Certificate verification completed',
        data: verification,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error verifying certificate',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Download certificate PDF
   * GET /api/certificates/:certificateId/download
   */
  async downloadCertificate(req: Request, res: Response): Promise<void> {
    try {
      const certificateId = parseInt(req.params.certificateId);

      if (isNaN(certificateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid certificate ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const pdfBuffer = await this.certificateService.generateCertificatePDF(certificateId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error downloading certificate',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get certificate template
   * GET /api/certificates/template/:templateId
   */
  async getCertificateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = parseInt(req.params.templateId);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid template ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const template = await this.certificateService.getCertificateTemplate(templateId);

      res.status(200).json({
        success: true,
        message: 'Certificate template retrieved successfully',
        data: template,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving certificate template',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
}