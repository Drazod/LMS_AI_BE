import { Discount, DiscountType } from '../models/entities/Discount';
import { PageResponse } from '../models/response';

export class DiscountService {
  constructor() {}

  /**
   * Get all discounts with pagination and filtering
   */
  async getAllDiscounts(page: number, size: number, isActive?: boolean): Promise<PageResponse<Discount>> {
    // Mock implementation - replace with database integration
    const mockDiscounts: Discount[] = [
      {
        discountId: 1,
        code: 'WELCOME10',
        description: 'Welcome discount for new users',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minimumAmount: 50,
        maximumUses: 1000,
        currentUses: 250,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        applicableCourses: [],
        applicableCategories: [],
        userRestrictions: { newUsersOnly: true },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        discountId: 2,
        code: 'SUMMER25',
        description: 'Summer sale discount',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 25,
        minimumAmount: 100,
        maximumUses: 500,
        currentUses: 125,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        isActive: true,
        applicableCourses: [1, 2, 3],
        applicableCategories: [1],
        userRestrictions: {},
        createdAt: new Date('2024-05-15'),
        updatedAt: new Date('2024-05-15')
      },
      {
        discountId: 3,
        code: 'EXPIRED50',
        description: 'Expired discount',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 50,
        minimumAmount: 200,
        maximumUses: 100,
        currentUses: 100,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        isActive: false,
        applicableCourses: [],
        applicableCategories: [],
        userRestrictions: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-04-01')
      }
    ];

    // Apply filter
    let filteredDiscounts = mockDiscounts;
    if (isActive !== undefined) {
      filteredDiscounts = filteredDiscounts.filter(discount => discount.isActive === isActive);
    }

    const startIndex = page * size;
    const endIndex = startIndex + size;
    const content = filteredDiscounts.slice(startIndex, endIndex);

    return {
      content,
      totalElements: filteredDiscounts.length,
      totalPages: Math.ceil(filteredDiscounts.length / size),
      currentPage: page,
      size,
      hasNext: endIndex < filteredDiscounts.length,
      hasPrevious: page > 0,
      isFirst: page === 0,
      isLast: endIndex >= filteredDiscounts.length
    };
  }

  /**
   * Get discount by ID
   */
  async getDiscountById(discountId: number): Promise<Discount | null> {
    // Mock implementation - replace with database integration
    const discounts = await this.getAllDiscounts(0, 100);
    return discounts.content.find(discount => discount.discountId === discountId) || null;
  }

