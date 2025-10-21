import { getConnection } from 'typeorm';
import { 
  StudentResponse,
  EnrollmentResponse,
  CourseResponse,
  StudentStatisticResponse,
  UserAddressResponse,
  SectionCompleteResponse,
  PageResponse
} from '../models/response';
import {
  StudentRequest,
  UserAddressRequest,
  SectionCompleteRequest
} from '../models/request';
import { User, Enrollment, Course } from '../models/entities';

export class StudentService {
  constructor() {}

  /**
   * Find all students with pagination
   */
  async findAll(page: number, size: number): Promise<PageResponse<StudentResponse>> {
    try {
      const connection = getConnection();
      const offset = page * size;

      // Get total count
      const countResult = await connection.query(
        `SELECT COUNT(*) as total FROM users WHERE user_role = 'S'`
      );
      const totalElements = parseInt(countResult[0].total);

      // Get paginated students with enrollment count
      const result = await connection.query(
        `SELECT u.*, 
                COALESCE(e.enrollment_count, 0) as enrollment_count
         FROM users u
         LEFT JOIN (
           SELECT student_id, COUNT(*) as enrollment_count
           FROM enrollments 
           GROUP BY student_id
         ) e ON u.user_id = e.student_id
         WHERE u.user_role = 'S'
         ORDER BY u.user_id
         LIMIT $1 OFFSET $2`,
        [size, offset]
      );

      const students = result.map((row: any) => this.mapRowToStudentResponse(row));

      const totalPages = Math.ceil(totalElements / size);

      return {
        content: students,
        totalElements,
        totalPages,
        currentPage: page,
        size,
        hasNext: page < totalPages - 1,
        hasPrevious: page > 0,
        isFirst: page === 0,
        isLast: page >= totalPages - 1
      };
    } catch (error) {
      console.error('Error finding all students:', error);
      throw new Error('Failed to retrieve students');
    }
  }

  /**
   * Find student by ID
   */
  async findById(studentId: number): Promise<StudentResponse | null> {
    try {
      const connection = getConnection();
      
      // Get student with enrollment count
      const result = await connection.query(
        `SELECT u.*, 
                COALESCE(e.enrollment_count, 0) as enrollment_count
         FROM users u
         LEFT JOIN (
           SELECT student_id, COUNT(*) as enrollment_count
           FROM enrollments 
           GROUP BY student_id
         ) e ON u.user_id = e.student_id
         WHERE u.user_id = $1 AND u.user_role = 'S'
         LIMIT 1`,
        [studentId]
      );

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToStudentResponse(result[0]);
    } catch (error) {
      console.error('Error finding student by ID:', error);
      return null;
    }
  }

  /**
   * Create new student
   */
  async createStudent(studentRequest: StudentRequest): Promise<StudentResponse> {
    try {
      const connection = getConnection();
      
      const result = await connection.query(
        `INSERT INTO users (name, email, password, first_name, last_name, phone_number, user_role, activated)
         VALUES ($1, $2, $3, $4, $5, $6, 'S', true)
         RETURNING *`,
        [
          studentRequest.name,
          studentRequest.email, 
          studentRequest.password || 'defaultPassword', // Should hash this in production
          studentRequest.firstName,
          studentRequest.lastName,
          studentRequest.phoneNumber
        ]
      );

      if (result.length === 0) {
        throw new Error('Failed to create student');
      }

      // Add enrollment count of 0 for new student
      const studentData = { ...result[0], enrollment_count: 0 };
      return this.mapRowToStudentResponse(studentData);
    } catch (error) {
      console.error('Error creating student:', error);
      throw new Error('Failed to create student');
    }
  }

