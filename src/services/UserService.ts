import { getConnection } from 'typeorm';
import { User, UserRole } from '../models/entities';

export class UserService {
  private static instance: UserService;

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const connection = getConnection();
      const result = await connection.query(
        'SELECT * FROM users WHERE email = $1 LIMIT 1',
        [email]
      );

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToUser(result[0]);
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Find user by name
   */
  async findByName(name: string): Promise<User | null> {
    try {
      const connection = getConnection();
      const result = await connection.query(
        'SELECT * FROM users WHERE name = $1 LIMIT 1',
        [name]
      );

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToUser(result[0]);
    } catch (error) {
      console.error('Error finding user by name:', error);
      return null;
    }
  }

  /**
   * Find user by ID
   */
  async findById(userId: number): Promise<User | null> {
    try {
      const connection = getConnection();
      const result = await connection.query(
        'SELECT * FROM users WHERE user_id = $1 LIMIT 1',
        [userId]
      );

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToUser(result[0]);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Create new user
   */
  async create(userData: Partial<User>): Promise<User | null> {
    try {
      const connection = getConnection();
      
      // Get next user_id
      const maxIdResult = await connection.query(
        'SELECT COALESCE(MAX(user_id), 0) + 1 as next_id FROM users'
      );
      const nextUserId = maxIdResult[0].next_id;

      const result = await connection.query(`
        INSERT INTO users (
          user_id, name, email, password, first_name, last_name, 
          phone_number, user_address, user_city, user_country, 
          user_role, created_at, activated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), true)
        RETURNING *
      `, [
        nextUserId,
        userData.name || '',
        userData.email || '',
        userData.password || '',
        userData.firstName || null,
        userData.lastName || null,
        userData.phoneNumber || null,
        userData.userAddress || null,
        userData.userCity || null,
        userData.userCountry || null,
        userData.role || UserRole.STUDENT
      ]);

      return this.mapRowToUser(result[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  /**
   * Update user
   */
  async update(userId: number, updateData: Partial<User>): Promise<User | null> {
    try {
      const connection = getConnection();
      
      const setParts: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateData.name) {
        setParts.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.email) {
        setParts.push(`email = $${paramCount++}`);
        values.push(updateData.email);
      }
      if (updateData.firstName) {
        setParts.push(`first_name = $${paramCount++}`);
        values.push(updateData.firstName);
      }
      if (updateData.lastName) {
        setParts.push(`last_name = $${paramCount++}`);
        values.push(updateData.lastName);
      }
      if (updateData.phoneNumber) {
        setParts.push(`phone_number = $${paramCount++}`);
        values.push(updateData.phoneNumber);
      }

      if (setParts.length === 0) {
        return await this.findById(userId);
      }

      values.push(userId);
      
      const result = await connection.query(`
        UPDATE users 
        SET ${setParts.join(', ')}, updated_at = NOW()
        WHERE user_id = $${paramCount}
        RETURNING *
      `, values);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToUser(result[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  /**
   * Get all users with pagination
   */
  async findAll(page: number = 0, size: number = 10): Promise<{ users: User[]; total: number }> {
    try {
      const connection = getConnection();
      
      // Get total count
      const countResult = await connection.query('SELECT COUNT(*) as total FROM users');
      const total = parseInt(countResult[0].total);

      // Get paginated results
      const offset = page * size;
      const result = await connection.query(
        'SELECT * FROM users ORDER BY user_id LIMIT $1 OFFSET $2',
        [size, offset]
      );

      const users = result.map((row: any) => this.mapRowToUser(row));
      
      return { users, total };
    } catch (error) {
      console.error('Error finding all users:', error);
      return { users: [], total: 0 };
    }
  }

  /**
   * Update refresh token (placeholder for now)
   */
  async updateRefreshToken(userId: number, refreshToken: string): Promise<void> {
    console.log(`Updating refresh token for user ${userId}`);
    // TODO: Add refresh_token field to database schema and implement
  }

  /**
   * Verify refresh token (placeholder for now)
   */
  async verifyRefreshToken(userId: number, refreshToken: string): Promise<boolean> {
    console.log(`Verifying refresh token for user ${userId}`);
    // TODO: Implement refresh token verification from database
    return true;
  }

  /**
   * Search users by criteria
   */
  async search(criteria: {
    name?: string;
    email?: string;
    role?: string;
  }): Promise<User[]> {
    try {
      const connection = getConnection();
      
      const whereConditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (criteria.name) {
        whereConditions.push(`name ILIKE $${paramCount++}`);
        values.push(`%${criteria.name}%`);
      }
      if (criteria.email) {
        whereConditions.push(`email ILIKE $${paramCount++}`);
        values.push(`%${criteria.email}%`);
      }
      if (criteria.role) {
        whereConditions.push(`user_role = $${paramCount++}`);
        values.push(criteria.role);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const result = await connection.query(
        `SELECT * FROM users ${whereClause} ORDER BY user_id`,
        values
      );

      return result.map((row: any) => this.mapRowToUser(row));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Delete user
   */
  async delete(userId: number): Promise<boolean> {
    try {
      const connection = getConnection();
      const result = await connection.query('DELETE FROM users WHERE user_id = $1', [userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    try {
      const connection = getConnection();
      
      const results = await Promise.all([
        connection.query("SELECT COUNT(*) as count FROM users"),
        connection.query("SELECT COUNT(*) as count FROM users WHERE user_role = 'STUDENT'"),
        connection.query("SELECT COUNT(*) as count FROM users WHERE user_role = 'INSTRUCTOR'"),
        connection.query("SELECT COUNT(*) as count FROM users WHERE user_role = 'ADMIN'"),
        connection.query("SELECT COUNT(*) as count FROM courses"),
      ]);

      return {
        totalUsers: parseInt(results[0][0].count),
        totalStudents: parseInt(results[1][0].count),
        totalInstructors: parseInt(results[2][0].count),
        totalAdmins: parseInt(results[3][0].count),
        totalCourses: parseInt(results[4][0].count)
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalUsers: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalAdmins: 0,
        totalCourses: 0
      };
    }
  }

  /**
   * Map database row to User interface
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.user_id, // Use user_id as the main id
      userId: row.user_id,
      name: row.name,
      email: row.email,
      password: row.password,
      firstName: row.first_name,
      lastName: row.last_name,
      phoneNumber: row.phone_number,
      userAddress: row.user_address,
      userCity: row.user_city,
      userCountry: row.user_country,
      userPostalCode: row.user_postal_code,
      role: row.user_role as UserRole,
      activated: row.activated || false,
      avtUrl: row.avt_url,
      publicAvtId: row.public_avt_id
    } as User;
  }
}