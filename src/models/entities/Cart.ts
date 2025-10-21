import { BaseEntity } from './base';
import { Student } from './User';
import { Course } from './Course';

// Cart System Entities
export interface Cart extends BaseEntity {
  cartId: number;
  studentId: number;
  student?: Student;
  cartItems?: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  cartId: number;  // Matches cart_id in CSV
  courseId: number;  // Matches course_id in CSV
  cart?: Cart;  // Optional relation
  course?: Course;  // Optional relation
  addedAt?: Date;  // Optional field for when item was added
}

export interface CartItemId {
  cartId: number;
  courseId: number;
}