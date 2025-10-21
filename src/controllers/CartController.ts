import { Request, Response } from 'express';
import { CartService } from '../services/CartService';
import { StudentService } from '../services/StudentService';
import { ApiResponse, PageResponse, MetadataResponse } from '../models/response';
import { Cart, CartItem } from '../models/entities';

export class CartController {
  constructor(
    private cartService: CartService,
    private studentService: StudentService
  ) {}

  /**
   * Create cart for student
   * POST /api/cart/createCart
   */
  public createCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.query.studentId as string);
      const cart = await this.cartService.createCart(studentId);

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Cart created successfully'
      } as ApiResponse<Cart>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to create cart'
      } as ApiResponse);
    }
  };

  /**
   * Add course to cart
   * POST /api/cart/addCourse
   */
  public addCourseToCart = async (req: Request, res: Response): Promise<void> => {
    try {
      // Try to get studentId from body first, then query, then user from auth middleware
      const studentId = parseInt(req.body.studentId) || 
                       parseInt(req.query.studentId as string) || 
                       (req as any).user?.userId;
      const courseId = parseInt(req.body.courseId) || 
                      parseInt(req.query.courseId as string);
      
      // Validate required parameters
      if (!studentId || isNaN(studentId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid or missing student ID',
          message: 'Student ID is required'
        } as ApiResponse);
        return;
      }

      if (!courseId || isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid or missing course ID',
          message: 'Course ID is required'
        } as ApiResponse);
        return;
      }
      
      const cartItem = await this.cartService.addCourseToCart(studentId, courseId);

      res.status(200).json({
        success: true,
        data: cartItem,
        message: 'Course added to cart successfully'
      } as ApiResponse<CartItem>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to add course to cart'
      } as ApiResponse);
    }
  };

  /**
   * Get courses from cart with pagination
   * GET /api/cart/:studentId/listCourse
   */
  public getListCourseFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      const coursePage = await this.cartService.getListCourseFromCart(studentId, page, size);

      if (!coursePage.content || coursePage.content.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No courses found in cart'
        } as ApiResponse);
        return;
      }

      const baseUrlStr = `/api/cart/${studentId}/listCourse?`;
      const metadata: MetadataResponse = {
        totalElements: coursePage.totalElements,
        totalPages: coursePage.totalPages,
        currentPage: coursePage.currentPage,
        size: coursePage.size,
        next: coursePage.hasNext ? `${baseUrlStr}page=${coursePage.currentPage + 1}&size=${size}` : null,
        previous: coursePage.hasPrevious ? `${baseUrlStr}page=${coursePage.currentPage - 1}&size=${size}` : null,
        last: `${baseUrlStr}page=${coursePage.totalPages - 1}&size=${size}`,
        first: `${baseUrlStr}page=0&size=${size}`
      };

      res.status(200).json({
        success: true,
        data: coursePage.content,
        metadata: { pagination: metadata },
        message: 'Cart courses retrieved successfully'
      } as ApiResponse<any[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve cart courses'
      } as ApiResponse);
    }
  };

  /**
   * Remove course from cart
   * DELETE /api/cart/removeCourse
   */
  public removeCourseFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.query.studentId as string);
      const courseId = parseInt(req.query.courseId as string);
      
      await this.cartService.removeCourseFromCart(studentId, courseId);

      res.status(200).json({
        success: true,
        message: 'Course removed from cart successfully'
      } as ApiResponse<void>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to remove course from cart'
      } as ApiResponse);
    }
  };

  /**
   * Clear cart
   * DELETE /api/cart/:studentId/clear
   */
  public clearCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      await this.cartService.clearCart(studentId);

      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully'
      } as ApiResponse<void>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to clear cart'
      } as ApiResponse);
    }
  };

  /**
   * Get cart total
   * GET /api/cart/:studentId/total
   */
  public getCartTotal = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const totalAmount = await this.cartService.getCartTotal(studentId);

      res.status(200).json({
        success: true,
        data: { totalAmount },
        message: 'Cart total retrieved successfully'
      } as ApiResponse<{ totalAmount: number }>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get cart total'
      } as ApiResponse);
    }
  };

  /**
   * Get cart info (including cart ID)
   * GET /api/cart/:studentId/getCartId
   */
  public getCartInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const cart = await this.cartService.getCartByStudentId(studentId);

      if (!cart) {
        res.status(404).json({
          success: false,
          message: 'Cart not found for this student'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Cart info retrieved successfully'
      } as ApiResponse<Cart>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to get cart info'
      } as ApiResponse);
    }
  };
}