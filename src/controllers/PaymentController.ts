import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { ApiResponse } from '../models/response';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Process payment for course/order
   * POST /api/payments/process
   */
  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, paymentMethod, amount, currency, paymentData } = req.body;

      if (!orderId || !paymentMethod || !amount) {
        res.status(400).json({
          success: false,
          message: 'Order ID, payment method, and amount are required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const paymentResult = await this.paymentService.processPayment(orderId, {
        paymentMethod,
        totalPrice: amount,
        currency: currency || 'USD',
        cardToken: paymentData?.cardToken,
        paypalToken: paymentData?.paypalToken
      });

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: paymentResult,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing payment',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get payment by ID
   * GET /api/payments/:paymentId
   */
  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const paymentId = parseInt(req.params.paymentId);

      if (isNaN(paymentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid payment ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const payment = await this.paymentService.getPaymentById(paymentId);

      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment not found',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving payment',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get user's payment history
   * GET /api/payments/user/:userId
   */
  async getUserPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const paymentPage = await this.paymentService.getUserPayments(userId, page, size);

      res.status(200).json({
        success: true,
        message: 'User payments retrieved successfully',
        data: paymentPage,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving user payments',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Refund payment
   * POST /api/payments/:paymentId/refund
   */
  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentId = parseInt(req.params.paymentId);
      const { amount, reason } = req.body;

      if (isNaN(paymentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid payment ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const refund = await this.paymentService.refundPayment(paymentId, reason);

      res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: refund,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing refund',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get payment methods for user
   * GET /api/payments/methods/:userId
   */
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const paymentMethods = await this.paymentService.getPaymentMethods(userId);

      res.status(200).json({
        success: true,
        message: 'Payment methods retrieved successfully',
        data: paymentMethods,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving payment methods',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Create payment intent (for Stripe-like flow)
   * POST /api/payments/intent
   */
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { amount, currency, orderId, paymentMethod } = req.body;

      if (!amount || !orderId) {
        res.status(400).json({
          success: false,
          message: 'Amount and order ID are required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const paymentIntent = await this.paymentService.createPaymentIntent({
        amount,
        currency: currency || 'USD',
        orderId,
        paymentMethod
      });

      res.status(201).json({
        success: true,
        message: 'Payment intent created successfully',
        data: paymentIntent,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating payment intent',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Confirm payment intent
   * POST /api/payments/intent/:intentId/confirm
   */
  async confirmPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const intentId = req.params.intentId;
      const { paymentData } = req.body;

      if (!intentId) {
        res.status(400).json({
          success: false,
          message: 'Payment intent ID is required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      const confirmedPayment = await this.paymentService.confirmPaymentIntent(intentId, paymentData);

      res.status(200).json({
        success: true,
        message: 'Payment intent confirmed successfully',
        data: confirmedPayment,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error confirming payment intent',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Handle webhook from payment provider
   * POST /api/payments/webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] || req.headers['paypal-signature'];
      const payload = req.body;

      if (!signature) {
        res.status(400).json({
          success: false,
          message: 'Missing webhook signature',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
        return;
      }

      await this.paymentService.handleWebhook(payload, signature as string);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Get payment statistics (admin)
   * GET /api/payments/statistics
   */
  async getPaymentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const statistics = await this.paymentService.getPaymentStatistics(startDate, endDate);

      res.status(200).json({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: statistics,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving payment statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
}