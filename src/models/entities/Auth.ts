import { BaseEntity } from './base';
import { User } from './User';

// Authentication & Token Entities
export interface RefreshToken extends BaseEntity {
  id: number;
  token: string;
  userId: number;
  user?: User;
  expiryDate: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface Token extends BaseEntity {
  id: number;
  token: string;
  tokenType: TokenType;
  userId: number;
  user?: User;
  expiryDate: Date;
  isRevoked: boolean;
  isConfirmed: boolean;
  createdAt: Date;
}

export enum TokenType {
  BEARER = 'BEARER',
  REFRESH = 'REFRESH',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION'
}

export interface VerificationToken extends BaseEntity {
  id: number;
  token: string;
  userId: number;
  user?: User;
  expiryDate: Date;
  isUsed: boolean;
  createdAt: Date;
}