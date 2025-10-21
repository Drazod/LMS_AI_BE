import { BaseEntity } from './base';
import { User } from './User';

// Role & Permission System
export interface Role extends BaseEntity {
  roleId: number;
  roleName: string;
  description?: string;
  permissions?: Permission[];
  users?: User[];
}

export interface Permission extends BaseEntity {
  permissionId: number;
  permissionName: string;
  description?: string;
  roles?: Role[];
}

// User Details Implementation (for Spring Security equivalent)
export interface UserDetailsImpl {
  userId: number;
  email: string;
  password: string;
  authorities: string[];
  isAccountNonExpired: boolean;
  isAccountNonLocked: boolean;
  isCredentialsNonExpired: boolean;
  isEnabled: boolean;
}