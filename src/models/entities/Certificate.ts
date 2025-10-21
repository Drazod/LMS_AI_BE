import { BaseEntity } from './BaseEntity';

export interface Certificate extends BaseEntity {
  certificateId: number;
  userId: number;
  courseId: number;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  verificationCode: string;
  templateId: number;
  isValid: boolean;
  completionPercentage: number;
  grade?: string;
}