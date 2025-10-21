import { BaseEntity } from './BaseEntity';

export interface Category extends BaseEntity {
  categoryId: number;  // Matches category_id in CSV
  name: string;  // Matches category_name in CSV (simplified from categoryName to name)
  description?: string;  // Optional field for future use
  imageUrl?: string;  // Optional field for category images
  parentCategoryId?: number;  // For hierarchical categories
  isActive?: boolean;  // Optional field for category status
  courseCount?: number;  // Calculated field for number of courses
}