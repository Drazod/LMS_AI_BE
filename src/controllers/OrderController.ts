import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { PaymentService } from '../services/PaymentService';
import { ApiResponse, PageResponse, MetadataResponse, CheckoutResponse } from '../models/response';
import { Order, OrderStatus } from '../models/entities';
import { CheckoutRequest, PurchaseOrderRequest } from '../models/request';
import { VNPayResponse } from '../services/PaymentService';

export class OrderController {
  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService
  ) {}

  /**
   * Checkout order - calculate total with discount
   * POST /api/orders/checkout
   */
  public checkoutOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const checkoutReq: CheckoutRequest = req.body;

      if (!checkoutReq.idCart || !checkoutReq.idCourses || checkoutReq.idCourses.length === 0) {
        res.status(400).json({
          success: false,
          message: 'idCart and idCourses are required'
        } as ApiResponse);
        return;
      }

      const checkoutResponse = await this.orderService.checkoutOrder(checkoutReq);

      res.status(200).json({
        success: true,
        data: checkoutResponse,
        message: 'Checkout calculated successfully'
      } as ApiResponse<CheckoutResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to checkout order'
      } as ApiResponse);
    }
  };

  /**
   * Process purchase order and create VNPay payment
   * POST /api/orders/processingPurchase
   */
  public processingPurchase = async (req: Request, res: Response): Promise<void> => {
    try {
      const purchaseOrderDTO: PurchaseOrderRequest = req.body;

      if (!purchaseOrderDTO.idUser || !purchaseOrderDTO.checkoutReq || !purchaseOrderDTO.prices) {
        res.status(400).json({
          success: false,
          message: 'idUser, checkoutReq, and prices are required'
        } as ApiResponse);
        return;
      }

      const paymentResponse = await this.orderService.processingPurchaseOrder(purchaseOrderDTO, req);

      res.status(200).json({
        success: true,
        data: paymentResponse,
        message: 'Payment URL created successfully'
      } as ApiResponse<VNPayResponse>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to process purchase order'
      } as ApiResponse);
    }
  };

  /**
   * Create order from cart
   * POST /api/orders/create
   */
  public createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, paymentMethod } = req.body;
      const order = await this.orderService.createOrderFromCart(studentId, paymentMethod);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      } as ApiResponse<Order>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to create order'
      } as ApiResponse);
    }
  };

  /**
   * Get orders by student ID
   * GET /api/orders/student/:studentId
   */
  public getOrdersByStudentId = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = parseInt(req.params.studentId);
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;

      const orderPage = await this.orderService.getOrdersByStudentId(studentId, page, size);

      const baseUrlStr = `/api/orders/student/${studentId}?`;
      const metadata: MetadataResponse = {
        totalElements: orderPage.totalElements,
        totalPages: orderPage.totalPages,
        currentPage: orderPage.currentPage,
        size: orderPage.size,
        next: orderPage.hasNext ? `${baseUrlStr}page=${orderPage.currentPage + 1}&size=${size}` : null,
        previous: orderPage.hasPrevious ? `${baseUrlStr}page=${orderPage.currentPage - 1}&size=${size}` : null,
        last: `${baseUrlStr}page=${orderPage.totalPages - 1}&size=${size}`,
        first: `${baseUrlStr}page=0&size=${size}`
      };

      res.status(200).json({
        success: true,
        data: orderPage.content,
        metadata: { pagination: metadata },
        message: 'Orders retrieved successfully'
      } as ApiResponse<Order[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve orders'
      } as ApiResponse);
    }
  };

  /**
   * Get order by ID
   * GET /api/orders/:orderId
   */
  public getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await this.orderService.getOrderById(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      } as ApiResponse<Order>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve order'
      } as ApiResponse);
    }
  };

  /**
   * Update order status
   * PUT /api/orders/:orderId/status
   */
  public updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { status } = req.body;
      
      const order = await this.orderService.updateOrderStatus(orderId, status);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order status updated successfully'
      } as ApiResponse<Order>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to update order status'
      } as ApiResponse);
    }
  };

  /**
   * Process payment for order
   * POST /api/orders/:orderId/payment
   */
  public processPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const orderId = parseInt(req.params.orderId);
      const paymentData = req.body;
      
      const paymentResult = await this.paymentService.processPayment(orderId, paymentData);

      res.status(200).json({
        success: true,
        data: paymentResult,
        message: 'Payment processed successfully'
      } as ApiResponse<any>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Payment processing failed'
      } as ApiResponse);
    }
  };

  /**
   * Get all orders (Admin only)
   * GET /api/orders
   */
  public getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 10;
      const status = req.query.status as OrderStatus;

      const orderPage = await this.orderService.getAllOrders(page, size, status);

      const baseUrlStr = `/api/orders?`;
      const metadata: MetadataResponse = {
        totalElements: orderPage.totalElements,
        totalPages: orderPage.totalPages,
        currentPage: orderPage.currentPage,
        size: orderPage.size,
        next: orderPage.hasNext ? `${baseUrlStr}page=${orderPage.currentPage + 1}&size=${size}` : null,
        previous: orderPage.hasPrevious ? `${baseUrlStr}page=${orderPage.currentPage - 1}&size=${size}` : null,
        last: `${baseUrlStr}page=${orderPage.totalPages - 1}&size=${size}`,
        first: `${baseUrlStr}page=0&size=${size}`
      };

      res.status(200).json({
        success: true,
        data: orderPage.content,
        metadata: { pagination: metadata },
        message: 'All orders retrieved successfully'
      } as ApiResponse<Order[]>);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve orders'
      } as ApiResponse);
    }
  };
}