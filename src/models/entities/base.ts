// Base entity interface with common audit fields
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt?: Date;
}

// Enums
export enum CourseStatus {
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED'
}

export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN'
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED'
}