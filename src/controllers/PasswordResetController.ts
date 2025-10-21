import { Request, Response } from 'express';
import { PasswordResetService } from '../services/PasswordResetService';
import { ApiResponse } from '../models/response';

export class PasswordResetController {
  private passwordResetService: PasswordResetService;

  constructor() {
    this.passwordResetService = new PasswordResetService();
  }

  /**
   * Request password reset
   * POST /api/password-reset/request
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      await this.passwordResetService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending password reset email',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Verify reset token
   * GET /api/password-reset/verify/:token
   */
  async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Reset token is required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const isValid = await this.passwordResetService.verifyResetToken(token);

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Reset token is valid',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error verifying reset token',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Reset password with token
   * POST /api/password-reset/reset
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Token, new password, and confirm password are required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Passwords do not match',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      await this.passwordResetService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error resetting password',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Change password (authenticated user)
   * POST /api/password-reset/change
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId, currentPassword, newPassword, confirmPassword } = req.body;

      if (!userId || !currentPassword || !newPassword || !confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'User ID, current password, new password, and confirm password are required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'New passwords do not match',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      await this.passwordResetService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error changing password',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get password reset attempts (admin)
   * GET /api/password-reset/attempts
   */
  async getPasswordResetAttempts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;
      const email = req.query.email as string;

      const attemptsPage = await this.passwordResetService.getPasswordResetAttempts(page, size, email);

      res.status(200).json({
        success: true,
        message: 'Password reset attempts retrieved successfully',
        data: attemptsPage,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving password reset attempts',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
}