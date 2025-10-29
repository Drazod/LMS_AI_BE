import { AnswerController } from '../controllers/AnswerController';
import { PaymentController } from '../controllers/PaymentController';
import { OrderController } from '../controllers/OrderController';

import { Router } from 'express';
import { AuthenticationController } from '../controllers/AuthenticationController';
import { CourseController } from '../controllers/CourseController';
import { StudentController } from '../controllers/StudentController';
import { InstructorController } from '../controllers/InstructorController';
import { InstructorStatisticController } from '../controllers/InstructorStatisticController';
import { CategoryController } from '../controllers/CategoryController';
import { SectionController } from '../controllers/SectionController';
import { ContentController } from '../controllers/ContentController';
import { CartController } from '../controllers/CartController';
import { AuthenticationService } from '../services/AuthenticationService';
import { UserService } from '../services/UserService';
import { EmailService } from '../services/EmailService';
import { VerificationTokenService } from '../services/VerificationTokenService';
import { CourseService } from '../services/CourseService';
import { StudentService } from '../services/StudentService';
import { InstructorService } from '../services/InstructorService';
import { CategoryService } from '../services/CategoryService';
import { CartService } from '../services/CartService';
import { OrderService } from '../services/OrderService';
import { PaymentService } from '../services/PaymentService';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadMiddleware } from '../middleware/uploadMiddleware';
import { cloudinaryUploadMiddleware } from '../middleware/cloudinaryUploadMiddleware';

// Initialize services using singleton pattern
const userService = UserService.getInstance();
const emailService = new EmailService();
const verificationTokenService = new VerificationTokenService();
const authService = new AuthenticationService();
const courseService = CourseService.getInstance();
const studentService = new StudentService();
const instructorService = new InstructorService();
const categoryService = new CategoryService();
const cartService = CartService.getInstance();
const orderService = new OrderService();
const paymentService = new PaymentService();
const answerController = new AnswerController();
const paymentController = new PaymentController(orderService);
const orderController = new OrderController(orderService, paymentService);
// Initialize controllers
const authController = new AuthenticationController(authService, emailService, userService);
const courseController = new CourseController(courseService);
const studentController = new StudentController(studentService);
const instructorController = new InstructorController(instructorService, courseService);
const instructorStatisticController = new InstructorStatisticController();
const categoryController = new CategoryController(categoryService);
const cartController = new CartController(cartService, studentService);
const sectionController = new SectionController();
const contentController = new ContentController();

