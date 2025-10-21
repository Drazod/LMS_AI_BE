import { BaseEntity } from './base';
import { Student } from './User';
import { Course } from './Course';

// Order System Entities
export interface Order extends BaseEntity {
  orderId: number;
  studentId: number;
  student?: Student;
  paymentDate: Date;
  totalPrice: number;
  orderItems?: OrderItem[];
  paymentInfo?: PaymentInfo;
  status: OrderStatus;
}

export interface OrderItem {
  orderId: number;  // Matches order_id in CSV
  courseId: number;  // Matches course_id in CSV
  price: number;  // Matches price in CSV
  order?: Order;  // Optional relation
  course?: Course;  // Optional relation
  purchasedAt?: Date;  // Optional timestamp field
}

export interface OrderItemId {
  orderId: number;
  courseId: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Payment System Entities
export interface PaymentInfo extends BaseEntity {
  paymentId: number;  // Matches payment_id in CSV
  paymentMethod: string;  // Matches payment_method in CSV (simplified from enum)
  totalPrice?: number;  // Matches total_price in CSV (optional for compatibility)
  cartId?: number;  // Matches cart_id in CSV (optional for compatibility)
  studentId?: number;  // Matches student_id in CSV (optional for compatibility)
  
  // Legacy fields for backward compatibility
  amount?: number;  // Legacy field
  
  // Additional fields for enhanced functionality
  orderId?: number;  // Optional relation to order
  order?: Order;
  currency?: string;
  transactionId?: string;
  paymentStatus?: PaymentStatus;
  paymentDate?: Date;
  paymentGateway?: string;
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}