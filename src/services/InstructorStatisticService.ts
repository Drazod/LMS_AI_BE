import { getConnection } from 'typeorm';
import { PageResponse } from '../models/response';

export class InstructorStatisticService {
  constructor() {}

  /**
   * Get instructor dashboard overview statistics
   */
  async getInstructorDashboard(instructorId: number): Promise<any> {
    try {
      const connection = getConnection();

      // Get total courses by status
      const courseStatsResult = await connection.query(
        `SELECT 
           COUNT(*) as total_courses,
           COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as published_courses,
           COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as draft_courses
         FROM courses 
         WHERE instructor_id = $1`,
        [instructorId]
      );

      // Get total students (unique enrollments)
      const studentStatsResult = await connection.query(
        `SELECT COUNT(DISTINCT e.student_id) as total_students
         FROM enrollments e
         JOIN courses c ON e.course_id = c.course_id
         WHERE c.instructor_id = $1`,
        [instructorId]
      );

      // Get total revenue from orders
      const revenueStatsResult = await connection.query(
        `SELECT 
           COALESCE(SUM(oi.price), 0) as total_revenue,
           COALESCE(SUM(CASE WHEN DATE_TRUNC('month', o.payment_date) = DATE_TRUNC('month', CURRENT_DATE) THEN oi.price ELSE 0 END), 0) as monthly_revenue
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN courses c ON oi.course_id = c.course_id
         WHERE c.instructor_id = $1`,
        [instructorId]
      );

      // Get average rating and total ratings
      const ratingStatsResult = await connection.query(
        `SELECT 
           AVG(c.avg_rating) as average_rating,
           SUM(c.total_rating) as total_ratings
         FROM courses c
         WHERE c.instructor_id = $1 AND c.avg_rating IS NOT NULL`,
        [instructorId]
      );

      // Get completion rate
      const completionRateResult = await connection.query(
        `SELECT 
           (COUNT(CASE WHEN e.is_complete = true THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as completion_rate
         FROM enrollments e
         JOIN courses c ON e.course_id = c.course_id
         WHERE c.instructor_id = $1`,
        [instructorId]
      );

      // Get top courses
      const topCoursesResult = await connection.query(
        `SELECT 
           c.course_id,
           c.title,
           COUNT(DISTINCT e.enrollment_id) as enrollments,
           COALESCE(SUM(oi.price), 0) as revenue,
           c.avg_rating as rating
         FROM courses c
         LEFT JOIN enrollments e ON c.course_id = e.course_id
         LEFT JOIN order_items oi ON c.course_id = oi.course_id
         WHERE c.instructor_id = $1
         GROUP BY c.course_id, c.title, c.avg_rating
         ORDER BY enrollments DESC, revenue DESC
         LIMIT 5`,
        [instructorId]
      );

      // Get monthly trends for current year
      const monthlyTrendsResult = await connection.query(
        `SELECT 
           TO_CHAR(e.enrollment_date, 'YYYY-MM') as month,
           COUNT(e.enrollment_id) as enrollments,
           COALESCE(SUM(oi.price), 0) as revenue
         FROM enrollments e
         JOIN courses c ON e.course_id = c.course_id
         LEFT JOIN order_items oi ON c.course_id = oi.course_id
         LEFT JOIN orders o ON oi.order_id = o.order_id AND o.student_id = e.student_id
         WHERE c.instructor_id = $1 
           AND e.enrollment_date >= DATE_TRUNC('year', CURRENT_DATE)
         GROUP BY TO_CHAR(e.enrollment_date, 'YYYY-MM')
         ORDER BY month`,
        [instructorId]
      );

      const courseStats = courseStatsResult[0];
      const studentStats = studentStatsResult[0];
      const revenueStats = revenueStatsResult[0];
      const ratingStats = ratingStatsResult[0];
      const completionRate = completionRateResult[0];

      return {
        instructorId,
        overview: {
          totalCourses: parseInt(courseStats.total_courses) || 0,
          publishedCourses: parseInt(courseStats.published_courses) || 0,
          draftCourses: parseInt(courseStats.draft_courses) || 0,
          totalStudents: parseInt(studentStats.total_students) || 0,
          totalRevenue: parseFloat(revenueStats.total_revenue) || 0,
          monthlyRevenue: parseFloat(revenueStats.monthly_revenue) || 0,
          averageRating: parseFloat(ratingStats.average_rating) || 0,
          totalRatings: parseInt(ratingStats.total_ratings) || 0,
          completionRate: parseFloat(completionRate.completion_rate) || 0
        },
        topCourses: topCoursesResult.map((course: any) => ({
          courseId: course.course_id,
          title: course.title,
          enrollments: parseInt(course.enrollments) || 0,
          revenue: parseFloat(course.revenue) || 0,
          rating: parseFloat(course.rating) || 0
        })),
        monthlyTrends: {
          enrollments: monthlyTrendsResult.map((trend: any) => ({
            month: trend.month,
            value: parseInt(trend.enrollments) || 0
          })),
          revenue: monthlyTrendsResult.map((trend: any) => ({
            month: trend.month,
            value: parseFloat(trend.revenue) || 0
          }))
        }
      };
    } catch (error) {
      console.error('Error getting instructor dashboard:', error);
      throw new Error('Failed to retrieve instructor dashboard statistics');
    }
  }

