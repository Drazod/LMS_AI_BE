import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { ApiResponse, PageResponse, MetadataResponse } from '../models/response';

export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * Get system dashboard statistics
   * GET /api/admin/dashboard
   */
  public getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve dashboard statistics'
      } as ApiResponse);
    }
  };

  /**
   * Get all users with pagination
   * GET /api/admin/users
   */
  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;
      const role = req.query.role as string;

      const userPage = await this.adminService.getAllUsers(page, size, role);

      const baseUrlStr = `/api/admin/users?`;
      const metadata: MetadataResponse = {
        totalElements: userPage.totalElements,
        totalPages: userPage.totalPages,
        currentPage: userPage.currentPage,
        size: userPage.size,
        next: userPage.hasNext ? `${baseUrlStr}page=${userPage.currentPage + 1}&size=${size}` : null,
        previous: userPage.hasPrevious ? `${baseUrlStr}page=${userPage.currentPage - 1}&size=${size}` : null,
        last: `${baseUrlStr}page=${userPage.totalPages - 1}&size=${size}`,
        first: `${baseUrlStr}page=0&size=${size}`
      };

      res.status(200).json({
        success: true,
        data: userPage.content,
        metadata: { pagination: metadata },
        message: 'Users retrieved successfully'
      } as ApiResponse<any[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve users'
      } as ApiResponse);
    }
  };

  /**
   * Ban/unban user
   * PUT /api/admin/users/:userId/ban
   */
  public toggleUserBan = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      const { banned } = req.body;
      
      const user = await this.adminService.toggleUserBan(userId, banned);

      res.status(200).json({
        success: true,
        data: user,
        message: `User ${banned ? 'banned' : 'unbanned'} successfully`
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to update user ban status'
      } as ApiResponse);
    }
  };

  /**
   * Get system analytics
   * GET /api/admin/analytics
   */
  public getSystemAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      const analytics = await this.adminService.getSystemAnalytics(startDate, endDate);

      res.status(200).json({
        success: true,
        data: analytics,
        message: 'System analytics retrieved successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve system analytics'
      } as ApiResponse);
    }
  };

  /**
   * Approve/reject instructor application
   * PUT /api/admin/instructors/:instructorId/approve
   */
  public approveInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const { approved } = req.body;
      
      const instructor = await this.adminService.approveInstructor(instructorId, approved);

      res.status(200).json({
        success: true,
        data: instructor,
        message: `Instructor ${approved ? 'approved' : 'rejected'} successfully`
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to update instructor approval status'
      } as ApiResponse);
    }
  };

  /**
   * Moderate course content
   * PUT /api/admin/courses/:courseId/moderate
   */
  public moderateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.courseId);
      const { action, reason } = req.body; // action: 'approve', 'reject', 'require_changes'
      
      const course = await this.adminService.moderateCourse(courseId, action, reason);

      res.status(200).json({
        success: true,
        data: course,
        message: `Course ${action} successfully`
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to moderate course'
      } as ApiResponse);
    }
  };
}