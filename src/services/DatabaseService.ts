import { getConnection, getRepository, Repository } from 'typeorm';
import { UserEntity } from '../models/entities/UserEntity';
import { CourseEntity } from '../models/entities/CourseEntity';

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get User Repository
   */
  getUserRepository(): Repository<UserEntity> {
    return getRepository(UserEntity);
  }

  /**
   * Get Course Repository  
   */
  getCourseRepository(): Repository<CourseEntity> {
    return getRepository(CourseEntity);
  }

  /**
   * Execute raw query
   */
  async executeQuery(query: string, parameters?: any[]): Promise<any> {
    const connection = getConnection();
    return await connection.query(query, parameters);
  }

  /**
   * Start a database transaction
   */
  async executeTransaction<T>(
    operation: (repositories: {
      userRepo: Repository<UserEntity>;
      courseRepo: Repository<CourseEntity>;
    }) => Promise<T>
  ): Promise<T> {
    const connection = getConnection();
    return await connection.transaction(async (transactionalEntityManager) => {
      const userRepo = transactionalEntityManager.getRepository(UserEntity);
      const courseRepo = transactionalEntityManager.getRepository(CourseEntity);
      
      return await operation({ userRepo, courseRepo });
    });
  }
}