  /**
   * Get detailed course statistics for instructor
   */
  async getInstructorCourseStatistics(instructorId: number, page: number, size: number): Promise<PageResponse<any>> {
    // Mock implementation - replace with database integration
    const mockCourseStats = [
      {
        courseId: 1,
        title: 'JavaScript Fundamentals',
        status: 'published',
        enrollments: 456,
        completions: 324,
        completionRate: 71.1,
        averageRating: 4.7,
        totalRatings: 89,
        revenue: 15678.50,
        lastEnrollment: new Date('2024-03-15'),
        createdAt: new Date('2023-08-15')
      },
      {
        courseId: 2,
        title: 'React Advanced',
        status: 'published',
        enrollments: 342,
        completions: 267,
        completionRate: 78.1,
        averageRating: 4.8,
        totalRatings: 76,
        revenue: 12850.75,
        lastEnrollment: new Date('2024-03-14'),
        createdAt: new Date('2023-09-20')
      },
      {
        courseId: 3,
        title: 'Node.js Backend',
        status: 'published',
        enrollments: 289,
        completions: 198,
        completionRate: 68.5,
        averageRating: 4.5,
        totalRatings: 64,
        revenue: 10456.25,
        lastEnrollment: new Date('2024-03-13'),
        createdAt: new Date('2023-10-10')
      }
    ];

    const startIndex = page * size;
    const endIndex = startIndex + size;
    const content = mockCourseStats.slice(startIndex, endIndex);

    return {
      content,
      totalElements: mockCourseStats.length,
      totalPages: Math.ceil(mockCourseStats.length / size),
      currentPage: page,
      size,
      hasNext: endIndex < mockCourseStats.length,
      hasPrevious: page > 0,
      isFirst: page === 0,
      isLast: endIndex >= mockCourseStats.length
    };
  }

