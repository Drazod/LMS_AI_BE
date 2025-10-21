import { getConnection } from 'typeorm';
import { Cart, CartItem } from '../models/entities';
import { CourseResponse, PageResponse } from '../models/response';

export class CartService {
  private static instance: CartService;

  public static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  /**
   * Create cart for student
   */
  async createCart(studentId: number): Promise<Cart | null> {
    try {
      const connection = getConnection();
      
      // Check if cart already exists
      const existingCart = await connection.query(
        'SELECT * FROM carts WHERE student_id = $1 LIMIT 1',
        [studentId]
      );

      if (existingCart.length > 0) {
        return this.mapRowToCart(existingCart[0]);
      }

      // Get next cart_id
      const maxIdResult = await connection.query(
        'SELECT COALESCE(MAX(cart_id), 0) + 1 as next_id FROM carts'
      );
      const nextCartId = maxIdResult[0].next_id;

      const result = await connection.query(`
        INSERT INTO carts (cart_id, student_id, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `, [nextCartId, studentId]);

      return this.mapRowToCart(result[0]);
    } catch (error) {
      console.error('Error creating cart:', error);
      return null;
    }
  }

  /**
   * Add course to cart
   */
  async addCourseToCart(studentId: number, courseId: number): Promise<CartItem | null> {
    try {
      const connection = getConnection();
      
      // Get or create cart
      let cart = await this.getCartByStudentId(studentId);
      if (!cart) {
        cart = await this.createCart(studentId);
        if (!cart) return null;
      }

      // Check if course already in cart
      const existingItem = await connection.query(
        'SELECT * FROM cart_items WHERE cart_id = $1 AND course_id = $2',
        [cart.cartId, courseId]
      );

      if (existingItem.length > 0) {
        return this.mapRowToCartItem(existingItem[0]);
      }

      // Add course to cart
      const result = await connection.query(`
        INSERT INTO cart_items (cart_id, course_id)
        VALUES ($1, $2)
        RETURNING *
      `, [cart.cartId, courseId]);

      return this.mapRowToCartItem(result[0]);
    } catch (error) {
      console.error('Error adding course to cart:', error);
      return null;
    }
  }

