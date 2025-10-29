import { Order, OrderStatus, OrderItem, PaymentInfo } from '../models/entities';
import { PageResponse, CheckoutResponse } from '../models/response';
import { CheckoutRequest, PurchaseOrderRequest } from '../models/request';
import { getRepository, getConnection } from 'typeorm';
import { CourseEntity } from '../models/entities/CourseEntity';
import { PaymentService, VNPayResponse } from './PaymentService';
import { Request } from 'express';
import { Logger } from '../utils/logger';
import { VNPayUtil } from '../utils/VNPayUtil';
import { VNPayConfigService } from '../config/VNPayConfig';

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
      
      Logger.info('Generated orderInfo:', orderInfo);

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

      // Verify hash
      const vnPayConfigService = new VNPayConfigService();
      
      const hashData = VNPayUtil.getPaymentURL(new Map(Object.entries(paymentParams)), false);
      const vnpSecureHash = VNPayUtil.hmacSHA512(vnPayConfigService.getSecretKey(), hashData);
      
      if (vnpSecureHash !== vnp_SecureHash) {
        throw new Error('vnp_SecureHash is invalid');
      }

      const totalPrice = parseInt(paymentParams.vnp_Amount);
      const orderInfo = paymentParams.vnp_OrderInfo;
      
      Logger.info('Order info:', orderInfo);
      
      // Parse order info: format is "idUser##idCourse1#idCourse2#...##idDiscount"
      const infoOrder = orderInfo.split('##');
      const idUser = parseInt(infoOrder[0]);
      
      // Parse course IDs
      const coursesPart = infoOrder[1].split('#').filter(id => id);
      const idCourses = coursesPart.map(id => parseInt(id));
      
      Logger.info('Enrolling user', idUser, 'in courses:', idCourses);
      Logger.info('Total price:', totalPrice / 100); // Convert from VND cents to VND

      // Copy cart to order (create order record and enroll student in courses)
      await this.copyCartToOrder(idUser, idCourses, totalPrice / 100);

      // Handle discount if present
      if (infoOrder.length === 3 && infoOrder[2]) {
        const idDiscount = parseInt(infoOrder[2]);
        Logger.info('Deleting discount ID:', idDiscount);
        await this.deleteDiscountFromStudent(idDiscount, idUser);
      }

      Logger.info(`Order completed successfully for user ${idUser}`);
    } catch (error) {
      Logger.error('Error completing order:', error);
      throw error;
    }
  }

  /**
   * Copy cart to order - creates order record, order items, and enrolls student in courses
   */
  private async copyCartToOrder(studentId: number, courseIds: number[], totalPrice: number): Promise<void> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get cart
      const cartResult = await queryRunner.query(
        'SELECT cart_id FROM carts WHERE student_id = $1',
        [studentId]
      );

      if (!cartResult || cartResult.length === 0) {
        throw new Error('Cart not found');
      }

      const cartId = cartResult[0].cart_id;

      // Get cart items
      const cartItems = await queryRunner.query(
        'SELECT * FROM cart_items WHERE cart_id = $1',
        [cartId]
      );

      Logger.info(`Found ${cartItems.length} items in cart ${cartId}`);
      if (cartItems.length > 0) {
        Logger.info('Cart items:', cartItems.map((item: any) => ({ cart_id: item.cart_id, course_id: item.course_id })));
      }

      if (cartItems.length === 0) {
        throw new Error('No items in the cart');
      }

      // Create order
      const orderResult = await queryRunner.query(
        `INSERT INTO orders (student_id, payment_date, total_price)
         VALUES ($1, NOW(), $2)
         RETURNING order_id`,
        [studentId, totalPrice]
      );

      const orderId = orderResult[0].order_id;
      Logger.info(`Created order ${orderId} for student ${studentId}`);

      // Process each cart item
      const cartItemsToDelete: number[] = [];

      Logger.info(`Processing ${cartItems.length} cart items for purchase list:`, courseIds);

      for (const cartItem of cartItems) {
        const courseId = cartItem.course_id;
        Logger.info(`Checking cart item with course_id: ${courseId}`);

        // Only process if course is in the purchase list
        if (courseIds.includes(courseId)) {
          Logger.info(`Course ${courseId} is in purchase list, processing...`);
          
          // Check if student is already enrolled
          const existingEnrollment = await queryRunner.query(
            'SELECT enrollment_id FROM enrollments WHERE student_id = $1 AND course_id = $2',
            [studentId, courseId]
          );

          Logger.info(`Existing enrollment check for course ${courseId}:`, existingEnrollment.length > 0 ? 'Already enrolled' : 'Not enrolled');

          if (existingEnrollment.length === 0) {
            // Get course price
            const courseResult = await queryRunner.query(
              'SELECT price FROM course WHERE course_id = $1',
              [courseId]
            );

            if (courseResult.length === 0) {
              Logger.warn(`Course ${courseId} not found, skipping`);
              continue;
            }

            const coursePrice = courseResult[0].price;

            // Create order item
            await queryRunner.query(
              `INSERT INTO order_items (order_id, course_id, price)
               VALUES ($1, $2, $3)`,
              [orderId, courseId, coursePrice]
            );

            // Enroll student in course
            Logger.info(`Creating enrollment for student ${studentId} in course ${courseId}`);
            await queryRunner.query(
              `INSERT INTO enrollments (student_id, course_id, enrollment_date, is_complete, current_section_position)
               VALUES ($1, $2, NOW(), false, 1)`,
              [studentId, courseId]
            );

            Logger.info(`✅ Successfully enrolled student ${studentId} in course ${courseId}`);
            cartItemsToDelete.push(courseId);
          } else {
            Logger.warn(`Student ${studentId} already enrolled in course ${courseId}`);
          }
        } else {
          Logger.warn(`Course ${courseId} NOT in purchase list ${JSON.stringify(courseIds)}, skipping`);
        }
      }

      // Delete cart items for purchased courses
      if (cartItemsToDelete.length > 0) {
        await queryRunner.query(
          `DELETE FROM cart_items 
           WHERE cart_id = $1 AND course_id = ANY($2::int[])`,
          [cartId, cartItemsToDelete]
        );
        Logger.info(`Removed ${cartItemsToDelete.length} items from cart`);
      }

      await queryRunner.commitTransaction();
      Logger.info('Order transaction completed successfully');

    } catch (error) {
      await queryRunner.rollbackTransaction();
      Logger.error('Error copying cart to order, rolling back:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete discount from student after use
   */
  private async deleteDiscountFromStudent(discountId: number, studentId: number): Promise<void> {
    try {
      const connection = getConnection();
      
      // Delete from student_discount junction table
      await connection.query(
        'DELETE FROM student_discount WHERE student_id = $1 AND discount_id = $2',
        [studentId, discountId]
      );

      Logger.info(`Deleted discount ${discountId} from student ${studentId}`);
    } catch (error) {
      Logger.error('Error deleting discount from student:', error);
      // Don't throw - this is not critical to order completion
    }
  }
}