  /**
   * Get instructor revenue statistics with breakdown
   */
  async getInstructorRevenue(instructorId: number, startDate?: string, endDate?: string, period: string = 'month'): Promise<any> {
    try {
      const connection = getConnection();
      
      // Build date filter
      let dateFilter = '';
      const queryParams: any[] = [instructorId];
      let paramIndex = 2;

      if (startDate && endDate) {
        dateFilter = `AND e.enrollment_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        queryParams.push(startDate, endDate);
      }

      // Get summary statistics from orders
      const summaryResult = await connection.query(
        `SELECT 
           COALESCE(SUM(oi.price), 0) as total_revenue,
           COALESCE(SUM(oi.price * 0.8), 0) as net_revenue,
           COALESCE(SUM(oi.price * 0.2), 0) as platform_commission,
           COALESCE(AVG(oi.price), 0) as average_order_value,
           COUNT(DISTINCT o.order_id) as total_orders
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN courses c ON oi.course_id = c.course_id
         WHERE c.instructor_id = $1 ${dateFilter.replace('e.enrollment_date', 'o.payment_date')}`,
        queryParams
      );

      // Get revenue by period (year or month)
      const periodFormat = period === 'year' ? 'YYYY' : 'YYYY-MM';
      const revenueByPeriodResult = await connection.query(
        `SELECT 
           TO_CHAR(o.payment_date, '${periodFormat}') as period,
           COALESCE(SUM(oi.price), 0) as gross_revenue,
           COALESCE(SUM(oi.price * 0.8), 0) as net_revenue,
           COUNT(DISTINCT o.order_id) as orders
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN courses c ON oi.course_id = c.course_id
         WHERE c.instructor_id = $1 ${dateFilter.replace('e.enrollment_date', 'o.payment_date')}
         GROUP BY TO_CHAR(o.payment_date, '${periodFormat}')
         ORDER BY period`,
        queryParams
      );

      // Get revenue by course
      const revenueByCourseResult = await connection.query(
        `SELECT 
           c.course_id,
           c.title as course_title,
           COALESCE(SUM(oi.price), 0) as revenue,
           COUNT(DISTINCT e.enrollment_id) as enrollments
         FROM courses c
         LEFT JOIN order_items oi ON c.course_id = oi.course_id
         LEFT JOIN orders o ON oi.order_id = o.order_id
         LEFT JOIN enrollments e ON c.course_id = e.course_id
         WHERE c.instructor_id = $1 ${dateFilter.replace('e.enrollment_date', 'o.payment_date')}
         GROUP BY c.course_id, c.title
         ORDER BY revenue DESC`,
        queryParams
      );

      const summary = summaryResult[0];
      const totalRevenue = parseFloat(summary.total_revenue) || 0;

      // Calculate percentages for courses
      const revenueByCourse = revenueByCourseResult.map((course: any) => ({
        courseId: course.course_id,
        courseTitle: course.course_title,
        revenue: parseFloat(course.revenue) || 0,
        enrollments: parseInt(course.enrollments) || 0,
        percentage: totalRevenue > 0 ? ((parseFloat(course.revenue) / totalRevenue) * 100) : 0
      }));

      return {
        instructorId,
        period: { startDate, endDate, groupBy: period },
        summary: {
          totalRevenue: totalRevenue,
          netRevenue: parseFloat(summary.net_revenue) || 0,
          platformCommission: parseFloat(summary.platform_commission) || 0,
          commissionRate: 20,
          averageOrderValue: parseFloat(summary.average_order_value) || 0,
          totalOrders: parseInt(summary.total_orders) || 0
        },
        revenueByPeriod: revenueByPeriodResult.map((period: any) => ({
          period: period.period,
          grossRevenue: parseFloat(period.gross_revenue) || 0,
          netRevenue: parseFloat(period.net_revenue) || 0,
          orders: parseInt(period.orders) || 0
        })),
        revenueByCourse: revenueByCourse
      };
    } catch (error) {
      console.error('Error getting instructor revenue:', error);
      throw new Error('Failed to retrieve instructor revenue statistics');
    }
  }

  /**
   * Get student engagement metrics
   */
  async getStudentEngagement(instructorId: number, courseId?: number): Promise<any> {
    // Mock implementation - replace with database aggregation
    return {
      instructorId,
      courseId,
      engagement: {
        totalStudents: 1247,
        activeStudents: 892, // Students who accessed content in last 30 days
        engagementRate: 71.5,
        averageSessionTime: 45, // minutes
        averageProgress: 68.3, // percentage
        totalWatchTime: 15420, // hours
        discussionParticipation: 23.8 // percentage of students participating in discussions
      },
      progressDistribution: {
        notStarted: 156,
        inProgress: 623,
        completed: 468
      },
      activityByDay: [
        { day: 'Monday', activeUsers: 145, sessionTime: 52 },
        { day: 'Tuesday', activeUsers: 132, sessionTime: 48 },
        { day: 'Wednesday', activeUsers: 158, sessionTime: 55 },
        { day: 'Thursday', activeUsers: 142, sessionTime: 47 },
        { day: 'Friday', activeUsers: 125, sessionTime: 43 },
        { day: 'Saturday', activeUsers: 98, sessionTime: 38 },
        { day: 'Sunday', activeUsers: 92, sessionTime: 35 }
      ],
      topEngagingContent: [
        { contentId: 1, title: 'Variables and Data Types', viewTime: 1250, completionRate: 89.2 },
        { contentId: 2, title: 'Functions and Scope', viewTime: 1180, completionRate: 85.6 },
        { contentId: 3, title: 'Async Programming', viewTime: 1450, completionRate: 78.3 }
      ]
    };
  }

  /**
   * Get instructor rating and feedback statistics
   */
  async getInstructorRatings(instructorId: number, courseId?: number): Promise<any> {
    // Mock implementation - replace with database aggregation
    return {
      instructorId,
      courseId,
      ratingSummary: {
        overallRating: 4.6,
        totalRatings: 428,
        ratingDistribution: {
          5: 245,
          4: 128,
          3: 42,
          2: 8,
          1: 5
        }
      },
      ratingTrends: [
        { month: '2024-01', averageRating: 4.4, totalRatings: 32 },
        { month: '2024-02', averageRating: 4.5, totalRatings: 28 },
        { month: '2024-03', averageRating: 4.7, totalRatings: 35 }
      ],
      feedbackCategories: {
        contentQuality: 4.7,
        instructionClarity: 4.6,
        courseStructure: 4.5,
        responsiveness: 4.8,
        practicalExamples: 4.4
      },
      recentFeedback: [
        {
          ratingId: 1,
          courseTitle: 'JavaScript Fundamentals',
          rating: 5,
          comment: 'Excellent course with clear explanations!',
          studentName: 'Anonymous',
          date: new Date('2024-03-15')
        },
        {
          ratingId: 2,
          courseTitle: 'React Advanced',
          rating: 4,
          comment: 'Great content but could use more examples.',
          studentName: 'Anonymous',
          date: new Date('2024-03-14')
        }
      ]
    };
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(instructorId: number, metric: string, period: string, limit: number): Promise<any> {
    // Mock implementation - replace with database aggregation
    const mockTrends: any = {
      enrollments: [
        { period: '2024-01', value: 125 },
        { period: '2024-02', value: 148 },
        { period: '2024-03', value: 167 }
      ],
      revenue: [
        { period: '2024-01', value: 3250.50 },
        { period: '2024-02', value: 3680.75 },
        { period: '2024-03', value: 3850.25 }
      ],
      ratings: [
        { period: '2024-01', value: 4.4 },
        { period: '2024-02', value: 4.5 },
        { period: '2024-03', value: 4.7 }
      ],
      completions: [
        { period: '2024-01', value: 89 },
        { period: '2024-02', value: 102 },
        { period: '2024-03', value: 118 }
      ]
    };

    return {
      instructorId,
      metric,
      period,
      trends: mockTrends[metric] || mockTrends.enrollments,
      summary: {
        currentValue: mockTrends[metric]?.[mockTrends[metric].length - 1]?.value || 0,
        previousValue: mockTrends[metric]?.[mockTrends[metric].length - 2]?.value || 0,
        percentageChange: 13.2,
        trend: 'increasing'
      }
    };
  }

  /**
   * Compare instructor performance with platform averages
   */
  async getInstructorComparison(instructorId: number): Promise<any> {
    // Mock implementation - replace with database aggregation
    return {
      instructorId,
      comparison: {
        enrollments: {
          instructor: 156,
          platformAverage: 89,
          percentageDifference: 75.3,
          performance: 'above_average'
        },
        ratings: {
          instructor: 4.6,
          platformAverage: 4.2,
          percentageDifference: 9.5,
          performance: 'above_average'
        },
        completionRate: {
          instructor: 73.2,
          platformAverage: 65.8,
          percentageDifference: 11.2,
          performance: 'above_average'
        },
        revenue: {
          instructor: 3850.25,
          platformAverage: 2450.80,
          percentageDifference: 57.1,
          performance: 'above_average'
        },
        responseTime: {
          instructor: 4.5, // hours
          platformAverage: 8.2,
          percentageDifference: -45.1,
          performance: 'above_average'
        }
      },
      ranking: {
        overall: 12,
        totalInstructors: 450,
        percentile: 97.3
      }
    };
  }

  /**
   * Get top performing content for instructor
   */
  async getTopPerformingContent(instructorId: number, limit: number, metric: string): Promise<any> {
    // Mock implementation - replace with database aggregation
    const mockContent: any = {
      enrollments: [
        { contentId: 1, title: 'JavaScript Fundamentals', type: 'course', enrollments: 456, revenue: 15678.50 },
        { contentId: 2, title: 'React Advanced', type: 'course', enrollments: 342, revenue: 12850.75 },
        { contentId: 3, title: 'Node.js Backend', type: 'course', enrollments: 289, revenue: 10456.25 }
      ],
      revenue: [
        { contentId: 1, title: 'JavaScript Fundamentals', type: 'course', revenue: 15678.50, enrollments: 456 },
        { contentId: 2, title: 'React Advanced', type: 'course', revenue: 12850.75, enrollments: 342 },
        { contentId: 3, title: 'Node.js Backend', type: 'course', revenue: 10456.25, enrollments: 289 }
      ],
      ratings: [
        { contentId: 2, title: 'React Advanced', type: 'course', rating: 4.8, totalRatings: 76 },
        { contentId: 1, title: 'JavaScript Fundamentals', type: 'course', rating: 4.7, totalRatings: 89 },
        { contentId: 3, title: 'Node.js Backend', type: 'course', rating: 4.5, totalRatings: 64 }
      ]
    };

    return {
      instructorId,
      metric,
      limit,
      topContent: (mockContent[metric] || mockContent.enrollments).slice(0, limit)
    };
  }

  /**
   * Export instructor statistics in various formats
   */
  async exportStatistics(instructorId: number, format: string, startDate?: string, endDate?: string): Promise<any> {
    // Mock implementation - replace with actual export logic
    const dashboard = await this.getInstructorDashboard(instructorId);
    const revenue = await this.getInstructorRevenue(instructorId, startDate, endDate);
    const ratings = await this.getInstructorRatings(instructorId);

    const exportData = {
      instructorId,
      exportDate: new Date(),
      period: { startDate, endDate },
      dashboard,
      revenue,
      ratings
    };

    if (format === 'csv') {
      // Mock CSV generation - replace with actual CSV library
      return `InstructorID,TotalCourses,TotalStudents,TotalRevenue,AverageRating
${instructorId},${dashboard.overview.totalCourses},${dashboard.overview.totalStudents},${dashboard.overview.totalRevenue},${dashboard.overview.averageRating}`;
    }

    return exportData;
  }

  /**
   * Get total users who bought courses from instructor
   */
  async getTotalUsersBuy(instructorId: number): Promise<number> {
    try {
      const connection = getConnection();
      console.log('Querying total users buy for instructor:', instructorId);
      const result = await connection.query(
        `SELECT COUNT(DISTINCT e.student_id) as total_users
         FROM enrollments e
         JOIN courses c ON e.course_id = c.course_id
         WHERE c.instructor_id = $1`,
        [instructorId]
      );
      console.log('Total users buy result:', result);
      return parseInt(result[0].total_users) || 0;
    } catch (error) {
      console.error('Error getting total users buy:', error);
      throw new Error('Failed to get total users buy');
    }
  }

  /**
   * Get total revenue for instructor
   */
  async getTotalRevenue(instructorId: number): Promise<number> {
    try {
      const connection = getConnection();
      const result = await connection.query(
        `SELECT COALESCE(SUM(oi.price), 0) as total_revenue
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN courses c ON oi.course_id = c.course_id
         WHERE c.instructor_id = $1`,
        [instructorId]
      );
      return parseFloat(result[0].total_revenue) || 0;
    } catch (error) {
      console.error('Error getting total revenue:', error);
      throw new Error('Failed to get total revenue');
    }
  }

  /**
   * Get total courses for instructor
   */
  async getTotalCourses(instructorId: number): Promise<number> {
    try {
      const connection = getConnection();
      console.log('Querying total courses for instructor:', instructorId);
      const result = await connection.query(
        `SELECT COUNT(*) as total_courses
         FROM courses
         WHERE instructor_id = $1`,
        [instructorId]
      );
      console.log('Total courses result:', result);
      return parseInt(result[0].total_courses) || 0;
    } catch (error) {
      console.error('Error getting total courses:', error);
      throw new Error('Failed to get total courses');
    }
  }

  /**
   * Get top performing course for instructor
   */
  async getTopCourse(instructorId: number): Promise<any> {
    try {
      const connection = getConnection();
      const result = await connection.query(
        `SELECT 
           c.course_id,
           c.title,
           COUNT(DISTINCT e.enrollment_id) as enrollments,
           COALESCE(SUM(oi.price), 0) as revenue,
           c.avg_rating as rating
         FROM courses c
         LEFT JOIN enrollments e ON c.course_id = e.course_id
         LEFT JOIN order_items oi ON c.course_id = oi.course_id
         WHERE c.instructor_id = $1
         GROUP BY c.course_id, c.title, c.avg_rating
         ORDER BY enrollments DESC, revenue DESC
         LIMIT 1`,
        [instructorId]
      );
      
      if (result.length === 0) {
        return null;
      }
      
      const topCourse = result[0];
      return {
        courseId: topCourse.course_id,
        title: topCourse.title,
        enrollments: parseInt(topCourse.enrollments) || 0,
        revenue: parseFloat(topCourse.revenue) || 0,
        rating: parseFloat(topCourse.rating) || 0
      };
    } catch (error) {
      console.error('Error getting top course:', error);
      throw new Error('Failed to get top course');
    }
  }

  /**
   * Get revenue per year for instructor
   */
  async getRevenuePerYear(instructorId: number): Promise<any[]> {
    try {
      const connection = getConnection();
      const result = await connection.query(
        `SELECT 
           EXTRACT(YEAR FROM o.payment_date) as year,
           COALESCE(SUM(oi.price), 0) as revenue
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN courses c ON oi.course_id = c.course_id
         WHERE c.instructor_id = $1
         GROUP BY EXTRACT(YEAR FROM o.payment_date)
         ORDER BY year DESC`,
        [instructorId]
      );
      
      return result.map((row: any) => ({
        year: parseInt(row.year),
        revenue: parseFloat(row.revenue) || 0
      }));
    } catch (error) {
      console.error('Error getting revenue per year:', error);
      throw new Error('Failed to get revenue per year');
    }
  }

  /**
   * Get courses created per year for instructor
   */
  async getCoursesPerYear(instructorId: number): Promise<any[]> {
    try {
      const connection = getConnection();
      const result = await connection.query(
        `SELECT 
           EXTRACT(YEAR FROM created_at) as year,
           COUNT(*) as courses
         FROM courses
         WHERE instructor_id = $1
         GROUP BY EXTRACT(YEAR FROM created_at)
         ORDER BY year DESC`,
        [instructorId]
      );
      
      return result.map((row: any) => ({
        year: parseInt(row.year),
        courses: parseInt(row.courses) || 0
      }));
    } catch (error) {
      console.error('Error getting courses per year:', error);
      throw new Error('Failed to get courses per year');
    }
  }
}