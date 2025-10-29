import { Order, OrderStatus, OrderItem, PaymentInfo } from '../models/entities';
import { PageResponse, CheckoutResponse } from '../models/response';
import { CheckoutRequest, PurchaseOrderRequest } from '../models/request';
import { getRepository } from 'typeorm';
import { CourseEntity } from '../models/entities/CourseEntity';
import { PaymentService, VNPayResponse } from './PaymentService';
import { Request } from 'express';

export class OrderService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Calculate checkout order total with discount
   */
  async checkoutOrder(checkoutReq: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const courseRepo = getRepository(CourseEntity);
      let totalPrice = 0;

      // Calculate total price from courses
      for (const idCourse of checkoutReq.idCourses) {
        const course = await courseRepo.findOne({ where: { courseId: idCourse } });
        if (!course) {
          throw new Error(`Course with ID ${idCourse} not found. Please update cart.`);
        }
        totalPrice += Number(course.price) || 0;
      }

      let discountPrice = 0;

      // Apply discount if provided
      if (checkoutReq.idDiscount !== null && checkoutReq.idDiscount !== undefined) {
        // TODO: Implement discount lookup when Discount entity is available
        // For now, using raw query as fallback
        const connection = courseRepo.manager.connection;
        const discountResult = await connection.query(
          'SELECT * FROM discount WHERE discount_id = $1',
          [checkoutReq.idDiscount]
        );
        
        if (discountResult.length === 0) {
          throw new Error('Discount does not exist');
        }
        
        const discount = discountResult[0];
        discountPrice = Number(discount.value || discount.discount_value || 0);
      }

      const finalPrice = totalPrice - discountPrice;

      return {
        totalPrice,
        discountPrice,
        finalPrice
      };
    } catch (error) {
      console.error('Error in checkoutOrder:', error);
      throw error;
    }
  }

  /**
   * Process purchase order and create VNPay payment
   */
  async processingPurchaseOrder(purchaseOrderDTO: PurchaseOrderRequest, request: Request): Promise<VNPayResponse> {
    try {
      const idUser = purchaseOrderDTO.idUser;
      const idCart = purchaseOrderDTO.checkoutReq.idCart;
      
      // Build order info string
      let orderInfo = `${idUser}##`;
      
      // Verify cart items exist
      // TODO: Add cart items verification with database
      for (const idCourse of purchaseOrderDTO.checkoutReq.idCourses) {
        orderInfo += `${idCourse}#`;
      }

      // Add discount if present
      const idDiscount = purchaseOrderDTO.checkoutReq.idDiscount;
      if (idDiscount !== null && idDiscount !== undefined) {
        orderInfo += `#${idDiscount}`;
      }

      // Verify checkout prices match
      const checkoutResponse = await this.checkoutOrder(purchaseOrderDTO.checkoutReq);
      
      if (checkoutResponse.totalPrice !== purchaseOrderDTO.prices.totalPrice ||
          checkoutResponse.finalPrice !== purchaseOrderDTO.prices.finalPrice ||
          checkoutResponse.discountPrice !== purchaseOrderDTO.prices.discountPrice) {
        throw new Error('Price mismatch error');
      }

      // Create VNPay payment
      return this.paymentService.createVnPayPayment(request, checkoutResponse.finalPrice, orderInfo);
    } catch (error) {
      console.error('Error in processingPurchaseOrder:', error);
      throw error;
    }
  }

  /**
   * Create order from cart
   */
  async createOrderFromCart(studentId: number, paymentMethod: string): Promise<Order> {
    // Mock implementation - replace with database integration
    const orderId = Date.now();
    return {
      id: orderId,
      orderId,
      studentId,
      paymentDate: new Date(),
      totalPrice: 248,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      orderItems: [
        {
          orderId,
          courseId: 1,
          price: 99,
          purchasedAt: new Date()
        },
        {
          orderId,
          courseId: 2,
          price: 149,
          purchasedAt: new Date()
        }
      ]
    };
  }

  /**
   * Get orders by student ID with pagination
   */
  async getOrdersByStudentId(studentId: number, page: number, size: number): Promise<PageResponse<Order>> {
    // Mock implementation - replace with database integration
    const mockOrders: Order[] = [
      {
        id: 1,
        orderId: 1,
        studentId,
        paymentDate: new Date(),
        totalPrice: 248,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        orderId: 2,
        studentId,
        paymentDate: new Date(),
        totalPrice: 99,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const startIndex = page * size;
    const endIndex = startIndex + size;
    const content = mockOrders.slice(startIndex, endIndex);

    return {
      content,
      totalElements: mockOrders.length,
      totalPages: Math.ceil(mockOrders.length / size),
      currentPage: page,
      size,
      hasNext: endIndex < mockOrders.length,
      hasPrevious: page > 0,
      isFirst: page === 0,
      isLast: endIndex >= mockOrders.length
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number): Promise<Order | null> {
    // Mock implementation - replace with database integration
    if (orderId === 1) {
      return {
        id: 1,
        orderId: 1,
        studentId: 1,
        paymentDate: new Date(),
        totalPrice: 248,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderItems: [
          {
            orderId: 1,
            courseId: 1,
            price: 99,
            purchasedAt: new Date()
          },
          {
            orderId: 1,
            courseId: 2,
            price: 149,
            purchasedAt: new Date()
          }
        ]
      };
    }
    return null;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    // Mock implementation - replace with database integration
    return {
      id: orderId,
      orderId,
      studentId: 1,
      paymentDate: new Date(),
      totalPrice: 248,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get all orders with pagination and filtering
   */
  async getAllOrders(page: number, size: number, status?: OrderStatus): Promise<PageResponse<Order>> {
    // Mock implementation - replace with database integration
    const mockOrders: Order[] = [
      {
        id: 1,
        orderId: 1,
        studentId: 1,
        paymentDate: new Date(),
        totalPrice: 248,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        orderId: 2,
        studentId: 2,
        paymentDate: new Date(),
        totalPrice: 99,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        orderId: 3,
        studentId: 3,
        paymentDate: new Date(),
        totalPrice: 149,
        status: OrderStatus.CANCELLED,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Filter by status if provided
    const filteredOrders = status ? mockOrders.filter(order => order.status === status) : mockOrders;

    const startIndex = page * size;
    const endIndex = startIndex + size;
    const content = filteredOrders.slice(startIndex, endIndex);

    return {
      content,
      totalElements: filteredOrders.length,
      totalPages: Math.ceil(filteredOrders.length / size),
      currentPage: page,
      size,
      hasNext: endIndex < filteredOrders.length,
      hasPrevious: page > 0,
      isFirst: page === 0,
      isLast: endIndex >= filteredOrders.length
    };
  }

  /**
   * Calculate order total
   */
  async calculateOrderTotal(studentId: number): Promise<number> {
    // Mock implementation - replace with database integration
    return 248; // Total from cart items
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: number): Promise<Order> {
    // Mock implementation - replace with database integration
    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED);
  }

  /**
   * Complete order after successful payment
   */
  async completeOrder(paymentParams: Record<string, string>): Promise<void> {
    try {
      // Extract and verify secure hash
      const vnp_SecureHash = paymentParams.vnp_SecureHash;
      delete paymentParams.vnp_SecureHash;

      if (!vnp_SecureHash) {
        throw new Error('vnp_SecureHash is required');
      }

      // Verify hash (import VNPayUtil and VNPayConfig if needed)
      // const hashData = VNPayUtil.getPaymentURL(new Map(Object.entries(paymentParams)), false);
      // const vnpSecureHash = VNPayUtil.hmacSHA512(vnPayConfig.getSecretKey(), hashData);
      // if (vnpSecureHash !== vnp_SecureHash) {
      //   throw new Error('vnp_SecureHash is invalid');
      // }

      const totalPrice = parseInt(paymentParams.vnp_Amount);
      const orderInfo = paymentParams.vnp_OrderInfo;
      
      console.error('Order info:', orderInfo);
      
      // Parse order info: format is "idUser##idCourse1#idCourse2#...#idDiscount"
      const infoOrder = orderInfo.split('##');
      const idUser = parseInt(infoOrder[0]);
      
      // Parse course IDs
      const coursesPart = infoOrder[1].split('#').filter(id => id);
      const idCourses = coursesPart.map(id => parseInt(id));
      
      // Copy cart to order (enroll student in courses)
      // TODO: Implement cartService.copyCartToOrder
      console.log('Enrolling user', idUser, 'in courses:', idCourses);
      console.log('Total price:', totalPrice / 100); // Convert from VND cents

      // Handle discount if present
      if (infoOrder.length === 3) {
        const idDiscount = parseInt(infoOrder[2]);
        console.error('Discount ID:', idDiscount);
        // TODO: Implement discountService.deleteDiscountFromStudent(idDiscount, idUser);
      }

      console.log(`Order completed successfully for user ${idUser}`);
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  }
}