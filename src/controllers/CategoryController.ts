import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { ApiResponse } from '../models/response';

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  /**
   * Get all categories
   * GET /api/categories
   */
  public getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.categoryService.findAll();
      
      res.status(200).json({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      } as ApiResponse<any[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve categories'
      } as ApiResponse);
    }
  };

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  public getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const category = await this.categoryService.findById(id);

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: category,
        message: 'Category retrieved successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve category'
      } as ApiResponse);
    }
  };

  /**
   * Create category (Admin only)
   * POST /api/categories
   */
  public createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryData = req.body;
      const category = await this.categoryService.create(categoryData);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to create category'
      } as ApiResponse);
    }
  };

  /**
   * Update category (Admin only)
   * PUT /api/categories/:id
   */
  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const category = await this.categoryService.update(id, updateData);

      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to update category'
      } as ApiResponse);
    }
  };

  /**
   * Delete category (Admin only)
   * DELETE /api/categories/:id
   */
  public deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      
      await this.categoryService.delete(id);

      res.status(204).json({
        success: true,
        message: 'Category deleted successfully'
      } as ApiResponse<void>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to delete category'
      } as ApiResponse);
    }
  };

  /**
   * Get courses by category
   * GET /api/categories/:id/courses
   */
  public getCoursesByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;
      
      const coursePage = await this.categoryService.getCoursesByCategory(categoryId, page, size);

      res.status(200).json({
        success: true,
        data: coursePage,
        message: 'Category courses retrieved successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve category courses'
      } as ApiResponse);
    }
  };
}