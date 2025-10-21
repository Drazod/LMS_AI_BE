import { Request, Response } from 'express';
import { RatingService } from '../services/RatingService';
import { ApiResponse, PageResponse, MetadataResponse } from '../models/response';

export class RatingController {
  constructor(private ratingService: RatingService) {}

  /**
   * Create/Update rating for course
   * POST /api/ratings
   */
  public createOrUpdateRating = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, courseId, rating, comment } = req.body;
      
      const ratingResponse = await this.ratingService.createOrUpdateRating(studentId, courseId, rating, comment);

      res.status(201).json({
        success: true,
        data: ratingResponse,
        message: 'Rating submitted successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to submit rating'
      } as ApiResponse);
    }
  };

  /**
   * Get ratings for course
   * GET /api/ratings/course/:courseId
   */
  public getRatingsByCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.courseId);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      const ratingPage = await this.ratingService.getRatingsByCourse(courseId, page, size);

      const baseUrlStr = `/api/ratings/course/${courseId}?`;
      const metadata: MetadataResponse = {
        totalElements: ratingPage.totalElements,
        totalPages: ratingPage.totalPages,
        currentPage: ratingPage.currentPage,
        size: ratingPage.size,
        next: ratingPage.hasNext ? `${baseUrlStr}page=${ratingPage.currentPage + 1}&size=${size}` : null,
        previous: ratingPage.hasPrevious ? `${baseUrlStr}page=${ratingPage.currentPage - 1}&size=${size}` : null,
        last: `${baseUrlStr}page=${ratingPage.totalPages - 1}&size=${size}`,
        first: `${baseUrlStr}page=0&size=${size}`
      };

      res.status(200).json({
        success: true,
        data: ratingPage.content,
        metadata: { pagination: metadata },
        message: 'Course ratings retrieved successfully'
      } as ApiResponse<any[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve course ratings'
      } as ApiResponse);
    }
  };

  /**
   * Get ratings by student
   * GET /api/ratings/student/:studentId
   */
  public getRatingsByStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      const ratingPage = await this.ratingService.getRatingsByStudent(studentId, page, size);

      const baseUrlStr = `/api/ratings/student/${studentId}?`;
      const metadata: MetadataResponse = {
        totalElements: ratingPage.totalElements,
        totalPages: ratingPage.totalPages,
        currentPage: ratingPage.currentPage,
        size: ratingPage.size,
        next: ratingPage.hasNext ? `${baseUrlStr}page=${ratingPage.currentPage + 1}&size=${size}` : null,
        previous: ratingPage.hasPrevious ? `${baseUrlStr}page=${ratingPage.currentPage - 1}&size=${size}` : null,
        last: `${baseUrlStr}page=${ratingPage.totalPages - 1}&size=${size}`,
        first: `${baseUrlStr}page=0&size=${size}`
      };

      res.status(200).json({
        success: true,
        data: ratingPage.content,
        metadata: { pagination: metadata },
        message: 'Student ratings retrieved successfully'
      } as ApiResponse<any[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve student ratings'
      } as ApiResponse);
    }
  };

  /**
   * Get course rating statistics
   * GET /api/ratings/course/:courseId/stats
   */
  public getCourseRatingStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      const stats = await this.ratingService.getCourseRatingStats(courseId);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Course rating statistics retrieved successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve rating statistics'
      } as ApiResponse);
    }
  };

  /**
   * Delete rating
   * DELETE /api/ratings/:ratingId
   */
  public deleteRating = async (req: Request, res: Response): Promise<void> => {
    try {
      const ratingId = parseInt(req.params.ratingId);
      
      await this.ratingService.deleteRating(ratingId);

      res.status(204).json({
        success: true,
        message: 'Rating deleted successfully'
      } as ApiResponse<void>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to delete rating'
      } as ApiResponse);
    }
  };

  /**
   * Get rating by student and course
   * GET /api/ratings/student/:studentId/course/:courseId
   */
  public getRatingByStudentAndCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      const courseId = parseInt(req.params.courseId);
      
      const rating = await this.ratingService.getRatingByStudentAndCourse(studentId, courseId);

      if (!rating) {
        res.status(404).json({
          success: false,
          message: 'Rating not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: rating,
        message: 'Rating retrieved successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve rating'
      } as ApiResponse);
    }
  };
}