export const setupApiRoutes = (router: Router): void => {
  // Answer routes
  const answerRouter = Router();
  answerRouter.post('/:questionId', answerController.submitAnswer);
  answerRouter.get('/:questionId', answerController.getAnswersByQuestion);
  answerRouter.patch('/:answerId/grade', answerController.gradeAnswer);
  router.use('/answers', answerRouter);
  
  // Authentication routes
  const authRouter = Router();
  authRouter.post('/register', authController.register);
  authRouter.post('/login', authController.authenticate);
  authRouter.post('/refresh-token', authController.refreshToken);
  authRouter.post('/logout', authController.logout);
  authRouter.get('/verify-email', authController.verifyEmail);
  authRouter.post('/resend-verification', authController.resendVerification);
  
  router.use('/auth', authRouter);

  // Course routes
  const courseRouter = Router();
  courseRouter.get('/', courseController.getAllCourses);
  courseRouter.get('/details/:id', courseController.getCourseWithSections);
  courseRouter.get('/section/:sectionId/contents', contentController.getContentsBySection);
  courseRouter.get('/:id', courseController.getCourseById);
  courseRouter.post('/', authMiddleware, ...cloudinaryUploadMiddleware.single('courseThumbnail'), courseController.createCourse);
  courseRouter.put('/:id', authMiddleware, ...cloudinaryUploadMiddleware.single('courseThumbnail'), courseController.updateCourse);
  courseRouter.patch('/:id/status', authMiddleware, courseController.updateCourseStatus);
  courseRouter.delete('/:id', authMiddleware, courseController.deleteCourse);
  courseRouter.get('/instructor/:instructorId', courseController.getCoursesByInstructor);
  courseRouter.get('/category/:categoryId', courseController.getCoursesByCategory);
  
  // Enhanced section creation with content and file upload support
  courseRouter.post('/:courseId/sections', authMiddleware, ...cloudinaryUploadMiddleware.array('videoFiles'), sectionController.createSection);
  
  router.use('/courses', courseRouter);

  // Category routes
  const categoryRouter = Router();
  categoryRouter.get('/', categoryController.getAllCategories);
  categoryRouter.get('/:id', categoryController.getCategoryById);
  categoryRouter.post('/', authMiddleware, categoryController.createCategory);
  categoryRouter.put('/:id', authMiddleware, categoryController.updateCategory);
  categoryRouter.delete('/:id', authMiddleware, categoryController.deleteCategory);
  categoryRouter.get('/:id/courses', categoryController.getCoursesByCategory);
  
  router.use('/categories', categoryRouter);

  // Student routes
  const studentRouter = Router();
  // Admin routes - Get all students
  studentRouter.get('/', authMiddleware, studentController.getAllStudents);
  
  // Specific routes first (before parameterized routes)
  studentRouter.put('/complete-section', authMiddleware, studentController.completeCurrentSection);
  
  // CRUD operations
  studentRouter.get('/:id', authMiddleware, studentController.getStudentById);
  studentRouter.post('/', authMiddleware, studentController.createStudent);
  studentRouter.put('/:id', authMiddleware, studentController.updateStudent);
  studentRouter.delete('/:id', authMiddleware, studentController.deleteStudent);
  
  // Student profile updates
  studentRouter.put('/:id/address', authMiddleware, studentController.updateStudentAddress);
  studentRouter.put('/:id/password', authMiddleware, studentController.updateStudentPassword);
  
  // Course enrollment and management
  studentRouter.get('/:id/courses', authMiddleware, studentController.getCoursesByStudentId);
  studentRouter.post('/:id/courses/:courseId', authMiddleware, studentController.addStudentToCourse);
  studentRouter.post('/:id/enroll-from-cart', authMiddleware, studentController.addStudentToCoursesFromCart);
  
  // Student statistics and progress
  studentRouter.get('/:id/statistics', authMiddleware, studentController.getStudentStatistic);
  studentRouter.get('/:id/courses/:courseId/current-section', authMiddleware, studentController.getCurrentSection);
  
  router.use('/students', studentRouter);

  // Instructor routes
  const instructorRouter = Router();
  // Admin routes - Get all instructors
  instructorRouter.get('/', authMiddleware, instructorController.getAllInstructors);
  
  // CRUD operations
  instructorRouter.get('/:id', authMiddleware, instructorController.getInstructorById);
  instructorRouter.post('/', authMiddleware, instructorController.createInstructor);
  instructorRouter.put('/:id', authMiddleware, instructorController.updateInstructor);
  instructorRouter.delete('/:id', authMiddleware, instructorController.deleteInstructor);
  
  // Instructor profile updates
  instructorRouter.put('/:id/address', authMiddleware, instructorController.updateInstructorAddress);
  instructorRouter.put('/:id/password', authMiddleware, instructorController.updateInstructorPassword);
  
  // Instructor course management
  instructorRouter.get('/:id/course', authMiddleware, instructorController.getInstructorCourses);
  
  router.use('/instructors', instructorRouter);

  // Instructor Statistics routes - matching frontend expectations
  const instructorStatsRouter = Router();
  // Individual statistics endpoints
  instructorStatsRouter.get('/:instructorId/totalUsersBuy', authMiddleware, instructorStatisticController.getTotalUsersBuy.bind(instructorStatisticController));
  instructorStatsRouter.get('/:instructorId/totalRevenue', authMiddleware, instructorStatisticController.getTotalRevenue.bind(instructorStatisticController));
  instructorStatsRouter.get('/:instructorId/totalCourses', authMiddleware, instructorStatisticController.getTotalCourses.bind(instructorStatisticController));
  instructorStatsRouter.get('/:instructorId/topCourse', authMiddleware, instructorStatisticController.getTopCourse.bind(instructorStatisticController));
  instructorStatsRouter.get('/:instructorId/revenuePerYear', authMiddleware, instructorStatisticController.getRevenuePerYear.bind(instructorStatisticController));
  instructorStatsRouter.get('/:instructorId/coursesPerYear', authMiddleware, instructorStatisticController.getCoursesPerYear.bind(instructorStatisticController));
  
  // Dashboard overview
  instructorStatsRouter.get('/:instructorId/dashboard', authMiddleware, instructorStatisticController.getInstructorDashboard.bind(instructorStatisticController));
  
  // Revenue analytics
  instructorStatsRouter.get('/:instructorId/revenue', authMiddleware, instructorStatisticController.getInstructorRevenue.bind(instructorStatisticController));
  
  // Course statistics
  instructorStatsRouter.get('/:instructorId/courses', authMiddleware, instructorStatisticController.getInstructorCourseStatistics.bind(instructorStatisticController));
  
  // Student engagement
  instructorStatsRouter.get('/:instructorId/engagement', authMiddleware, instructorStatisticController.getStudentEngagement.bind(instructorStatisticController));
  
  // Ratings and feedback
  instructorStatsRouter.get('/:instructorId/ratings', authMiddleware, instructorStatisticController.getInstructorRatings.bind(instructorStatisticController));
  
  // Performance trends
  instructorStatsRouter.get('/:instructorId/trends', authMiddleware, instructorStatisticController.getPerformanceTrends.bind(instructorStatisticController));
  
  router.use('/statisticInstructor', instructorStatsRouter);

  // Cart routes
  const cartRouter = Router();
  cartRouter.post('/createCart', authMiddleware, cartController.createCart);
  cartRouter.post('/addCourse', authMiddleware, cartController.addCourseToCart);
  cartRouter.get('/:studentId/listCourse', authMiddleware, cartController.getListCourseFromCart);
  cartRouter.get('/:studentId/getCartId', authMiddleware, cartController.getCartInfo);
  cartRouter.delete('/removeCourse', authMiddleware, cartController.removeCourseFromCart);
  cartRouter.get('/:studentId/total', authMiddleware, cartController.getCartTotal);
  cartRouter.delete('/clear/:studentId', authMiddleware, cartController.clearCart);
  
  router.use('/cart', cartRouter);

  // Section routes
  const sectionRouter = Router();
  sectionRouter.get('/course/:courseId/sections', authMiddleware, sectionController.getSectionsByCourse);
  sectionRouter.get('/:sectionId', authMiddleware, sectionController.getSectionById);
  sectionRouter.get('/:sectionId/contents', contentController.getContentsBySection);
  sectionRouter.post('/', authMiddleware, sectionController.createSection);
  sectionRouter.put('/:sectionId', authMiddleware, sectionController.updateSection);
  sectionRouter.delete('/:sectionId', authMiddleware, sectionController.deleteSection);
  sectionRouter.post('/:sectionId/content', authMiddleware, sectionController.addContent);
  
  router.use('/sections', sectionRouter);

  // Content routes  
  const contentRouter = Router();
  contentRouter.get('/:contentId', authMiddleware, contentController.getContentById);
  contentRouter.put('/:contentId', authMiddleware, contentController.updateContent);
  contentRouter.delete('/:contentId', authMiddleware, contentController.deleteContent);
  
  router.use('/content', contentRouter);

  // Payment routes
  const paymentRouter = Router();
  paymentRouter.get('/vnpay-callback', paymentController.payCallbackHandler.bind(paymentController));
  
  router.use('/payment', paymentRouter);

  // Order routes
  const orderRouter = Router();
  orderRouter.post('/checkout', authMiddleware, orderController.checkoutOrder.bind(orderController));
  orderRouter.post('/processingPurchase', authMiddleware, orderController.processingPurchase.bind(orderController));
  
  router.use('/orders', orderRouter);

  // Health check route
  router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  console.log('✅ API routes configured successfully');
};