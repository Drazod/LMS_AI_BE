import { Request, Response } from 'express';
// Remove express-validator for now - will implement custom validation
import { CourseService } from '../services/CourseService';
import { CategoryService } from '../services/CategoryService';
import { 
  ApiResponse, 
  PaginatedResponse,
  CourseResponse,
  CourseDetailResponse 
} from '../models/response';
import { 
  CourseCreateRequest, 
  CourseUpdateRequest, 
  CourseStatusRequest 
} from '../models/request';

export class CourseController {
  constructor(
    private courseService: CourseService,
    private categoryService: CategoryService = new CategoryService()
  ) {}

  /**
   * Validate that request body is a valid object and not null/undefined
   */
  private validateRequestBody(req: Request, res: Response): boolean {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        message: 'Request body must be a valid JSON object'
      } as ApiResponse);
      return false;
    }
    return true;
  }

  /**
   * Get all courses with pagination and filtering
   * GET /api/courses
   */
  public getAllCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        instructor
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // Build filter criteria
      const filters: any = {};
      if (category) filters.categoryId = parseInt(category as string);
      if (status) filters.status = status as string;
      if (instructor) filters.instructorId = parseInt(instructor as string);
      if (search) filters.search = search as string;

      const result = await this.courseService.findAll({
        page: pageNum,
        limit: limitNum,
        filters,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      if (result.courses.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No courses found',
          message: 'No courses match the specified criteria'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.courses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum)
        }
      } as PaginatedResponse<CourseResponse>);

    } catch (error: any) {
      console.error('Get courses error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve courses'
      } as ApiResponse);
    }
  };

  /**
   * Get course with sections and content
   * GET /api/courses/:id/detailed
   */
  public getCourseWithSections = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
          message: 'Course ID must be a valid number'
        } as ApiResponse);
        return;
      }

      const course = await this.courseService.getCourseWithSections(courseId);
      
      if (!course) {
        res.status(404).json({
          success: false,
          error: 'Course not found',
          message: `Course with ID ${courseId} does not exist`
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: course,
        message: 'Course with sections retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Get course with sections error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve course details'
      } as ApiResponse);
    }
  };

  /**
   * Get course by ID with detailed information
   * GET /api/courses/:id
   */
  public getCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
          message: 'Course ID must be a valid number'
        } as ApiResponse);
        return;
      }

      const course = await this.courseService.findById(courseId);
      
      if (!course) {
        res.status(404).json({
          success: false,
          error: 'Course not found',
          message: `Course with ID ${courseId} does not exist`
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: course,
        message: 'Course retrieved successfully'
      } as ApiResponse<CourseDetailResponse>);

    } catch (error: any) {
      console.error('Get course by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve course'
      } as ApiResponse);
    }
  };

  /**
   * Create new course
   * POST /api/courses
   */
  public createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      // Simple validation - will implement detailed validation later  
      if (!req.body.title) {
        res.status(400).json({
          success: false,
          message: 'Title is required'
        } as ApiResponse);
        return;
      }

      if (!req.body.categoryId && !req.body.categoryName) {
        res.status(400).json({
          success: false,
          message: 'Either categoryId or categoryName is required'
        } as ApiResponse);
        return;
      }

      const courseData: CourseCreateRequest = req.body;
      
      // Set instructorId from authenticated user
      courseData.instructorId = (req as any).user.userId;
      
      // Handle Cloudinary upload if present
      if ((req as any).cloudinaryUrl) {
        courseData.courseThumbnail = (req as any).cloudinaryUrl;
      }

      // Handle category - either find existing by ID or create/find by name
      if (!courseData.categoryId && courseData.categoryName) {
        const category = await this.categoryService.findOrCreateByName(
          courseData.categoryName,
          courseData.categoryDescription
        );
        
        if (!category) {
          res.status(500).json({
            success: false,
            error: 'Failed to create or find category',
            message: 'Category processing failed'
          } as ApiResponse);
          return;
        }
        
        courseData.categoryId = category.categoryId;
      } else if (courseData.categoryId) {
        // Verify that the category exists
        const category = await this.categoryService.findById(courseData.categoryId);
        if (!category) {
          res.status(400).json({
            success: false,
            error: 'Invalid category ID',
            message: 'The specified category does not exist'
          } as ApiResponse);
          return;
        }
      }

      const newCourse = await this.courseService.create(courseData);
      
      if (!newCourse) {
        res.status(500).json({
          success: false,
          error: 'Failed to create course',
          message: 'Course creation failed'
        } as ApiResponse);
        return;
      }

      res.status(201).json({
        success: true,
        data: newCourse,
        message: 'Course created successfully'
      } as ApiResponse<CourseResponse>);

    } catch (error: any) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create course'
      } as ApiResponse);
    }
  };

  /**
   * Update existing course
   * PUT /api/courses/:id
   */
  public updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
          message: 'Course ID must be a valid number'
        } as ApiResponse);
        return;
      }

      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      // Simple validation for update - will implement detailed validation later  
      const updateData: CourseUpdateRequest = req.body;
      
      // Handle Cloudinary upload if present
      if ((req as any).cloudinaryUrl) {
        updateData.courseThumbnail = (req as any).cloudinaryUrl;
      }

      const updatedCourse = await this.courseService.update(courseId, updateData);
      
      if (!updatedCourse) {
        res.status(404).json({
          success: false,
          error: 'Course not found',
          message: `Course with ID ${courseId} does not exist`
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully'
      } as ApiResponse<CourseResponse>);

    } catch (error: any) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update course'
      } as ApiResponse);
    }
  };

  /**
   * Update course status
   * PATCH /api/courses/:id/status
   */
  public updateCourseStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
          message: 'Course ID must be a valid number'
        } as ApiResponse);
        return;
      }

      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      const { status }: CourseStatusRequest = req.body;
      
      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
          message: 'Course status must be provided'
        } as ApiResponse);
        return;
      }

      const updatedCourse = await this.courseService.updateStatus(courseId, status);
      
      if (!updatedCourse) {
        res.status(404).json({
          success: false,
          error: 'Course not found',
          message: `Course with ID ${courseId} does not exist`
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedCourse,
        message: 'Course status updated successfully'
      } as ApiResponse<CourseResponse>);

    } catch (error: any) {
      console.error('Update course status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update course status'
      } as ApiResponse);
    }
  };

  /**
   * Delete course
   * DELETE /api/courses/:id
   */
  public deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
          message: 'Course ID must be a valid number'
        } as ApiResponse);
        return;
      }

      const deleted = await this.courseService.delete(courseId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Course not found',
          message: `Course with ID ${courseId} does not exist`
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
      } as ApiResponse);

    } catch (error: any) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete course'
      } as ApiResponse);
    }
  };

  /**
   * Get courses by instructor
   * GET /api/courses/instructor/:instructorId
   */
  public getCoursesByInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const { page = 1, limit = 10 } = req.query;
      
      if (isNaN(instructorId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid instructor ID',
          message: 'Instructor ID must be a valid number'
        } as ApiResponse);
        return;
      }

      const result = await this.courseService.findByInstructor(
        instructorId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result.content,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.totalElements,
          totalPages: result.totalPages
        }
      } as PaginatedResponse<CourseResponse>);

    } catch (error: any) {
      console.error('Get courses by instructor error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve instructor courses'
      } as ApiResponse);
    }
  };

  /**
   * Get available categories for course creation
   * GET /api/courses/categories
   */
  public getAvailableCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.categoryService.findAll();
      
      res.status(200).json({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      } as ApiResponse<any[]>);

    } catch (error: any) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve categories'
      } as ApiResponse);
    }
  };

  /**
   * Get courses by category
   * GET /api/courses/category/:categoryId
   */
  public getCoursesByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const { page = 1, limit = 10 } = req.query;
      
      if (isNaN(categoryId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid category ID',
          message: 'Category ID must be a valid number'
        } as ApiResponse);
        return;
      }

      const result = await this.courseService.findByCategory(
        categoryId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result.courses,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit as string))
        }
      } as PaginatedResponse<CourseResponse>);

    } catch (error: any) {
      console.error('Get courses by category error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve category courses'
      } as ApiResponse);
    }
  };
}