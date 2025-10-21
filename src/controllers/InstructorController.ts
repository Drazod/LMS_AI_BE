import { Request, Response } from 'express';
import { InstructorService } from '../services/InstructorService';
import { CourseService } from '../services/CourseService';
import { 
  ApiResponse,
  InstructorResponse,
  CourseDetailResponse2,
  UserAddressResponse,
  PageResponse,
  MetadataResponse
} from '../models/response';
import {
  InstructorRequest,
  InstructorUpdateRequest,
  UserAddressRequest
} from '../models/request';

export class InstructorController {
  constructor(
    private instructorService: InstructorService,
    private courseService: CourseService
  ) {}

  /**
   * Get all instructors (Admin only)
   * GET /api/instructors
   */
  public getAllInstructors = async (req: Request, res: Response): Promise<void> => {
    try {
      const instructors = await this.instructorService.findAll();
      
      if (!instructors || instructors.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Instructors not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: instructors,
        message: 'Instructors retrieved successfully'
      } as ApiResponse<InstructorResponse[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving instructors'
      } as ApiResponse);
    }
  };

  /**
   * Get instructors by name (Admin only)
   * GET /api/instructors/name/:name
   */
  public getInstructorsByName = async (req: Request, res: Response): Promise<void> => {
    try {
      const name = req.params.name;
      const instructors = await this.instructorService.findByName(name);
      
      if (!instructors || instructors.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Instructors not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: instructors,
        message: 'Instructors retrieved successfully'
      } as ApiResponse<InstructorResponse[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving instructors'
      } as ApiResponse);
    }
  };

  /**
   * Get instructor by ID (Admin or own instructor account)
   * GET /api/instructors/id/:id
   */
  public getInstructorById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const instructor = await this.instructorService.findById(id);

      if (!instructor) {
        res.status(404).json({
          success: false,
          message: 'Instructor not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: instructor,
        message: 'Instructor retrieved successfully'
      } as ApiResponse<InstructorResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving instructor'
      } as ApiResponse);
    }
  };

  /**
   * Create new instructor (Admin only)
   * POST /api/instructors
   */
  public createInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const instructorRequest: InstructorRequest = req.body;
      const instructorResponse = await this.instructorService.createInstructor(instructorRequest);

      res.status(201).json({
        success: true,
        data: instructorResponse,
        message: 'Instructor created successfully'
      } as ApiResponse<InstructorResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while creating instructor'
      } as ApiResponse);
    }
  };

  /**
   * Update instructor (Admin or own instructor account)
   * PUT /api/instructors/:id
   */
  public updateInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const updateRequest: InstructorUpdateRequest = req.body;
      
      const instructorResponse = await this.instructorService.updateInstructor(updateRequest, id);

      res.status(200).json({
        success: true,
        data: instructorResponse,
        message: 'Instructor updated successfully'
      } as ApiResponse<InstructorResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating instructor'
      } as ApiResponse);
    }
  };

  /**
   * Update instructor password (Admin or own instructor account)
   * PUT /api/instructors/:id/updatepassword
   */
  public updateInstructorPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const password = req.query.password as string;
      
      const instructorResponse = await this.instructorService.updateInstructorPassword(id, password);

      res.status(200).json({
        success: true,
        data: instructorResponse,
        message: 'Instructor password updated successfully'
      } as ApiResponse<InstructorResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while updating password'
      } as ApiResponse);
    }
  };

  /**
   * Recover instructor password (Admin or own instructor account)
   * PUT /api/instructors/:id/recoverpassword
   */
  public recoverInstructorPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const password = req.query.password as string;
      
      const instructorResponse = await this.instructorService.recoverInstructorPassword(id, password);

      res.status(200).json({
        success: true,
        data: instructorResponse,
        message: 'Instructor password recovered successfully'
      } as ApiResponse<InstructorResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while recovering password'
      } as ApiResponse);
    }
  };

  /**
   * Delete instructor (Admin only)
   * DELETE /api/instructors/:id
   */
  public deleteInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      await this.instructorService.deleteInstructor(id);

      res.status(204).json({
        success: true,
        message: 'Instructor deleted successfully'
      } as ApiResponse<void>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while deleting instructor'
      } as ApiResponse);
    }
  };

  /**
   * Get instructor's courses (Admin or own instructor account)
   * GET /api/instructors/:id/course
   */
  public getInstructorCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 5;

      const coursePage = await this.courseService.getCoursesByInstructorId(id, page + 1, size); // Convert 0-based to 1-based for service

      const baseUrlStr = `/api/instructors/${id}/course?`;
      const metadata: MetadataResponse = {
        totalElements: coursePage.totalElements,
        totalPages: coursePage.totalPages,
        currentPage: coursePage.currentPage,
        size: coursePage.size,
        next: coursePage.hasNext ? `${baseUrlStr}page=${coursePage.currentPage + 2}` : null, // Convert back to 1-based
        previous: coursePage.hasPrevious ? `${baseUrlStr}page=${coursePage.currentPage}` : null, // Convert back to 1-based
        last: `${baseUrlStr}page=${coursePage.totalPages}`,
        first: `${baseUrlStr}page=1`
      };

      res.status(200).json({
        success: true,
        data: coursePage,
        metadata: { pagination: metadata },
        message: 'Instructor courses retrieved successfully'
      } as any);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving courses'
      } as ApiResponse);
    }
  };

  /**
   * Update instructor address (Admin or own instructor account)
   * POST /api/instructors/:id/update-address
   */
  public updateInstructorAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const addressRequest: UserAddressRequest = req.body;
      
      const addressResponse = await this.instructorService.updateInstructorAddress(id, addressRequest);

      res.status(201).json({
        success: true,
        data: addressResponse,
        message: 'Instructor address updated successfully'
      } as ApiResponse<UserAddressResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };
}