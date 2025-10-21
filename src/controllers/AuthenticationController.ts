import { Request, Response } from 'express';
// Remove express-validator for now - will implement custom validation
import { AuthenticationService } from '../services/AuthenticationService';
import { EmailService } from '../services/EmailService';
import { UserService } from '../services/UserService';
import { 
  ApiResponse, 
  LoginResponse, 
  UserResponse,
  ErrorResponse 
} from '../models/response';
import { 
  RegisterRequest, 
  LoginRequest, 
  RefreshTokenRequest 
} from '../models/request';

export class AuthenticationController {
  constructor(
    private authService: AuthenticationService,
    private emailService: EmailService,
    private userService: UserService
  ) {}

  /**
   * Register a new user (student or instructor)
   * POST /api/auth/register
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Simple validation - will implement detailed validation later
      if (!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName) {
        res.status(400).json({
          success: false,
          message: 'All fields (email, password, firstName, lastName) are required'
        } as ApiResponse);
        return;
      }

      const registerData: RegisterRequest = req.body;

      // Check for existing email
      const existingEmail = await this.userService.findByEmail(registerData.email);
      if (existingEmail) {
        res.status(400).json({
          success: false,
          error: { message: 'Email has already been used' },
          message: 'Registration failed'
        } as ApiResponse);
        return;
      }

      // Check for existing username
      const existingName = await this.userService.findByName(registerData.name);
      if (existingName) {
        res.status(400).json({
          success: false,
          error: { message: 'Name has already been used' },
          message: 'Registration failed'
        } as ApiResponse);
        return;
      }

      // Register the user
      const userResponse = await this.authService.register(registerData);
      if (!userResponse) {
        res.status(500).json({
          success: false,
          error: 'Failed to create user account',
          message: 'Internal server error'
        } as ApiResponse);
        return;
      }

      // Send verification email based on role
      let emailSent = false;
      if (registerData.role === 'STUDENT') {
        emailSent = await this.emailService.sendEmailToStudent(registerData.email);
      } else if (registerData.role === 'INSTRUCTOR') {
        emailSent = await this.emailService.sendEmailToInstructor(registerData.email);
      }

      if (emailSent) {
        res.status(200).json({
          success: true,
          data: userResponse,
          message: 'Registration successful. Please check your email to complete account verification.'
        } as ApiResponse<UserResponse>);
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to send verification email',
          message: 'Registration completed but email verification failed'
        } as ApiResponse);
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message === 'Invalid user role') {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid user role' },
          message: 'Registration failed'
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Registration failed'
        } as ApiResponse);
      }
    }
  };

  /**
   * Authenticate user login
   * POST /api/auth/login
   */
  public authenticate = async (req: Request, res: Response): Promise<void> => {
    try {
      // Simple validation - will implement detailed validation later
      if (!req.body.email || !req.body.password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        } as ApiResponse);
        return;
      }

      const loginData: LoginRequest = req.body;
      
      const loginResponse = await this.authService.authenticate(loginData, res);
      
      res.status(200).json({
        success: true,
        data: loginResponse,
        message: 'Login successful'
      } as ApiResponse<LoginResponse>);

    } catch (error: any) {
      console.error('Authentication error:', error);
      
      if (error.message === 'Incorrect password') {
        res.status(400).json({
          success: false,
          error: 'Incorrect email or password',
          message: 'Authentication failed'
        } as ApiResponse);
      } else if (error.message === 'User not found') {
        res.status(400).json({
          success: false,
          error: 'Incorrect email or password',
          message: 'Authentication failed'
        } as ApiResponse);
      } else if (error.message === 'Account not verified') {
        res.status(400).json({
          success: false,
          error: 'Account not verified. Please check your email.',
          message: 'Authentication failed'
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Authentication failed'
        } as ApiResponse);
      }
    }
  };

  /**
   * Refresh JWT token
   * POST /api/auth/refresh-token
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshTokenData: RefreshTokenRequest = req.body;
      
      if (!refreshTokenData.refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
          message: 'Token refresh failed'
        } as ApiResponse);
        return;
      }

      const newTokens = await this.authService.refreshToken(refreshTokenData.refreshToken);
      
      res.status(200).json({
        success: true,
        data: newTokens,
        message: 'Token refreshed successfully'
      } as ApiResponse);

    } catch (error: any) {
      console.error('Token refresh error:', error);
      
      if (error.message === 'Invalid refresh token') {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token',
          message: 'Token refresh failed'
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Token refresh failed'
        } as ApiResponse);
      }
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Clear HTTP-only cookies if using them
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      } as ApiResponse);

    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Logout failed'
      } as ApiResponse);
    }
  };

  /**
   * Verify email with token
   * GET /api/auth/verify-email?token=...
   */
  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Verification token is required',
          message: 'Email verification failed'
        } as ApiResponse);
        return;
      }

      const verificationResult = await this.authService.verifyEmail(token);
      
      if (verificationResult) {
        res.status(200).json({
          success: true,
          message: 'Email verified successfully'
        } as ApiResponse);
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token',
          message: 'Email verification failed'
        } as ApiResponse);
      }

    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Email verification failed'
      } as ApiResponse);
    }
  };

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  public resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
          message: 'Resend verification failed'
        } as ApiResponse);
        return;
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'Resend verification failed'
        } as ApiResponse);
        return;
      }

      const emailSent = await this.emailService.sendVerificationEmail(email);
      
      if (emailSent) {
        res.status(200).json({
          success: true,
          message: 'Verification email sent successfully'
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to send verification email',
          message: 'Resend verification failed'
        } as ApiResponse);
      }

    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Resend verification failed'
      } as ApiResponse);
    }
  };
}