  /**
   * Create new discount
   */
  async createDiscount(discountData: Omit<Discount, 'discountId' | 'createdAt' | 'updatedAt' | 'currentUses'>): Promise<Discount> {
    // Mock implementation - replace with database integration
    const newDiscount: Discount = {
      discountId: Date.now(), // Mock ID generation
      code: discountData.code,
      description: discountData.description || '',
      discountType: discountData.discountType,
      discountValue: discountData.discountValue,
      minimumAmount: discountData.minimumAmount || 0,
      maximumUses: discountData.maximumUses || 0,
      currentUses: 0,
      startDate: discountData.startDate,
      endDate: discountData.endDate,
      isActive: discountData.isActive ?? true,
      applicableCourses: discountData.applicableCourses || [],
      applicableCategories: discountData.applicableCategories || [],
      userRestrictions: discountData.userRestrictions || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newDiscount;
  }

  /**
   * Update existing discount
   */
  async updateDiscount(discountId: number, discountData: Partial<Discount>): Promise<Discount> {
    // Mock implementation - replace with database integration
    const existingDiscount = await this.getDiscountById(discountId);
    
    if (!existingDiscount) {
      throw new Error('Discount not found');
    }

    return {
      ...existingDiscount,
      ...discountData,
      discountId,
      updatedAt: new Date()
    };
  }

  /**
   * Delete discount
   */
  async deleteDiscount(discountId: number): Promise<boolean> {
    // Mock implementation - replace with database integration
    const discount = await this.getDiscountById(discountId);
    return discount !== null;
  }

  /**
   * Apply discount code
   */
  async applyDiscount(code: string, userId?: number, courseId?: number, totalAmount?: number): Promise<any> {
    // Mock implementation - replace with database integration
    const discounts = await this.getAllDiscounts(0, 100);
    const discount = discounts.content.find(d => d.code === code);

    if (!discount) {
      return {
        isValid: false,
        message: 'Invalid discount code',
        discountAmount: 0,
        finalAmount: totalAmount || 0
      };
    }

    const validation = await this.validateDiscount(code, userId, courseId);
    
    if (!validation.isValid) {
      return {
        ...validation,
        discountAmount: 0,
        finalAmount: totalAmount || 0
      };
    }

    let discountAmount = 0;
    const amount = totalAmount || 0;

    if (discount.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (amount * (discount.discountValue || discount.value || 0)) / 100;
    } else if (discount.discountType === DiscountType.FIXED_AMOUNT) {
      discountAmount = Math.min(discount.discountValue || discount.value || 0, amount);
    }

    const finalAmount = Math.max(amount - discountAmount, 0);

    return {
      isValid: true,
      message: 'Discount applied successfully',
      discount,
      discountAmount,
      finalAmount,
      originalAmount: amount
    };
  }

  /**
   * Validate discount code
   */
  async validateDiscount(code: string, userId?: number, courseId?: number): Promise<any> {
    // Mock implementation - replace with database integration
    const discounts = await this.getAllDiscounts(0, 100);
    const discount = discounts.content.find(d => d.code === code);

    if (!discount) {
      return {
        isValid: false,
        message: 'Discount code not found'
      };
    }

    if (!discount.isActive) {
      return {
        isValid: false,
        message: 'Discount code is not active'
      };
    }

    const now = new Date();
    if ((discount.startDate || discount.validFrom) && (discount.startDate || discount.validFrom)! > now) {
      return {
        isValid: false,
        message: 'Discount code is not yet valid'
      };
    }

    if ((discount.endDate || discount.validUntil) && (discount.endDate || discount.validUntil)! < now) {
      return {
        isValid: false,
        message: 'Discount code has expired'
      };
    }

    if (discount.maximumUses && discount.maximumUses > 0 && (discount.currentUses || 0) >= discount.maximumUses) {
      return {
        isValid: false,
        message: 'Discount code usage limit reached'
      };
    }

    // Check course restrictions
    if (courseId && discount.applicableCourses && discount.applicableCourses.length > 0) {
      if (!discount.applicableCourses.includes(courseId)) {
        return {
          isValid: false,
          message: 'Discount code is not applicable to this course'
        };
      }
    }

    // Check user restrictions (simplified)
    if (userId && discount.userRestrictions) {
      if (discount.userRestrictions.newUsersOnly) {
        // In real implementation, check if user is new
        // For now, assume validation passes
      }
    }

    return {
      isValid: true,
      message: 'Discount code is valid',
      discount
    };
  }

  /**
   * Get discount usage statistics
   */
  async getDiscountStatistics(discountId: number): Promise<any> {
    // Mock implementation - replace with database integration
    const discount = await this.getDiscountById(discountId);
    
    if (!discount) {
      throw new Error('Discount not found');
    }

    return {
      discountId,
      code: discount.code,
      totalUses: discount.currentUses || 0,
      remainingUses: discount.maximumUses && discount.maximumUses > 0 ? discount.maximumUses - (discount.currentUses || 0) : 'Unlimited',
      totalDiscountGiven: (discount.currentUses || 0) * (discount.discountValue || discount.value || 0), // Simplified calculation
      usageByMonth: [
        { month: '2024-01', uses: 50, discountGiven: 250 },
        { month: '2024-02', uses: 75, discountGiven: 375 },
        { month: '2024-03', uses: 125, discountGiven: 625 }
      ],
      topCourses: [
        { courseId: 1, courseName: 'JavaScript Fundamentals', uses: 45 },
        { courseId: 2, courseName: 'React Advanced', uses: 32 }
      ]
    };
  }

  /**
   * Get active discounts for public display
   */
  async getActiveDiscounts(): Promise<Discount[]> {
    // Mock implementation - replace with database integration
    const allDiscounts = await this.getAllDiscounts(0, 100, true);
    const now = new Date();
    
    return allDiscounts.content.filter(discount => 
      discount.isActive && 
      (discount.startDate || discount.validFrom) && (discount.startDate || discount.validFrom)! <= now && 
      (discount.endDate || discount.validUntil) && (discount.endDate || discount.validUntil)! >= now &&
      (!discount.maximumUses || discount.maximumUses === 0 || (discount.currentUses || 0) < discount.maximumUses)
    );
  }

  /**
   * Get discount by code
   */
  async getDiscountByCode(code: string): Promise<Discount | null> {
    // Mock implementation - replace with database integration
    const discounts = await this.getAllDiscounts(0, 100);
    return discounts.content.find(discount => discount.code === code) || null;
  }

  /**
   * Increment discount usage
   */
  async incrementDiscountUsage(discountId: number): Promise<void> {
    // Mock implementation - replace with database integration
    const discount = await this.getDiscountById(discountId);
    if (discount) {
      discount.currentUses = (discount.currentUses || 0) + 1;
      discount.updatedAt = new Date();
    }
  }
}
