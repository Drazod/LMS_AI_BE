import { User, Course, Enrollment } from '../entities';

// Base Response DTOs
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | Record<string, string> | Record<string, any>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Response DTOs
export interface LoginResponse {
  success: true;
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface UserResponse {
  userId: number;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userAddress?: string;
  userCity?: string;
  userCountry?: string;
  userPostalCode?: number;
  avtUrl?: string;
  role: string;
  activated: boolean;
}

// Course Response DTOs
export interface CourseResponse {
  courseId: number;
  title: string;
  description?: string;
  price: number;
  courseThumbnail?: string;
  avgRating?: number;
  totalRating?: number;
  status: string;
  createdAt: Date;
  categoryId?: number;
  instructorId?: number;
  instructor?: {
    userId: number;
    name: string;
    avtUrl?: string;
  };
  category?: {
    categoryId: number;
    name: string;
  };
  sectionsCount?: number;
  enrollmentsCount?: number;
}

export interface CourseDetailResponse extends CourseResponse {
  sections: SectionResponse[];
  enrollments?: EnrollmentResponse[];
}

export interface SectionResponse {
  sectionId: number;
  title: string;
  description?: string;
  orderIndex: number;
  contents: ContentResponse[];
}

export interface ContentResponse {
  contentId: number;
  title: string;
  description?: string;
  contentType: string;
  contentUrl?: string;
  duration?: number;
  orderIndex: number;
}

// New Section Response DTO based on actual database schema
export interface SectionDetailResponse {
  sectionId: number;
  sectionName: string;
  description?: string;
  position: number;
  sessionType?: 'LISTEN' | 'READING' | 'SPEAKING';
  title?: string;
  courseId?: number;
  contents?: ContentDetailResponse[];
}

// New Content Response DTO based on actual database schema
export interface ContentDetailResponse {
  id: number;
  content?: string;
  position: number;
  type: 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'IMAGE' | 'TEXT';
  sectionId?: number;
}

// Speech-to-Text Response DTOs
export interface SpeechToTextResponse {
  success: boolean;
  transcribedText?: string;
  summary?: string;
  wordCount?: number;
  questions?: QuestionResponse[];
  metadata?: {
    filePath: string;
    fileSize: number;
    fileType: string;
    durationSeconds: number;
    processedAt: string;
  };
  error?: string;
  suggestion?: string;
  message?: string;
}

export interface QuestionResponse {
  question: string;
  type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'short_answer';
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  correctAnswer: string;
  options?: string[];
  context: string;
  explanation: string;
}

// Enrollment Response DTOs
export interface EnrollmentResponse {
  enrollmentId: number;
  enrollmentDate: Date;
  completionDate?: Date;
  progress: number;
  status: string;
  student: UserResponse;
  course: CourseResponse;
}

// Category Response DTOs
export interface CategoryResponse {
  categoryId: number;
  name: string;
  description?: string;
  coursesCount?: number;
}

// File Upload Response DTOs
export interface FileUploadResponse {
  success: boolean;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// Student Response DTOs
export interface StudentResponse extends UserResponse {
  enrollmentCount?: number;
  completedCourses?: CourseResponse[];
  currentCourses?: EnrollmentResponse[];
}

export interface StudentStatisticResponse {
  studentId: number;
  totalEnrollments: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHoursLearned: number;
  averageProgress: number;
  certificatesEarned: number;
  currentStreak: number;
  longestStreak: number;
}

// Address Response DTOs  
export interface UserAddressResponse {
  userId: number;
  userAddress?: string;
  userCity?: string; 
  userCountry?: string;
  phoneNumber?: string;
  updatedAt: Date;
}

// Section Completion Response DTOs
export interface SectionCompleteResponse {
  sectionId: number;
  studentId: number;
  courseId: number;
  sectionTitle: string;
  completedAt: Date;
  progress: number;
  nextSectionId?: number;
  isLastSection: boolean;
}

// Metadata for Pagination
export interface MetadataResponse {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  next?: string | null;
  previous?: string | null;
  last?: string;
  first?: string;
}

// Page Response for Pagination
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
}

// Instructor Response DTOs
export interface InstructorResponse extends UserResponse {
  bio?: string;
  experience?: string;
  coursesCount?: number;
  totalStudents?: number;
  totalEarnings?: number;
}

// Course Detail Response DTOs (additional)
export interface CourseDetailResponse2 extends CourseResponse {
  totalEnrollments: number;
  totalRevenue: number;
  sections: SectionResponse[];
}

// Error Response DTOs
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode: number;
  timestamp: string;
  path: string;
}