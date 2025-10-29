import { PaymentInfo, PaymentMethod, PaymentStatus } from '../models/entities';
import { VNPayConfigService } from '../config/VNPayConfig';
import { VNPayUtil } from '../utils/VNPayUtil';
import { Request } from 'express';

export interface PaymentData {
  totalPrice: number;
  currency: string;
  paymentMethod: PaymentMethod;
  cardToken?: string;
  paypalToken?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentId?: number;
  message: string;
  paymentInfo?: PaymentInfo;
}

export interface VNPayResponse {
  code: string;
  message: string;
  paymentUrl: string;
}

export class PaymentService {
  private vnPayConfig: VNPayConfigService;

  constructor() {
    this.vnPayConfig = new VNPayConfigService();
  }

  /**
   * Create VNPay payment
   */
  createVnPayPayment(request: Request, amount: number, orderInfo: string): VNPayResponse {
    const vnpParamsMap = this.vnPayConfig.getVNPayConfig();
    
    // Convert amount to VND cents (multiply by 100)
    vnpParamsMap.set('vnp_Amount', String(amount * 100));
    vnpParamsMap.set('vnp_OrderInfo', orderInfo);
    vnpParamsMap.set('vnp_IpAddr', VNPayUtil.getIpAddress(request));

    // Build payment URL
    const queryUrl = VNPayUtil.getPaymentURL(vnpParamsMap, true);
    const hashData = VNPayUtil.getPaymentURL(vnpParamsMap, false);
    const vnpSecureHash = VNPayUtil.hmacSHA512(this.vnPayConfig.getSecretKey(), hashData);
    
    const paymentUrl = `${this.vnPayConfig.getVnpPayUrl()}?${queryUrl}&vnp_SecureHash=${vnpSecureHash}`;

    return {
      code: 'ok',
      message: 'success',
      paymentUrl
    };
  }