  /**
   * Update student
   */
  async updateStudent(studentId: number, studentRequest: StudentRequest): Promise<StudentResponse> {
    try {
      const connection = getConnection();
      
      const result = await connection.query(
        `UPDATE users 
         SET name = $1, email = $2, first_name = $3, last_name = $4, phone_number = $5
         WHERE user_id = $6 AND user_role = 'S'
         RETURNING *`,
        [
          studentRequest.name,
          studentRequest.email,
          studentRequest.firstName,
          studentRequest.lastName,
          studentRequest.phoneNumber,
          studentId
        ]
      );

      if (result.length === 0) {
        throw new Error('Student not found or update failed');
      }

      // Get enrollment count
      const enrollmentResult = await connection.query(
        `SELECT COUNT(*) as enrollment_count FROM enrollments WHERE student_id = $1`,
        [studentId]
      );

      const studentData = { 
        ...result[0], 
        enrollment_count: enrollmentResult[0].enrollment_count 
      };
      return this.mapRowToStudentResponse(studentData);
    } catch (error) {
      console.error('Error updating student:', error);
      throw new Error('Failed to update student');
    }
  }

  /**
   * Update student password
   */
  async updateStudentPassword(studentId: number, studentRequest: StudentRequest): Promise<StudentResponse> {
    // Mock implementation - replace with database integration
    return {
      userId: studentId,
      name: 'Updated Student',
      email: studentRequest.email,
      role: 'STUDENT',
      activated: true,
      enrollmentCount: 3
    };
  }

  /**
   * Delete student
   */
  async deleteStudent(studentId: number): Promise<void> {
    // Mock implementation - replace with database integration
    console.log(`Deleting student with ID: ${studentId}`);
  }

  /**
   * Get courses by student ID with pagination
   */
  async getCoursesByStudentId(studentId: number, page: number, size: number): Promise<PageResponse<EnrollmentResponse>> {
    try {
      const connection = getConnection();
      const offset = page * size;

      // Get total count
      const countResult = await connection.query(
        `SELECT COUNT(*) as total FROM enrollments WHERE student_id = $1`,
        [studentId]
      );
      const totalElements = parseInt(countResult[0].total);

      // Get paginated enrollments with course and instructor data
      const result = await connection.query(
        `SELECT e.*, 
                u.user_id as student_user_id, u.name as student_name, u.email as student_email,
                u.activated as student_activated,
                c.course_id, c.title as course_name, c.description as course_description, c.price as course_price, 
                c.course_thumbnail, c.status as course_status, c.created_at as course_created_at,
                i.user_id as instructor_id, i.name as instructor_name,
                cat.category_id, cat.category_name
         FROM enrollments e
         JOIN users u ON e.student_id = u.user_id
         JOIN courses c ON e.course_id = c.course_id
         LEFT JOIN users i ON c.instructor_id = i.user_id
         LEFT JOIN categories cat ON c.category_id = cat.category_id
         WHERE e.student_id = $1
         ORDER BY e.enrollment_date DESC
         LIMIT $2 OFFSET $3`,
        [studentId, size, offset]
      );

      const enrollments = result.map((row: any) => this.mapRowToEnrollmentResponse(row));

      const totalPages = Math.ceil(totalElements / size);

      return {
        content: enrollments,
        totalElements,
        totalPages,
        currentPage: page,
        size,
        hasNext: page < totalPages - 1,
        hasPrevious: page > 0,
        isFirst: page === 0,
        isLast: page >= totalPages - 1
      };
    } catch (error) {
      console.error('Error getting courses by student ID:', error);
      throw new Error('Failed to retrieve student courses');
    }
  }

