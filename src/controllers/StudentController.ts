import { Request, Response } from 'express';
import { StudentService } from '../services/StudentService';
import { 
  ApiResponse,
  StudentResponse,
  EnrollmentResponse,
  MetadataResponse,
  StudentStatisticResponse,
  SectionCompleteResponse,
  UserAddressResponse
} from '../models/response';
import {
  StudentRequest,
  UserAddressRequest,
  SectionCompleteRequest
} from '../models/request';

export class StudentController {
  constructor(
    private studentService: StudentService
  ) {}

  /**
   * Get all students with pagination (Admin only)
   * GET /api/students
   */
  public getAllStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      const studentPage = await this.studentService.findAll(page, size);
      
      if (!studentPage.content || studentPage.content.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Students not found'
        } as ApiResponse);
        return;
      }

      const baseUrlStr = `/api/students/list?`;
      const metadata: MetadataResponse = {
        totalElements: studentPage.totalElements,
        totalPages: studentPage.totalPages,
        currentPage: studentPage.currentPage,
        size: studentPage.size,
        next: studentPage.hasNext ? `${baseUrlStr}page=${studentPage.currentPage + 1}&size=${size}` : null,
        previous: studentPage.hasPrevious ? `${baseUrlStr}page=${studentPage.currentPage - 1}&size=${size}` : null,
        last: `${baseUrlStr}page=${studentPage.totalPages - 1}&size=${size}`,
        first: `${baseUrlStr}page=0&size=${size}`
      };

      res.status(200).json({
        success: true,
        data: studentPage.content,
        metadata: { pagination: metadata },
        message: 'Students retrieved successfully'
      } as ApiResponse<StudentResponse[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'An error occurred while retrieving students',
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Get student by ID (Admin or own student account)
   * GET /api/students/:id
   */
  public getStudentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const studentResponse = await this.studentService.findById(id);

      if (!studentResponse) {
        res.status(404).json({
          success: false,
          error: { message: 'Student not found' },
          message: 'Student not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: studentResponse,
        message: 'Student retrieved successfully'
      } as ApiResponse<StudentResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Create new student (Admin only)
   * POST /api/students
   */
  public createStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentRequest: StudentRequest = req.body;
      const studentResponse = await this.studentService.createStudent(studentRequest);

      res.status(201).json({
        success: true,
        data: studentResponse,
        message: 'Student created successfully'
      } as ApiResponse<StudentResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: 'An error occurred while creating the student' },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Update student address (Admin or own student account)
   * POST /api/students/:id/update-address
   */
  public updateStudentAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const addressRequest: UserAddressRequest = req.body;
      
      const addressResponse = await this.studentService.updateStudentAddress(id, addressRequest);

      res.status(200).json({
        success: true,
        data: addressResponse,
        message: 'Student address updated successfully'
      } as ApiResponse<UserAddressResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Update student (Admin or own student account)
   * PUT /api/students/:id
   */
  public updateStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const studentRequest: StudentRequest = req.body;
      
      const studentResponse = await this.studentService.updateStudent(id, studentRequest);

      res.status(200).json({
        success: true,
        data: studentResponse,
        message: 'Student updated successfully'
      } as ApiResponse<StudentResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Update student password (Admin or own student account)
   * PUT /api/students/:id/changePassword
   */
  public updateStudentPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const studentRequest: StudentRequest = req.body;
      
      const studentResponse = await this.studentService.updateStudentPassword(id, studentRequest);

      res.status(200).json({
        success: true,
        data: studentResponse,
        message: 'Student password updated successfully'
      } as ApiResponse<StudentResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Delete student (Admin only)
   * DELETE /api/students/:id
   */
  public deleteStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      await this.studentService.deleteStudent(id);

      res.status(204).json({
        success: true,
        message: 'Student deleted successfully'
      } as ApiResponse<void>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Get student's enrolled courses (Admin or own student account)
   * GET /api/students/:id/courses
   */
  public getCoursesByStudentId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      const enrollmentPage = await this.studentService.getCoursesByStudentId(id, page, size);

      const baseUrlStr = `/api/students/${id}/courses?`;
      const metadata: MetadataResponse = {
        totalElements: enrollmentPage.totalElements,
        totalPages: enrollmentPage.totalPages,
        currentPage: enrollmentPage.currentPage,
        size: enrollmentPage.size,
        next: enrollmentPage.hasNext ? `${baseUrlStr}page=${enrollmentPage.currentPage + 1}&size=${size}` : null,
        previous: enrollmentPage.hasPrevious ? `${baseUrlStr}page=${enrollmentPage.currentPage - 1}&size=${size}` : null,
        last: `${baseUrlStr}page=${enrollmentPage.totalPages - 1}&size=${size}`,
        first: `${baseUrlStr}page=0&size=${size}`
      };

      res.status(200).json({
        success: true,
        data: enrollmentPage.content,
        metadata: { pagination: metadata },
        message: 'Student courses retrieved successfully'
      } as ApiResponse<EnrollmentResponse[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Enroll student in course (Admin only)
   * POST /api/students/:studentId/courses/:courseId
   */
  public addStudentToCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      const courseId = parseInt(req.params.courseId);
      
      const enrollmentResponse = await this.studentService.addStudentToCourse(studentId, courseId);

      res.status(201).json({
        success: true,
        data: enrollmentResponse,
        message: 'Student enrolled in course successfully'
      } as ApiResponse<EnrollmentResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Enroll student in all courses from cart (Admin only)
   * POST /api/students/:studentId/enrollFromCart
   */
  public addStudentToCoursesFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const enrollmentResponses = await this.studentService.addStudentToCoursesFromCart(studentId);

      res.status(201).json({
        success: true,
        data: enrollmentResponses,
        message: 'Student enrolled in courses from cart successfully'
      } as ApiResponse<EnrollmentResponse[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Get student statistics (Admin or own student account)
   * GET /api/students/:id/statistics
   */
  public getStudentStatistic = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.id);
      
      const statisticResponse = await this.studentService.getStudentStatistic(studentId);

      res.status(200).json({
        success: true,
        data: statisticResponse,
        message: 'Student statistics retrieved successfully'
      } as ApiResponse<StudentStatisticResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Get current section for student in course (Admin or own student account)
   * GET /api/students/:id/courses/:courseId/current-section
   */
  public getCurrentSection = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.id);
      const courseId = parseInt(req.params.courseId);
      
      const sectionResponse = await this.studentService.getCurrentSection(studentId, courseId);

      res.status(200).json({
        success: true,
        data: sectionResponse,
        message: 'Current section retrieved successfully'
      } as ApiResponse<SectionCompleteResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };

  /**
   * Complete current section (Admin or own student account)
   * PUT /api/students/complete-section
   */
  public completeCurrentSection = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: SectionCompleteRequest = req.body;
      
      const sectionResponse = await this.studentService.completeSection(request);

      res.status(200).json({
        success: true,
        data: sectionResponse,
        message: 'Section completed successfully'
      } as ApiResponse<SectionCompleteResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message },
        message: 'Internal server error'
      } as ApiResponse);
    }
  };
}