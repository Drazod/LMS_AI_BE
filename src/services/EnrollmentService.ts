import { getRepository } from 'typeorm';
import { EnrollmentEntity } from '../models/entities/EnrollmentEntity';
import { UserEntity } from '../models/entities/UserEntity';
import { CourseEntity } from '../models/entities/CourseEntity';
import { Logger } from '../utils/logger';

export class EnrollmentService {
  /**
   * Add a student to a course (create enrollment)
   */
  async addStudentToCourse(studentId: number, courseId: number): Promise<EnrollmentEntity> {
    try {
      const enrollmentRepo = getRepository(EnrollmentEntity);
      const userRepo = getRepository(UserEntity);
      const courseRepo = getRepository(CourseEntity);

      // Check if student exists
      const student = await userRepo.findOne({ where: { userId: studentId } });
      if (!student) {
        throw new Error(`Student not found with ID: ${studentId}`);
      }

      // Check if course exists
      const course = await courseRepo.findOne({ where: { courseId } });
      if (!course) {
        throw new Error(`Course not found with ID: ${courseId}`);
      }

      // Check if enrollment already exists
      const existingEnrollment = await enrollmentRepo.findOne({
        where: {
          studentId,
          courseId
        }
      });

      if (existingEnrollment) {
        Logger.warn(`Student ${studentId} is already enrolled in course ${courseId}`);
        return existingEnrollment;
      }

      // Create new enrollment
      const enrollment = enrollmentRepo.create({
        studentId,
        courseId,
        enrollmentDate: new Date(),
        isComplete: false,
        currentSectionPosition: 1
      });

      const savedEnrollment = await enrollmentRepo.save(enrollment);
      Logger.info(`Student ${studentId} enrolled in course ${courseId} successfully`);

      return savedEnrollment;
    } catch (error) {
      Logger.error(`Error enrolling student ${studentId} in course ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * Add a student to multiple courses
   */
  async addStudentToCourses(studentId: number, courseIds: number[]): Promise<EnrollmentEntity[]> {
    const enrollments: EnrollmentEntity[] = [];

    for (const courseId of courseIds) {
      try {
        const enrollment = await this.addStudentToCourse(studentId, courseId);
        enrollments.push(enrollment);
      } catch (error) {
        Logger.error(`Failed to enroll student ${studentId} in course ${courseId}:`, error);
        // Continue with other courses
      }
    }

    return enrollments;
  }

  /**
   * Get student enrollments
   */
  async getStudentEnrollments(studentId: number): Promise<EnrollmentEntity[]> {
    const enrollmentRepo = getRepository(EnrollmentEntity);
    
    return await enrollmentRepo.find({
      where: { studentId },
      relations: ['course']
    });
  }

  /**
   * Get course enrollments
   */
  async getCourseEnrollments(courseId: number): Promise<EnrollmentEntity[]> {
    const enrollmentRepo = getRepository(EnrollmentEntity);
    
    return await enrollmentRepo.find({
      where: { courseId },
      relations: ['student']
    });
  }

  /**
   * Check if student is enrolled in course
   */
  async isStudentEnrolled(studentId: number, courseId: number): Promise<boolean> {
    const enrollmentRepo = getRepository(EnrollmentEntity);
    
    const enrollment = await enrollmentRepo.findOne({
      where: {
        studentId,
        courseId
      }
    });

    return !!enrollment;
  }

  /**
   * Update enrollment completion status
   */
  async updateEnrollmentCompletion(
    studentId: number, 
    courseId: number, 
    isComplete: boolean
  ): Promise<EnrollmentEntity> {
    const enrollmentRepo = getRepository(EnrollmentEntity);
    
    const enrollment = await enrollmentRepo.findOne({
      where: {
        studentId,
        courseId
      }
    });

    if (!enrollment) {
      throw new Error(`Enrollment not found for student ${studentId} and course ${courseId}`);
    }

    enrollment.isComplete = isComplete;
    if (isComplete) {
      enrollment.completionDate = new Date();
    }

    return await enrollmentRepo.save(enrollment);
  }

  /**
   * Update current section position
   */
  async updateSectionPosition(
    studentId: number, 
    courseId: number, 
    sectionPosition: number
  ): Promise<EnrollmentEntity> {
    const enrollmentRepo = getRepository(EnrollmentEntity);
    
    const enrollment = await enrollmentRepo.findOne({
      where: {
        studentId,
        courseId
      }
    });

    if (!enrollment) {
      throw new Error(`Enrollment not found for student ${studentId} and course ${courseId}`);
    }

    enrollment.currentSectionPosition = sectionPosition;

    return await enrollmentRepo.save(enrollment);
  }
}

export default new EnrollmentService();