  /**
   * Add student to course (enroll)
   */
  async addStudentToCourse(studentId: number, courseId: number): Promise<EnrollmentResponse> {
    try {
      const connection = getConnection();
      
      // Check if already enrolled
      const existingEnrollment = await connection.query(
        `SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2`,
        [studentId, courseId]
      );

      if (existingEnrollment.length > 0) {
        throw new Error('Student is already enrolled in this course');
      }

      // Create enrollment
      const enrollmentResult = await connection.query(
        `INSERT INTO enrollments (student_id, course_id, enrollment_date, is_complete, current_section_position)
         VALUES ($1, $2, NOW(), false, 0)
         RETURNING *`,
        [studentId, courseId]
      );

      if (enrollmentResult.length === 0) {
        throw new Error('Failed to create enrollment');
      }

      // Get full enrollment data with student and course info
      const fullResult = await connection.query(
        `SELECT e.*, 
                u.user_id as student_user_id, u.name as student_name, u.email as student_email,
                u.activated as student_activated,
                c.course_id, c.title as course_name, c.description as course_description, c.price as course_price, 
                c.course_thumbnail, c.status as course_status, c.created_at as course_created_at,
                i.user_id as instructor_id, i.name as instructor_name,
                cat.category_id, cat.category_name
         FROM enrollments e
         JOIN users u ON e.student_id = u.user_id
         JOIN courses c ON e.course_id = c.course_id
         LEFT JOIN users i ON c.instructor_id = i.user_id
         LEFT JOIN categories cat ON c.category_id = cat.category_id
         WHERE e.enrollment_id = $1`,
        [enrollmentResult[0].enrollment_id]
      );

      return this.mapRowToEnrollmentResponse(fullResult[0]);
    } catch (error) {
      console.error('Error enrolling student in course:', error);
      throw new Error('Failed to enroll student in course');
    }
  }

  /**
   * Add student to courses from cart
   */
  async addStudentToCoursesFromCart(studentId: number): Promise<EnrollmentResponse[]> {
    // Mock implementation - replace with database integration
    const student = {
      userId: studentId,
      name: 'Student Name',
      email: 'student@example.com',
      role: 'STUDENT',
      activated: true
    };

    return [
      {
        enrollmentId: Date.now(),
        enrollmentDate: new Date(),
        progress: 0,
        status: 'ENROLLED',
        student,
        course: {
          courseId: 1,
          title: 'Course from Cart 1',
          description: 'First course from cart',
          price: 99,
          courseThumbnail: 'cart1-thumb.jpg',
          status: 'PUBLISHED',
          createdAt: new Date(),
          instructor: { userId: 1, name: 'Instructor 1' },
          category: { categoryId: 1, name: 'Category 1' }
        }
      },
      {
        enrollmentId: Date.now() + 1,
        enrollmentDate: new Date(),
        progress: 0,
        status: 'ENROLLED',
        student,
        course: {
          courseId: 2,
          title: 'Course from Cart 2',
          description: 'Second course from cart',
          price: 149,
          courseThumbnail: 'cart2-thumb.jpg',
          status: 'PUBLISHED',
          createdAt: new Date(),
          instructor: { userId: 1, name: 'Instructor 1' },
          category: { categoryId: 1, name: 'Category 1' }
        }
      }
    ];
  }

  /**
   * Get student statistics
   */
  async getStudentStatistic(studentId: number): Promise<StudentStatisticResponse> {
    try {
      const connection = getConnection();
      
      // Get enrollment statistics
      const enrollmentStats = await connection.query(
        `SELECT 
           COUNT(*) as total_enrollments,
           COUNT(CASE WHEN is_complete = true THEN 1 END) as completed_courses,
           COUNT(CASE WHEN is_complete = false AND current_section_position > 0 THEN 1 END) as in_progress_courses
         FROM enrollments 
         WHERE student_id = $1`,
        [studentId]
      );

      const stats = enrollmentStats[0];
      const totalEnrollments = parseInt(stats.total_enrollments);
      const completedCourses = parseInt(stats.completed_courses);
      const inProgressCourses = parseInt(stats.in_progress_courses);
      
      // Calculate average progress (simplified)
      const averageProgress = totalEnrollments > 0 ? 
        Math.round((completedCourses / totalEnrollments) * 100) : 0;

      return {
        studentId,
        totalEnrollments,
        completedCourses,
        inProgressCourses,
        totalHoursLearned: completedCourses * 12, // Estimated 12 hours per course
        averageProgress,
        certificatesEarned: completedCourses, // Use completed courses as certificates for now
        currentStreak: 0, // Would need activity tracking for real implementation
        longestStreak: 0  // Would need activity tracking for real implementation
      };
    } catch (error) {
      console.error('Error getting student statistics:', error);
      throw new Error('Failed to get student statistics');
    }
  }

