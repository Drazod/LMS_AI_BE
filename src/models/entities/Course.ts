import { BaseEntity, CourseStatus, EnrollmentStatus } from './base';
import { User } from './User';

export interface Course extends BaseEntity {
  courseId: number;
  courseThumbnail: string;
  title: string;
  description?: string;
  price: number;
  createdAt: Date;
  avgRating?: number;
  totalRating?: number;
  status: CourseStatus;
  
  // Relations
  instructorId: number;
  instructor?: User;
  categoryId: number;
  category?: Category;
  enrollments?: Enrollment[];
  sections?: Section[];
}

export interface Category extends BaseEntity {
  categoryId: number;
  name: string;
  description?: string;
  courses?: Course[];
}

export interface Section extends BaseEntity {
  sectionId: number;  // Matches section_id in CSV
  sectionName?: string;  // Matches section_name in CSV
  title?: string;  // Matches title in CSV
  description?: string;  // Matches description in CSV
  position: number;  // Matches position in CSV (changed from orderIndex)
  sessionType?: string;  // Matches session_type in CSV (LISTEN, READING, etc.)
  courseId: number;  // Matches course_id in CSV
  course?: Course;
  contents?: Content[];
}

export interface Content extends BaseEntity {
  id: number;  // Matches id in CSV (changed from contentId)
  content?: string;  // Matches content in CSV (can be URL or text content)
  position: number;  // Matches position in CSV (changed from orderIndex)
  type: ContentType;  // Matches type in CSV (changed from contentType)
  sectionId: number;  // Matches section_id in CSV
  section?: Section;
  // Legacy fields kept for compatibility
  title?: string;  // Optional for backward compatibility
  description?: string;  // Optional for backward compatibility
  duration?: number;  // Optional for video/audio content
}

export interface Enrollment extends BaseEntity {
  enrollmentId: number;  // Matches enrollment_id in CSV
  enrollmentDate: Date;  // Matches enrollment_date in CSV
  completionDate?: Date;  // Matches completion_date in CSV (nullable)
  currentSectionPosition?: number;  // Matches current_section_position in CSV
  isComplete: boolean;  // Matches is_complete in CSV (changed from status)
  
  // Relations
  studentId: number;  // Matches student_id in CSV
  student?: User;
  courseId: number;  // Matches course_id in CSV
  course?: Course;
  
  // Legacy fields for compatibility
  progress?: number;  // Optional calculated field
  status?: EnrollmentStatus;  // Optional derived from isComplete
}

// Enums for this module
export enum ContentType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  DOCUMENT = 'DOCUMENT',
  QUIZ = 'QUIZ'
}