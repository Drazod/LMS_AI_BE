// Authentication Request DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Course Request DTOs
export interface CourseCreateRequest {
  title: string;
  description?: string;
  price: number;
  instructorId: number;
  categoryId?: number; // Optional: use existing category by ID
  categoryName?: string; // Optional: create new category or find existing by name
  categoryDescription?: string; // Optional: description for new category
  courseThumbnail?: string; // File upload will be handled separately
}

export interface CourseUpdateRequest {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  courseThumbnail?: string;
}

export interface CourseStatusRequest {
  status: 'CREATED' | 'APPROVED' | 'PENDING' | 'ARCHIVED';
}

// Section Request DTOs
export interface SectionCreateRequest {
  title: string;
  description?: string;
  orderIndex: number;
  courseId: number;
}

export interface SectionUpdateRequest {
  title?: string;
  description?: string;
  orderIndex?: number;
}

// Content Request DTOs
export interface ContentCreateRequest {
  title: string;
  description?: string;
  contentType: 'VIDEO' | 'AUDIO' | 'TEXT' | 'DOCUMENT' | 'QUIZ';
  contentUrl?: string;
  duration?: number;
  orderIndex: number;
  sectionId: number;
}

export interface ContentUpdateRequest {
  title?: string;
  description?: string;
  contentType?: 'VIDEO' | 'AUDIO' | 'TEXT' | 'DOCUMENT' | 'QUIZ';
  contentUrl?: string;
  duration?: number;
  orderIndex?: number;
}

// Speech-to-Text Request DTOs
export interface SpeechToTextRequest {
  generateQuestions?: boolean;
  numQuestions?: number;
}

// File Upload Request DTOs
export interface FileUploadRequest {
  file: Express.Multer.File;
  type: 'image' | 'video' | 'audio' | 'document';
}

// User Update Request DTOs
export interface UserUpdateRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userAddress?: string;
  userCity?: string;
  userCountry?: string;
  avtUrl?: string;
}

export interface InstructorCreateRequest extends RegisterRequest {
  bio?: string;
  experience?: string;
}

// Student Request DTOs
export interface StudentRequest extends RegisterRequest {
  // Additional student-specific fields can be added here
}

// User Address Request DTOs
export interface UserAddressRequest {
  userAddress?: string;
  userCity?: string;
  userCountry?: string;
  phoneNumber?: string;
}

// Section Completion Request DTOs
export interface SectionCompleteRequest {
  studentId: number;
  sectionId: number;
  courseId: number;
  completedAt?: Date;
  progress?: number; // 0-100
}

// Instructor Request DTOs
export interface InstructorRequest extends RegisterRequest {
  bio?: string;
  experience?: string;
}

export interface InstructorUpdateRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userAddress?: string;
  userCity?: string;
  userCountry?: string;
  bio?: string;
  experience?: string;
  avtUrl?: string;
}

// Enrollment Request DTOs  
export interface EnrollmentCreateRequest {
  courseId: number;
  studentId: number;
}