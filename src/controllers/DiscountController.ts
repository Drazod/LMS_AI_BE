import { Request, Response } from 'express';
import { DiscountService } from '../services/DiscountService';
import { ApiResponse } from '../models/response';

export class DiscountController {
  private discountService: DiscountService;

  constructor() {
    this.discountService = new DiscountService();
  }

  /**
   * Get all discounts with pagination
   * GET /api/discounts
   */
  async getAllDiscounts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const discountPage = await this.discountService.getAllDiscounts(page, size, isActive);

      res.status(200).json({
        success: true,
        message: 'Discounts retrieved successfully',
        data: discountPage,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving discounts',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get discount by ID
   * GET /api/discounts/:discountId
   */
  async getDiscountById(req: Request, res: Response): Promise<void> {
    try {
      const discountId = parseInt(req.params.discountId);

      if (isNaN(discountId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid discount ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const discount = await this.discountService.getDiscountById(discountId);

      if (!discount) {
        res.status(404).json({
          success: false,
          message: 'Discount not found',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Discount retrieved successfully',
        data: discount,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving discount',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Create new discount
   * POST /api/discounts
   */
  async createDiscount(req: Request, res: Response): Promise<void> {
    try {
      const discountData = req.body;

      // Basic validation
      if (!discountData.code || !discountData.discountType || !discountData.value) {
        res.status(400).json({
          success: false,
          message: 'Code, discount type, and value are required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const discount = await this.discountService.createDiscount(discountData);

      res.status(201).json({
        success: true,
        message: 'Discount created successfully',
        data: discount,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating discount',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Update existing discount
   * PUT /api/discounts/:discountId
   */
  async updateDiscount(req: Request, res: Response): Promise<void> {
    try {
      const discountId = parseInt(req.params.discountId);
      const updateData = req.body;

      if (isNaN(discountId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid discount ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const discount = await this.discountService.updateDiscount(discountId, updateData);

      res.status(200).json({
        success: true,
        message: 'Discount updated successfully',
        data: discount,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating discount',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Delete discount
   * DELETE /api/discounts/:discountId
   */
  async deleteDiscount(req: Request, res: Response): Promise<void> {
    try {
      const discountId = parseInt(req.params.discountId);

      if (isNaN(discountId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid discount ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      await this.discountService.deleteDiscount(discountId);

      res.status(200).json({
        success: true,
        message: 'Discount deleted successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting discount',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Apply discount code
   * POST /api/discounts/apply
   */
  async applyDiscount(req: Request, res: Response): Promise<void> {
    try {
      const { code, userId, courseId, totalAmount } = req.body;

      if (!code || !totalAmount) {
        res.status(400).json({
          success: false,
          message: 'Discount code and total amount are required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const discountResult = await this.discountService.applyDiscount(code, userId, courseId, totalAmount);

      res.status(200).json({
        success: true,
        message: 'Discount applied successfully',
        data: discountResult,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error applying discount',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Validate discount code
   * POST /api/discounts/validate
   */
  async validateDiscount(req: Request, res: Response): Promise<void> {
    try {
      const { code, userId, courseId } = req.body;

      if (!code) {
        res.status(400).json({
          success: false,
          message: 'Discount code is required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const validation = await this.discountService.validateDiscount(code, userId, courseId);

      res.status(200).json({
        success: true,
        message: 'Discount validation completed',
        data: validation,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating discount',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get discount usage statistics
   * GET /api/discounts/:discountId/statistics
   */
  async getDiscountStatistics(req: Request, res: Response): Promise<void> {
    try {
      const discountId = parseInt(req.params.discountId);

      if (isNaN(discountId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid discount ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const statistics = await this.discountService.getDiscountStatistics(discountId);

      res.status(200).json({
        success: true,
        message: 'Discount statistics retrieved successfully',
        data: statistics,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving discount statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get active discounts for public display
   * GET /api/discounts/active
   */
  async getActiveDiscounts(req: Request, res: Response): Promise<void> {
    try {
      const discounts = await this.discountService.getActiveDiscounts();

      res.status(200).json({
        success: true,
        message: 'Active discounts retrieved successfully',
        data: discounts,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving active discounts',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
}