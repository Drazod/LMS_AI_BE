import { BaseEntity } from './BaseEntity';

// Discount System Entities
export interface Discount extends BaseEntity {
  discountId: number;  // Matches discount_id in CSV
  code: string;  // Matches code in CSV
  description?: string;  // Matches description in CSV (nullable)
  discountValue?: number;  // Matches discount_value in CSV (optional for compatibility)
  startDate?: Date;  // Matches start_date in CSV (optional for compatibility)
  endDate?: Date;  // Matches end_date in CSV (optional for compatibility)
  
  // Legacy fields for backward compatibility
  value?: number;  // Legacy field
  validFrom?: Date;  // Legacy field  
  validUntil?: Date;  // Legacy field
  
  // Additional fields for enhanced functionality
  discountType?: DiscountType;  // Optional type field
  minimumAmount?: number;
  maximumUses?: number;
  currentUses?: number;
  isActive?: boolean;
  applicableCourses?: number[];
  applicableCategories?: number[];
  userRestrictions?: any;
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT'
}

export interface StudentDiscount {
  studentId: number;
  discountId: number;
  usedAt: Date;
}

export interface StudentDiscountId {
  studentId: number;
  discountId: number;
}