  /**
   * Get courses from cart with pagination
   */
  async getListCourseFromCart(studentId: number, page: number, size: number): Promise<PageResponse<any>> {
    try {
      const connection = getConnection();
      
      // First get the cart for this student
      const cart = await this.getCartByStudentId(studentId);
      if (!cart) {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: page,
          size,
          hasNext: false,
          hasPrevious: false,
          isFirst: true,
          isLast: true
        };
      }

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM cart_items ci
        WHERE ci.cart_id = $1
      `;
      const countResult = await connection.query(countQuery, [cart.cartId]);
      const totalElements = parseInt(countResult[0].total);

      // Get courses with pagination
      const offset = page * size;
      const coursesQuery = `
        SELECT 
          c.course_id,
          c.title,
          c.description,
          c.price,
          c.course_thumbnail,
          c.avg_rating,
          c.total_rating,
          c.status,
          c.created_at as course_created_at,
          u.user_id as instructor_id,
          u.name as instructor_name,
          u.email as instructor_email,
          u.avt_url as instructor_avt_url,
          cat.category_id,
          cat.category_name
        FROM cart_items ci
        INNER JOIN courses c ON ci.course_id = c.course_id
        LEFT JOIN users u ON c.instructor_id = u.user_id
        LEFT JOIN categories cat ON c.category_id = cat.category_id
        WHERE ci.cart_id = $1
        ORDER BY c.course_id ASC
        LIMIT $2 OFFSET $3
      `;

      const coursesResult = await connection.query(coursesQuery, [cart.cartId, size, offset]);

      // Map results to proper format
      const content = coursesResult.map((row: any) => ({
        courseId: row.course_id,
        title: row.title,
        description: row.description,
        price: parseFloat(row.price),
        courseThumbnail: row.course_thumbnail || '',
        avgRating: row.avg_rating ? parseFloat(row.avg_rating) : 0,
        totalRating: row.total_rating || 0,
        status: row.status,
        addedAt: row.added_at,
        createdAt: row.course_created_at,
        instructor: {
          userId: row.instructor_id,
          name: row.instructor_name,
          email: row.instructor_email,
          avtUrl: row.instructor_avt_url
        },
        category: {
          categoryId: row.category_id,
          name: row.category_name
        }
      }));

      const totalPages = Math.ceil(totalElements / size);

      return {
        content,
        totalElements,
        totalPages,
        currentPage: page,
        size,
        hasNext: (page + 1) < totalPages,
        hasPrevious: page > 0,
        isFirst: page === 0,
        isLast: (page + 1) >= totalPages
      };
    } catch (error) {
      console.error('Error getting cart courses:', error);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: page,
        size,
        hasNext: false,
        hasPrevious: false,
        isFirst: true,
        isLast: true
      };
    }
  }

  /**
   * Remove course from cart
   */
  async removeCourseFromCart(studentId: number, courseId: number): Promise<void> {
    try {
      const connection = getConnection();
      
      // First get the cart for this student
      const cart = await this.getCartByStudentId(studentId);
      if (!cart) {
        throw new Error('Cart not found for student');
      }

      // Remove the specific course from cart items
      await connection.query(`
        DELETE FROM cart_items 
        WHERE cart_id = $1 AND course_id = $2
      `, [cart.cartId, courseId]);

      console.log(`Successfully removed course ${courseId} from cart for student ${studentId}`);
    } catch (error) {
      console.error('Error removing course from cart:', error);
      throw error;
    }
  }

  /**
   * Clear cart
   */
  async clearCart(studentId: number): Promise<void> {
    try {
      const connection = getConnection();
      
      // First get the cart for this student
      const cart = await this.getCartByStudentId(studentId);
      if (!cart) {
        throw new Error('Cart not found for student');
      }

      // Remove all items from the cart
      await connection.query(`
        DELETE FROM cart_items 
        WHERE cart_id = $1
      `, [cart.cartId]);

      console.log(`Successfully cleared cart for student ${studentId}`);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Get cart total amount
   */
  async getCartTotal(studentId: number): Promise<number> {
    try {
      const connection = getConnection();
      
      // First get the cart for this student
      const cart = await this.getCartByStudentId(studentId);
      if (!cart) {
        return 0;
      }

      // Calculate total from actual cart items
      const totalQuery = `
        SELECT COALESCE(SUM(c.price), 0) as total
        FROM cart_items ci
        INNER JOIN courses c ON ci.course_id = c.course_id
        WHERE ci.cart_id = $1
      `;

      const result = await connection.query(totalQuery, [cart.cartId]);
      const total = parseFloat(result[0].total) || 0;

      return total;
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return 0;
    }
  }

  /**
   * Get cart by student ID
   */
  async getCartByStudentId(studentId: number): Promise<Cart | null> {
    try {
      const connection = getConnection();
      
      const result = await connection.query(
        'SELECT * FROM carts WHERE student_id = $1 LIMIT 1',
        [studentId]
      );

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToCart(result[0]);
    } catch (error) {
      console.error('Error getting cart by student ID:', error);
      return null;
    }
  }

  /**
   * Map database row to Cart interface
   */
  private mapRowToCart(row: any): Cart {
    return {
      id: row.cart_id,
      cartId: row.cart_id,
      studentId: row.student_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cartItems: [] // Will be populated separately if needed
    } as Cart;
  }

  /**
   * Map database row to CartItem interface
   */
  private mapRowToCartItem(row: any): CartItem {
    return {
      cartId: row.cart_id,
      courseId: row.course_id
      // Note: added_at column doesn't exist in the current database schema
    } as CartItem;
  }
}