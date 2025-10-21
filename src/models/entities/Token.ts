import { BaseEntity } from './BaseEntity';

// Authentication Token Entities
export interface Token extends BaseEntity {
  tokenId: number;  // Matches token_id in CSV
  token: string;  // Matches token in CSV
  tokenType: string;  // Matches token_type in CSV (BEARER, etc.)
  expired: boolean;  // Matches expired in CSV
  revoked: boolean;  // Matches revoked in CSV
  userId: number;  // Matches user_id in CSV
}

export interface RefreshToken extends BaseEntity {
  refreshTokenId: number;  // Matches refresh_token_id in CSV
  token: string;  // Matches token in CSV
  tokenType: string;  // Matches token_type in CSV (BEARER, etc.)
  expired: boolean;  // Matches expired in CSV
  revoked: boolean;  // Matches revoked in CSV
  userId: number;  // Matches user_id in CSV
}

export interface VerificationToken extends BaseEntity {
  verificationId: number;  // Matches verification_id in CSV
  token: string;  // Matches token in CSV
  issueAt: Date;  // Matches issue_at in CSV
  revoked: boolean;  // Matches revoked in CSV
  userId: number;  // Matches user_id in CSV
}

export enum TokenType {
  BEARER = 'BEARER',
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  VERIFICATION = 'VERIFICATION'
}