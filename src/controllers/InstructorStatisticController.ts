import { Request, Response } from 'express';
import { InstructorStatisticService } from '../services/InstructorStatisticService';
import { ApiResponse } from '../models/response';

export class InstructorStatisticController {
  private instructorStatisticService: InstructorStatisticService;

  constructor() {
    this.instructorStatisticService = new InstructorStatisticService();
  }

  /**
   * Get instructor dashboard statistics
   * GET /api/instructor-statistics/:instructorId/dashboard
   */
  async getInstructorDashboard(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const dashboard = await this.instructorStatisticService.getInstructorDashboard(instructorId);

      res.status(200).json({
        success: true,
        message: 'Instructor dashboard retrieved successfully',
        data: dashboard,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving instructor dashboard',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get instructor course statistics
   * GET /api/instructor-statistics/:instructorId/courses
   */
  async getInstructorCourseStatistics(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const courseStats = await this.instructorStatisticService.getInstructorCourseStatistics(instructorId, page, size);

      res.status(200).json({
        success: true,
        message: 'Instructor course statistics retrieved successfully',
        data: courseStats,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving instructor course statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get instructor revenue statistics
   * GET /api/instructor-statistics/:instructorId/revenue
   */
  async getInstructorRevenue(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const period = req.query.period as string || 'month';

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const revenue = await this.instructorStatisticService.getInstructorRevenue(instructorId, startDate, endDate, period);

      res.status(200).json({
        success: true,
        message: 'Instructor revenue statistics retrieved successfully',
        data: revenue,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving instructor revenue statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get instructor student engagement statistics
   * GET /api/instructor-statistics/:instructorId/engagement
   */
  async getStudentEngagement(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const engagement = await this.instructorStatisticService.getStudentEngagement(instructorId, courseId);

      res.status(200).json({
        success: true,
        message: 'Student engagement statistics retrieved successfully',
        data: engagement,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving student engagement statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get instructor rating and feedback statistics
   * GET /api/instructor-statistics/:instructorId/ratings
   */
  async getInstructorRatings(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const ratings = await this.instructorStatisticService.getInstructorRatings(instructorId, courseId);

      res.status(200).json({
        success: true,
        message: 'Instructor rating statistics retrieved successfully',
        data: ratings,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving instructor rating statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get instructor performance trends
   * GET /api/instructor-statistics/:instructorId/trends
   */
  async getPerformanceTrends(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const metric = req.query.metric as string || 'enrollments';
      const period = req.query.period as string || 'month';
      const limit = parseInt(req.query.limit as string) || 12;

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const trends = await this.instructorStatisticService.getPerformanceTrends(instructorId, metric, period, limit);

      res.status(200).json({
        success: true,
        message: 'Instructor performance trends retrieved successfully',
        data: trends,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving instructor performance trends',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get instructor comparison with platform averages
   * GET /api/instructor-statistics/:instructorId/comparison
   */
  async getInstructorComparison(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const comparison = await this.instructorStatisticService.getInstructorComparison(instructorId);

      res.status(200).json({
        success: true,
        message: 'Instructor comparison retrieved successfully',
        data: comparison,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving instructor comparison',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get instructor top performing content
   * GET /api/instructor-statistics/:instructorId/top-content
   */
  async getTopPerformingContent(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const limit = parseInt(req.query.limit as string) || 10;
      const metric = req.query.metric as string || 'enrollments';

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const topContent = await this.instructorStatisticService.getTopPerformingContent(instructorId, limit, metric);

      res.status(200).json({
        success: true,
        message: 'Top performing content retrieved successfully',
        data: topContent,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving top performing content',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Export instructor statistics report
   * GET /api/instructor-statistics/:instructorId/export
   */
  async exportStatistics(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const format = req.query.format as string || 'json';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const exportData = await this.instructorStatisticService.exportStatistics(instructorId, format, startDate, endDate);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="instructor-stats-${instructorId}.csv"`);
        res.send(exportData);
      } else {
        res.status(200).json({
          success: true,
          message: 'Statistics exported successfully',
          data: exportData,
          timestamp: new Date().toISOString()
        } as ApiResponse<any>);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error exporting statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get total users who bought instructor's courses
   * GET /api/statisticInstructor/:instructorId/totalUsersBuy
   */
  async getTotalUsersBuy(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const totalUsersBuy = await this.instructorStatisticService.getTotalUsersBuy(instructorId);

      res.status(200).json({
        success: true,
        message: 'Total users buy retrieved successfully',
        data: totalUsersBuy,
        timestamp: new Date().toISOString()
      } as ApiResponse<number>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving total users buy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get total revenue for instructor
   * GET /api/statisticInstructor/:instructorId/totalRevenue
   */
  async getTotalRevenue(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const totalRevenue = await this.instructorStatisticService.getTotalRevenue(instructorId);

      res.status(200).json({
        success: true,
        message: 'Total revenue retrieved successfully',
        data: totalRevenue,
        timestamp: new Date().toISOString()
      } as ApiResponse<number>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving total revenue',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get total courses for instructor
   * GET /api/statisticInstructor/:instructorId/totalCourses
   */
  async getTotalCourses(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const totalCourses = await this.instructorStatisticService.getTotalCourses(instructorId);

      res.status(200).json({
        success: true,
        message: 'Total courses retrieved successfully',
        data: totalCourses,
        timestamp: new Date().toISOString()
      } as ApiResponse<number>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving total courses',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get top course for instructor
   * GET /api/statisticInstructor/:instructorId/topCourse
   */
  async getTopCourse(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const topCourse = await this.instructorStatisticService.getTopCourse(instructorId);

      res.status(200).json({
        success: true,
        message: 'Top course retrieved successfully',
        data: topCourse,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving top course',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get revenue per year for instructor
   * GET /api/statisticInstructor/:instructorId/revenuePerYear
   */
  async getRevenuePerYear(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const revenuePerYear = await this.instructorStatisticService.getRevenuePerYear(instructorId);

      res.status(200).json({
        success: true,
        message: 'Revenue per year retrieved successfully',
        data: revenuePerYear,
        timestamp: new Date().toISOString()
      } as ApiResponse<any[]>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving revenue per year',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get courses per year for instructor
   * GET /api/statisticInstructor/:instructorId/coursesPerYear
   */
  async getCoursesPerYear(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = parseInt(req.params.instructorId);

      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid instructor ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const coursesPerYear = await this.instructorStatisticService.getCoursesPerYear(instructorId);

      res.status(200).json({
        success: true,
        message: 'Courses per year retrieved successfully',
        data: coursesPerYear,
        timestamp: new Date().toISOString()
      } as ApiResponse<any[]>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving courses per year',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
}