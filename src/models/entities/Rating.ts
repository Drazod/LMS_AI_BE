import { BaseEntity } from './BaseEntity';

// Rating System Entities
export interface Rating extends BaseEntity {
  ratingId: number;  // Matches rating_id in CSV
  rating: number;  // Matches rating in CSV (1-5 stars)
  comment?: string;  // Matches comment in CSV (nullable)
  ratingDate?: Date;  // Matches rating_date in CSV (optional for backward compatibility)
  courseId: number;  // Matches course_id in CSV
  studentId: number;  // Matches student_id in CSV (changed from userId for clarity)
  
  // Legacy/additional fields for compatibility
  isVisible?: boolean;  // Optional field for moderation
  helpfulVotes?: number;  // Optional field for community features
}