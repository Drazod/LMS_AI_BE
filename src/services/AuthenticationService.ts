import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { UserService } from './UserService';
import { VerificationTokenService } from './VerificationTokenService';
import { config } from '../config/config';
import { 
  RegisterRequest, 
  LoginRequest 
} from '../models/request';
import { 
  LoginResponse, 
  UserResponse 
} from '../models/response';
import { User, UserRole } from '../models/entities';

export class AuthenticationService {
  private userService: UserService;
  private verificationTokenService: VerificationTokenService;

  constructor() {
    this.userService = UserService.getInstance();
    this.verificationTokenService = new VerificationTokenService();
  }

  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<UserResponse | null> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(request.password, 12);
      
      // Create user object
      const userData: Partial<User> = {
        name: request.name,
        email: request.email,
        password: hashedPassword,
        firstName: request.firstName,
        lastName: request.lastName,
        phoneNumber: request.phoneNumber,
        role: request.role === 'INSTRUCTOR' ? UserRole.INSTRUCTOR : UserRole.STUDENT,
        activated: false
      };

      // Save user to database
      const savedUser = await this.userService.create(userData);
      if (!savedUser) {
        return null;
      }

      // Generate verification token
      await this.verificationTokenService.createVerificationToken(savedUser.userId, savedUser.email);

      // Return user response (without password)
      return {
        userId: savedUser.userId,
        name: savedUser.name,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        phoneNumber: savedUser.phoneNumber,
        userAddress: savedUser.userAddress,
        userCity: savedUser.userCity,
        userCountry: savedUser.userCountry,
        avtUrl: savedUser.avtUrl,
        role: savedUser.role,
        activated: savedUser.activated
      };

    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }

  /**
   * Authenticate user login
   */
  async authenticate(request: LoginRequest, response: Response): Promise<LoginResponse> {
    try {
      // Find user by email
      const user = await this.userService.findByEmail(request.email);
      if (!user) {
        throw new Error('User not found');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(request.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Incorrect password');
      }

      // Check if user is verified (if verification is required)
      // This would depend on your verification logic
      
      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Set HTTP-only cookies (optional)
      response.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Store refresh token in database (implement as needed)
      await this.userService.updateRefreshToken(user.userId, refreshToken);

      return {
        success: true,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          userAddress: user.userAddress,
          userCity: user.userCity,
          userCountry: user.userCountry,
          avtUrl: user.avtUrl,
          role: user.role,
          activated: user.activated
        },
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;
      
      // Find user
      const user = await this.userService.findById(decoded.userId);
      if (!user) {
        throw new Error('Invalid refresh token');
      }

      // Verify refresh token is still valid in database
      const isValidRefreshToken = await this.userService.verifyRefreshToken(user.userId, refreshToken);
      if (!isValidRefreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update refresh token in database
      await this.userService.updateRefreshToken(user.userId, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      return await this.verificationTokenService.verifyToken(token);
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: User): string {
    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role
    };
    const secret = config.jwt.secret as string;
    
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload = {
      userId: user.userId,
      email: user.email,
      type: 'refresh'
    };
    const secret = config.jwt.secret as string;
    
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  /**
   * Validate access token
   */
  public validateToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret as string);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}