  /**
   * Update student address
   */
  async updateStudentAddress(userId: number, addressRequest: UserAddressRequest): Promise<UserAddressResponse> {
    try {
      const connection = getConnection();
      
      await connection.query(
        `UPDATE users 
         SET user_address = $1, user_city = $2, user_country = $3, phone_number = $4
         WHERE user_id = $5 AND user_role = 'S'`,
        [
          addressRequest.userAddress,
          addressRequest.userCity,
          addressRequest.userCountry,
          addressRequest.phoneNumber,
          userId
        ]
      );

      return {
        userId,
        userAddress: addressRequest.userAddress,
        userCity: addressRequest.userCity,
        userCountry: addressRequest.userCountry,
        phoneNumber: addressRequest.phoneNumber,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating student address:', error);
      throw new Error('Failed to update student address');
    }
  }

  /**
   * Complete section
   */
  async completeSection(request: SectionCompleteRequest): Promise<SectionCompleteResponse> {
    // Mock implementation - replace with database integration
    return {
      sectionId: request.sectionId,
      studentId: request.studentId,
      courseId: request.courseId,
      sectionTitle: 'Mock Section',
      completedAt: new Date(),
      progress: request.progress || 100,
      nextSectionId: request.sectionId + 1,
      isLastSection: false
    };
  }

  /**
   * Get current section for student in course
   */
  async getCurrentSection(studentId: number, courseId: number): Promise<SectionCompleteResponse> {
    try {
      const connection = getConnection();
      
      // Get enrollment information with current section position
      const enrollmentResult = await connection.query(
        `SELECT 
           e.current_section_position,
           e.is_complete,
           e.completion_date,
           e.enrollment_date
         FROM enrollments e
         WHERE e.student_id = $1 AND e.course_id = $2
         LIMIT 1`,
        [studentId, courseId]
      );

      if (enrollmentResult.length === 0) {
        throw new Error('Student is not enrolled in this course');
      }

      const enrollment = enrollmentResult[0];
      const currentPosition = enrollment.current_section_position || 0;

      // If course is completed, get the last section
      if (enrollment.is_complete) {
        const lastSectionResult = await connection.query(
          `SELECT 
             s.section_id,
             s.section_name,
             s.title,
             s.position,
             (SELECT COUNT(*) FROM section WHERE course_id = s.course_id) as total_sections
           FROM section s
           WHERE s.course_id = $1
           ORDER BY s.position DESC
           LIMIT 1`,
          [courseId]
        );

        if (lastSectionResult.length > 0) {
          const section = lastSectionResult[0];
          return {
            sectionId: section.section_id,
            studentId,
            courseId,
            sectionTitle: section.title || section.section_name || 'Final Section',
            completedAt: new Date(enrollment.completion_date || enrollment.enrollment_date),
            progress: 100,
            nextSectionId: undefined,
            isLastSection: true
          };
        }
      }

      // Get current or next section based on position
      const sectionResult = await connection.query(
        `SELECT 
           s.section_id,
           s.section_name,
           s.title,
           s.position,
           (SELECT COUNT(*) FROM section WHERE course_id = s.course_id) as total_sections,
           (SELECT section_id FROM section WHERE course_id = s.course_id AND position > s.position ORDER BY position ASC LIMIT 1) as next_section_id
         FROM section s
         WHERE s.course_id = $1 AND s.position >= $2
         ORDER BY s.position ASC
         LIMIT 1`,
        [courseId, Math.max(currentPosition, 1)]
      );

      if (sectionResult.length === 0) {
        // No sections found, return first section
        const firstSectionResult = await connection.query(
          `SELECT 
             s.section_id,
             s.section_name,
             s.title,
             s.position,
             (SELECT COUNT(*) FROM section WHERE course_id = s.course_id) as total_sections,
             (SELECT section_id FROM section WHERE course_id = s.course_id AND position > s.position ORDER BY position ASC LIMIT 1) as next_section_id
           FROM section s
           WHERE s.course_id = $1
           ORDER BY s.position ASC
           LIMIT 1`,
          [courseId]
        );

        if (firstSectionResult.length === 0) {
          throw new Error('No sections found for this course');
        }

        const section = firstSectionResult[0];
        return {
          sectionId: section.section_id,
          studentId,
          courseId,
          sectionTitle: section.title || section.section_name || 'First Section',
          completedAt: new Date(enrollment.enrollment_date),
          progress: 0,
          nextSectionId: section.next_section_id,
          isLastSection: section.next_section_id === null
        };
      }

      const section = sectionResult[0];
      const totalSections = parseInt(section.total_sections);
      const currentProgress = currentPosition > 0 ? Math.round((currentPosition / totalSections) * 100) : 0;

      return {
        sectionId: section.section_id,
        studentId,
        courseId,
        sectionTitle: section.title || section.section_name || `Section ${section.position}`,
        completedAt: currentPosition >= section.position ? new Date() : new Date(enrollment.enrollment_date),
        progress: currentProgress,
        nextSectionId: section.next_section_id,
        isLastSection: section.next_section_id === null
      };
    } catch (error) {
      console.error('Error getting current section:', error);
      throw new Error('Failed to get current section');
    }
  }

  /**
   * Map database row to StudentResponse
   */
  private mapRowToStudentResponse(row: any): StudentResponse {
    return {
      userId: row.user_id,
      name: row.name,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phoneNumber: row.phone_number,
      userAddress: row.user_address,
      userCity: row.user_city,
      userCountry: row.user_country,
      role: 'STUDENT',
      activated: row.activated,
      enrollmentCount: row.enrollment_count ? parseInt(row.enrollment_count) : 0
    };
  }

  /**
   * Map database row to EnrollmentResponse
   */
  private mapRowToEnrollmentResponse(row: any): EnrollmentResponse {
    const progress = this.calculateProgress(row.current_section_position, row.is_complete);
    const status = row.is_complete ? 'COMPLETED' : 
                  (row.current_section_position > 0 ? 'IN_PROGRESS' : 'ENROLLED');

    return {
      enrollmentId: row.enrollment_id,
      enrollmentDate: new Date(row.enrollment_date),
      completionDate: row.completion_date ? new Date(row.completion_date) : undefined,
      progress,
      status,
      student: {
        userId: row.student_user_id,
        name: row.student_name,
        email: row.student_email,
        role: 'STUDENT',
        activated: row.student_activated
      },
      course: {
        courseId: row.course_id,
        title: row.course_name,
        description: row.course_description,
        price: parseFloat(row.course_price),
        courseThumbnail: row.course_thumbnail,
        status: row.course_status,
        createdAt: new Date(row.course_created_at),
        instructor: row.instructor_id ? {
          userId: row.instructor_id,
          name: row.instructor_name
        } : undefined,
        category: row.category_id ? {
          categoryId: row.category_id,
          name: row.category_name
        } : undefined
      }
    };
  }

  /**
   * Calculate progress percentage based on section position and completion status
   */
  private calculateProgress(currentSection: number, isComplete: boolean): number {
    if (isComplete) return 100;
    if (!currentSection) return 0;
    // Simple calculation - could be enhanced with actual section count
    return Math.min(currentSection * 10, 90);
  }
}