  /**
   * Process payment for order
   */
  async processPayment(orderId: number, paymentData: PaymentData): Promise<PaymentResult> {
    try {
      // Mock implementation - replace with actual payment gateway integration
      console.log(`Processing payment for order ${orderId}:`, paymentData);

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful payment
      const transactionId = `txn_${Date.now()}`;
      const paymentId = Date.now();

      const paymentInfo: PaymentInfo = {
        id: paymentId,
        paymentId,
        orderId,
        paymentMethod: paymentData.paymentMethod,
        totalPrice: paymentData.totalPrice,
        cartId: 0, // Default value - should be passed from context
        studentId: 0, // Default value - should be passed from context
        currency: paymentData.currency,
        transactionId,
        paymentStatus: PaymentStatus.COMPLETED,
        paymentDate: new Date(),
        paymentGateway: this.getPaymentGateway(paymentData.paymentMethod),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        success: true,
        transactionId,
        paymentId,
        message: 'Payment processed successfully',
        paymentInfo
      };

    } catch (error: any) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        message: `Payment failed: ${error.message}`
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: number, amount?: number): Promise<PaymentResult> {
    try {
      // Mock implementation - replace with actual refund processing
      const refundId = `refund_${Date.now()}`;

      return {
        success: true,
        transactionId: refundId,
        message: 'Refund processed successfully'
      };

    } catch (error: any) {
      console.error('Refund processing error:', error);
      return {
        success: false,
        message: `Refund failed: ${error.message}`
      };
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: number): Promise<PaymentInfo | null> {
    // Mock implementation - replace with database integration
    return {
      id: paymentId,
      paymentId,
      orderId: 1,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      totalPrice: 248,
      cartId: 1, // Mock data
      studentId: 1, // Mock data
      currency: 'USD',
      transactionId: `txn_${paymentId}`,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentDate: new Date(),
      paymentGateway: 'stripe',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get payments by order ID
   */
  async getPaymentsByOrderId(orderId: number): Promise<PaymentInfo[]> {
    // Mock implementation - replace with database integration
    return [
      {
        id: 1,
        paymentId: 1,
        orderId,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        totalPrice: 248,
        cartId: 1, // Mock data
        studentId: 1, // Mock data
        currency: 'USD',
        transactionId: `txn_${orderId}`,
        paymentStatus: PaymentStatus.COMPLETED,
        paymentDate: new Date(),
        paymentGateway: 'stripe',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Validate payment data
   */
  private validatePaymentData(paymentData: PaymentData): boolean {
    if (!paymentData.totalPrice || paymentData.totalPrice <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!paymentData.currency) {
      throw new Error('Currency is required');
    }

    if (!paymentData.paymentMethod) {
      throw new Error('Payment method is required');
    }

    return true;
  }

  /**
   * Get payment gateway name based on payment method
   */
  private getPaymentGateway(paymentMethod: PaymentMethod): string {
    switch (paymentMethod) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return 'stripe';
      case PaymentMethod.PAYPAL:
        return 'paypal';
      case PaymentMethod.BANK_TRANSFER:
        return 'bank';
      case PaymentMethod.WALLET:
        return 'wallet';
      default:
        return 'unknown';
    }
  }

  /**
   * Create webhook handler for payment status updates
   */
  async handlePaymentWebhook(webhookData: any): Promise<void> {
    try {
      // Mock implementation - replace with actual webhook handling
      console.log('Processing payment webhook:', webhookData);
      
      // Process webhook data and update payment status accordingly
      // This would typically involve:
      // 1. Verify webhook signature
      // 2. Extract payment information
      // 3. Update payment status in database
      // 4. Trigger order completion if payment successful
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Get user's payment history with pagination
   */
  async getUserPayments(userId: number, page: number, size: number): Promise<any> {
    // Mock implementation - replace with database integration
    const mockPayments = [
      {
        paymentId: 1,
        orderId: 101,
        totalPrice: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentStatus: PaymentStatus.COMPLETED,
        paymentDate: new Date('2024-01-15'),
        transactionId: 'txn_123456789'
      },
      {
        paymentId: 2,
        orderId: 102,
        totalPrice: 149.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.PAYPAL,
        paymentStatus: PaymentStatus.COMPLETED,
        paymentDate: new Date('2024-02-10'),
        transactionId: 'txn_987654321'
      }
    ];

    const startIndex = page * size;
    const endIndex = startIndex + size;
    const content = mockPayments.slice(startIndex, endIndex);

    return {
      content,
      totalElements: mockPayments.length,
      totalPages: Math.ceil(mockPayments.length / size),
      currentPage: page,
      size,
      hasNext: endIndex < mockPayments.length,
      hasPrevious: page > 0,
      isFirst: page === 0,
      isLast: endIndex >= mockPayments.length
    };
  }

  /**
   * Get payment methods for user
   */
  async getPaymentMethods(userId: number): Promise<any[]> {
    // Mock implementation - replace with database integration
    return [
      {
        id: 1,
        type: 'credit_card',
        last4: '1234',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      },
      {
        id: 2,
        type: 'paypal',
        email: 'user@example.com',
        isDefault: false
      }
    ];
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(intentData: any): Promise<any> {
    // Mock implementation - replace with actual payment provider
    return {
      intentId: `pi_${Date.now()}`,
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      totalPrice: intentData.amount,
      currency: intentData.currency,
      status: 'requires_payment_method',
      orderId: intentData.orderId,
      createdAt: new Date()
    };
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(intentId: string, paymentData?: any): Promise<any> {
    // Mock implementation - replace with actual payment provider
    return {
      intentId,
      status: 'succeeded',
      paymentMethod: paymentData?.paymentMethod || 'card',
      confirmedAt: new Date(),
      transactionId: `txn_${Date.now()}`
    };
  }

  /**
   * Handle webhook from payment provider
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    // Mock implementation - replace with actual webhook verification
    console.log('Processing webhook with signature:', signature);
    console.log('Webhook payload:', payload);
    
    // Verify signature and process webhook event
    // Update payment status, complete orders, etc.
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(startDate?: string, endDate?: string): Promise<any> {
    // Mock implementation - replace with database aggregation
    return {
      period: { startDate, endDate },
      totalRevenue: 125000,
      totalTransactions: 1250,
      averageTransactionValue: 100,
      paymentMethodBreakdown: {
        credit_card: 750,
        paypal: 350,
        bank_transfer: 150
      },
      statusBreakdown: {
        completed: 1200,
        pending: 30,
        failed: 20
      },
      monthlyRevenue: [
        { month: '2024-01', revenue: 35000, transactions: 350 },
        { month: '2024-02', revenue: 42000, transactions: 420 },
        { month: '2024-03', revenue: 48000, transactions: 480 }
      ]
    };
  }
}
